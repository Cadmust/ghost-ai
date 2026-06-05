import { logger, task } from "@trigger.dev/sdk";
import { Liveblocks } from "@liveblocks/node";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { OpenRouter } from "@openrouter/sdk";
import {
  AI_AGENT_COLOR,
  AI_AGENT_NAME,
  AI_AGENT_USER_ID,
  type AiStatusEvent,
} from "../liveblocks.config";
import {
  NODE_COLOR_THEMES,
  SHAPE_DEFAULT_SIZES,
  type CanvasEdge,
  type CanvasNode,
  type Shape,
} from "../types/canvas";

/**
 * Durable background task that turns a natural-language prompt into a system
 * design on the shared canvas.
 *
 * Flow:
 *  1. Set the AI agent's ephemeral presence (cursor + thinking) so participants
 *     can see Ghost AI is active, and broadcast a "started" status.
 *  2. Ask OpenRouter (nemotron-3-nano free model) to interpret the prompt into a
 *     structured list of canvas actions, given the current canvas state.
 *  3. Sanitize each action against the allowed shapes, colour palette, and
 *     layout rules, then apply it through `mutateFlow` — the same Liveblocks
 *     Storage the collaborative canvas reads via `useLiveblocksFlow`.
 *  4. Broadcast a "processing" status per applied action and move the agent's
 *     cursor so its activity is visible, then a final "complete" status.
 *  5. On any failure, broadcast an "error" status.
 *  6. Always clear the AI presence when the task finishes.
 *
 * See context/feature-specs/23-design-agent-logic.md.
 */
export interface DesignAgentPayload {
  /** Project the canvas belongs to. */
  projectId: string;
  /** Liveblocks room hosting the collaborative canvas. */
  roomId: string;
  /** Natural-language description of the system to generate. */
  prompt: string;
}

// Model id as named in the feature spec (free Nemotron nano on OpenRouter).
const MODEL = "nvidia/nemotron-3-nano-30b-a3b:free";

// The agent only ever produces nodes/edges that conform to the canvas schema,
// so the rules below are mirrored both in the model prompt and in server-side
// sanitization (the model output is never trusted blindly).
const ALLOWED_SHAPES: Shape[] = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
];

// Layout grid used when the model omits or supplies invalid coordinates, and to
// space generated nodes so they don't overlap.
const LAYOUT = {
  originX: 120,
  originY: 120,
  colGap: 260,
  rowGap: 180,
  perRow: 4,
} as const;

// ---------------------------------------------------------------------------
// AI action contract
// ---------------------------------------------------------------------------

type AiAction =
  | { action: "addNode"; id: string; label: string; shape?: string; color?: string; x?: number; y?: number }
  | { action: "moveNode"; id: string; x: number; y: number }
  | { action: "resizeNode"; id: string; width: number; height: number }
  | { action: "updateNodeData"; id: string; label?: string; shape?: string; color?: string }
  | { action: "deleteNode"; id: string }
  | { action: "addEdge"; id?: string; source: string; target: string; label?: string }
  | { action: "deleteEdge"; id: string };

interface AiPlan {
  summary?: string;
  actions: AiAction[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLiveblocks(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  }
  return new Liveblocks({ secret });
}

/** Pick a palette theme by colour name (case-insensitive), defaulting to Slate. */
function resolveTheme(color: string | undefined) {
  if (color) {
    const match = NODE_COLOR_THEMES.find(
      (theme) => theme.name.toLowerCase() === color.toLowerCase(),
    );
    if (match) return match;
  }
  return NODE_COLOR_THEMES[0];
}

function resolveShape(shape: string | undefined): Shape {
  if (shape && (ALLOWED_SHAPES as string[]).includes(shape)) {
    return shape as Shape;
  }
  return "rectangle";
}

/** Snap a node onto the layout grid based on its creation order. */
function gridPosition(index: number) {
  const col = index % LAYOUT.perRow;
  const row = Math.floor(index / LAYOUT.perRow);
  return {
    x: LAYOUT.originX + col * LAYOUT.colGap,
    y: LAYOUT.originY + row * LAYOUT.rowGap,
  };
}

function buildSystemPrompt(): string {
  return [
    "You are Ghost AI, a system-design assistant that edits a collaborative architecture canvas.",
    "Translate the user's request into a list of canvas actions. Respond with JSON only.",
    "",
    "Output schema:",
    '{ "summary": string, "actions": Action[] }',
    "where each Action is one of:",
    '- { "action": "addNode", "id": string, "label": string, "shape"?: string, "color"?: string, "x"?: number, "y"?: number }',
    '- { "action": "moveNode", "id": string, "x": number, "y": number }',
    '- { "action": "resizeNode", "id": string, "width": number, "height": number }',
    '- { "action": "updateNodeData", "id": string, "label"?: string, "shape"?: string, "color"?: string }',
    '- { "action": "deleteNode", "id": string }',
    '- { "action": "addEdge", "id"?: string, "source": string, "target": string, "label"?: string }',
    '- { "action": "deleteEdge", "id": string }',
    "",
    `Allowed shapes: ${ALLOWED_SHAPES.join(", ")}.`,
    "Use shapes meaningfully: rectangle for services/apps, cylinder for databases/storage,",
    "diamond for decisions/gateways, hexagon for queues/brokers, circle for clients/users, pill for external APIs.",
    `Allowed colors (use the name): ${NODE_COLOR_THEMES.map((t) => t.name).join(", ")}.`,
    "Group related components with the same color.",
    "",
    "Layout rules:",
    "- Lay components out left-to-right following the request flow.",
    "- Space nodes at least 240px apart horizontally and 160px vertically; never overlap nodes.",
    "- Prefer a tidy grid. Coordinates are optional; omit them to let the canvas auto-place.",
    "- For addNode, choose short, stable ids (e.g. \"api-gateway\") and reference those same ids in edges.",
    "- Connect nodes with edges that reflect real data/request flow.",
    "- Keep the design focused: typically 4-10 nodes unless the user asks for more.",
    "",
    "When the user asks to extend an existing design, reuse the ids already on the canvas",
    "and only add what is missing. Return an empty actions array if nothing should change.",
  ].join("\n");
}

function buildUserPrompt(
  prompt: string,
  nodes: readonly CanvasNode[],
  edges: readonly CanvasEdge[],
): string {
  const nodeSummary = nodes.map((n) => ({
    id: n.id,
    label: n.data?.label ?? "",
    shape: n.data?.shape ?? "rectangle",
  }));
  const edgeSummary = edges.map((e) => ({ id: e.id, source: e.source, target: e.target }));

  return [
    `User request: ${prompt}`,
    "",
    "Current canvas nodes:",
    JSON.stringify(nodeSummary),
    "Current canvas edges:",
    JSON.stringify(edgeSummary),
  ].join("\n");
}

/** Extract a JSON object from a model response that may include code fences. */
function extractJson(content: string): unknown {
  const trimmed = content.trim();
  // Strip markdown fences if the model wrapped the JSON.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  // Fall back to the first {...} block if there is leading/trailing prose.
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  const slice = start !== -1 && end !== -1 ? candidate.slice(start, end + 1) : candidate;
  return JSON.parse(slice);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePlan(raw: unknown): AiPlan {
  if (!isRecord(raw) || !Array.isArray(raw.actions)) {
    return { actions: [] };
  }
  const actions = raw.actions.filter(isRecord) as unknown as AiAction[];
  return {
    summary: typeof raw.summary === "string" ? raw.summary : undefined,
    actions,
  };
}

async function interpretPrompt(
  prompt: string,
  nodes: readonly CanvasNode[],
  edges: readonly CanvasEdge[],
): Promise<AiPlan> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const openRouter = new OpenRouter({ apiKey });

  const result = await openRouter.chat.send({
    chatRequest: {
      model: MODEL,
      stream: false,
      temperature: 0.4,
      responseFormat: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(prompt, nodes, edges) },
      ],
    },
  });

  const content = result.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("AI returned an empty response");
  }

  return parsePlan(extractJson(content));
}

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

export const designAgentTask = task({
  id: "design-agent",
  run: async (payload: DesignAgentPayload, { ctx }) => {
    const { roomId, prompt } = payload;
    const liveblocks = getLiveblocks();
    const runId = ctx.run.id;

    const broadcast = async (event: Omit<AiStatusEvent, "type" | "runId">) => {
      try {
        await liveblocks.broadcastEvent(roomId, { type: "ai-status", runId, ...event });
      } catch (error) {
        // Status feed is best-effort; never let it fail the run.
        logger.warn("Failed to broadcast AI status", { error: String(error) });
      }
    };

    // Set / refresh the AI agent's ephemeral presence so its cursor and thinking
    // state are visible to every participant through the existing presence flow.
    const setPresence = async (cursor: { x: number; y: number } | null, thinking: boolean) => {
      try {
        await liveblocks.setPresence(roomId, {
          userId: AI_AGENT_USER_ID,
          data: { cursor, thinking },
          userInfo: { name: AI_AGENT_NAME, avatar: "", color: AI_AGENT_COLOR },
          ttl: 120,
        });
      } catch (error) {
        logger.warn("Failed to set AI presence", { error: String(error) });
      }
    };

    const clearPresence = async () => {
      // Drop the thinking state and cursor; the ephemeral entry expires on its
      // own, but clearing it immediately removes the AI cursor for everyone.
      try {
        await liveblocks.setPresence(roomId, {
          userId: AI_AGENT_USER_ID,
          data: { cursor: null, thinking: false },
          userInfo: { name: AI_AGENT_NAME, avatar: "", color: AI_AGENT_COLOR },
          ttl: 2,
        });
      } catch (error) {
        logger.warn("Failed to clear AI presence", { error: String(error) });
      }
    };

    logger.info("Design agent started", { roomId, prompt });

    await setPresence({ x: LAYOUT.originX, y: LAYOUT.originY }, true);
    await broadcast({ phase: "started", message: "Ghost AI is reading your prompt…" });

    try {
      // Read the current canvas so the model can extend an existing design.
      let currentNodes: readonly CanvasNode[] = [];
      let currentEdges: readonly CanvasEdge[] = [];
      await mutateFlow<CanvasNode, CanvasEdge>({ client: liveblocks, roomId }, (flow) => {
        currentNodes = flow.nodes;
        currentEdges = flow.edges;
      });

      await broadcast({ phase: "processing", message: "Designing your architecture…" });

      const plan = await interpretPrompt(prompt, currentNodes, currentEdges);
      logger.info("AI plan", { actionCount: plan.actions.length, summary: plan.summary });

      if (plan.actions.length === 0) {
        await broadcast({
          phase: "complete",
          message: plan.summary ?? "No canvas changes were needed.",
        });
        return { status: "complete" as const, applied: 0, summary: plan.summary };
      }

      // Track how many nodes have been added so new nodes without coordinates are
      // placed on the layout grid without overlapping.
      let placedCount = currentNodes.length;
      let applied = 0;
      // Remember the last touched position so the AI cursor visibly follows its
      // own edits across the canvas.
      let lastPosition: { x: number; y: number } = {
        x: LAYOUT.originX,
        y: LAYOUT.originY,
      };

      // Apply all actions inside a single mutateFlow so the whole design lands
      // as one collaborative update for every connected client.
      await mutateFlow<CanvasNode, CanvasEdge>({ client: liveblocks, roomId }, (flow) => {
        for (const action of plan.actions) {
          try {
            switch (action.action) {
              case "addNode": {
                if (!action.id || !action.label) break;
                const shape = resolveShape(action.shape);
                const theme = resolveTheme(action.color);
                const size = SHAPE_DEFAULT_SIZES[shape];
                const position =
                  typeof action.x === "number" && typeof action.y === "number"
                    ? { x: action.x, y: action.y }
                    : gridPosition(placedCount);
                placedCount += 1;
                lastPosition = position;
                flow.addNode({
                  id: action.id,
                  type: "canvasNode",
                  position,
                  width: size.width,
                  height: size.height,
                  data: {
                    label: action.label,
                    shape,
                    color: theme.bg,
                    textColor: theme.text,
                  },
                });
                applied += 1;
                break;
              }
              case "moveNode": {
                if (!flow.getNode(action.id)) break;
                if (typeof action.x !== "number" || typeof action.y !== "number") break;
                lastPosition = { x: action.x, y: action.y };
                flow.updateNode(action.id, { position: { x: action.x, y: action.y } });
                applied += 1;
                break;
              }
              case "resizeNode": {
                if (!flow.getNode(action.id)) break;
                if (typeof action.width !== "number" || typeof action.height !== "number") break;
                flow.updateNode(action.id, {
                  width: Math.max(80, action.width),
                  height: Math.max(60, action.height),
                });
                applied += 1;
                break;
              }
              case "updateNodeData": {
                if (!flow.getNode(action.id)) break;
                const patch: Record<string, unknown> = {};
                if (typeof action.label === "string") patch.label = action.label;
                if (typeof action.shape === "string") patch.shape = resolveShape(action.shape);
                if (typeof action.color === "string") {
                  const theme = resolveTheme(action.color);
                  patch.color = theme.bg;
                  patch.textColor = theme.text;
                }
                if (Object.keys(patch).length === 0) break;
                flow.updateNodeData(action.id, patch);
                applied += 1;
                break;
              }
              case "deleteNode": {
                if (!flow.getNode(action.id)) break;
                flow.removeNode(action.id);
                // Drop dangling edges so the graph stays consistent.
                for (const edge of flow.edges) {
                  if (edge.source === action.id || edge.target === action.id) {
                    flow.removeEdge(edge.id);
                  }
                }
                applied += 1;
                break;
              }
              case "addEdge": {
                if (!action.source || !action.target) break;
                if (!flow.getNode(action.source) || !flow.getNode(action.target)) break;
                const id = action.id ?? `edge-${action.source}-${action.target}`;
                flow.addEdge({
                  id,
                  type: "canvasEdge",
                  source: action.source,
                  target: action.target,
                  sourceHandle: "right-source",
                  targetHandle: "left-target",
                  data: action.label ? { label: action.label } : undefined,
                });
                applied += 1;
                break;
              }
              case "deleteEdge": {
                if (!flow.getEdge(action.id)) break;
                flow.removeEdge(action.id);
                applied += 1;
                break;
              }
              default:
                break;
            }
          } catch (error) {
            // Skip a malformed action without aborting the whole plan.
            logger.warn("Skipped invalid AI action", { action, error: String(error) });
          }
        }
      });

      // Move the AI cursor to where it finished working, then report progress.
      await setPresence(lastPosition, true);
      await broadcast({
        phase: "processing",
        message: `Applied ${applied} ${applied === 1 ? "change" : "changes"} to the canvas.`,
      });

      await broadcast({
        phase: "complete",
        message: plan.summary ?? "Ghost AI finished updating the canvas.",
      });

      logger.info("Design agent complete", { applied });
      return { status: "complete" as const, applied, summary: plan.summary };
    } catch (error) {
      logger.error("Design agent failed", { error: String(error) });
      await broadcast({
        phase: "error",
        message: "Ghost AI couldn't finish that request. Please try again.",
      });
      throw error;
    } finally {
      // Always clear the AI presence so its cursor/thinking state disappears.
      await clearPresence();
    }
  },
});
