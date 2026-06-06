import { logger, metadata, task } from "@trigger.dev/sdk";
import { OpenRouter } from "@openrouter/sdk";
import { put } from "@vercel/blob";
import { z } from "zod";
import { AI_STATUS_FEED, type AiStatusPhase } from "../types/tasks";
import { Liveblocks } from "@liveblocks/node";
import prisma from "../lib/prisma";

/**
 * Durable background task that turns the collaborative canvas (nodes + edges)
 * and the room chat history into a Markdown technical specification.
 *
 * Flow:
 *  1. Validate the payload with Zod (the canvas graph + chat context).
 *  2. Broadcast a "started" / "processing" status to the shared
 *     `ai-status-feed` so every participant can follow progress in real time
 *     (canvas status pill + AI sidebar), and update the run metadata so the
 *     client tracking via `useRealtimeRun` can reflect progress.
 *  3. Ask OpenRouter (nemotron-3-nano free model) to write a Markdown spec from
 *     the canvas graph and chat context.
 *  4. Broadcast a final "complete" (or "error") status and return the generated
 *     Markdown as the task output.
 *
 * Mirrors the design-agent task patterns (retries, logging, best-effort status
 * broadcasting, OpenRouter usage). See
 * context/feature-specs/27-spec-generation-flow.md.
 */

// Model id as named in the design-agent task (free Nemotron nano on OpenRouter).
const MODEL = "nvidia/nemotron-3-nano-30b-a3b:free";

// ---------------------------------------------------------------------------
// Payload validation
// ---------------------------------------------------------------------------

const chatMessageSchema = z.object({
  sender: z.string().optional(),
  role: z.string().optional(),
  content: z.string(),
});

const nodeSchema = z
  .object({
    id: z.string(),
    data: z
      .object({
        label: z.string().optional(),
        shape: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const edgeSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    data: z
      .object({
        label: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const generateSpecPayloadSchema = z.object({
  /** Project the canvas belongs to. */
  projectId: z.string().min(1),
  /** Liveblocks room hosting the collaborative canvas. */
  roomId: z.string().min(1),
  /** Room chat history that frames the design intent. */
  chatHistory: z.array(chatMessageSchema).default([]),
  /** Current canvas nodes. */
  nodes: z.array(nodeSchema).default([]),
  /** Current canvas edges. */
  edges: z.array(edgeSchema).default([]),
});

/**
 * Trigger payload. The canvas graph and chat history arrive untrusted from the
 * API route and are normalized/validated by {@link generateSpecPayloadSchema}
 * inside `run`, so the public input type keeps the arrays loose.
 */
export interface GenerateSpecPayload {
  projectId: string;
  roomId: string;
  chatHistory?: unknown[];
  nodes?: unknown[];
  edges?: unknown[];
}

type ParsedPayload = z.output<typeof generateSpecPayloadSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLiveblocks(): Liveblocks | null {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    return null;
  }
  return new Liveblocks({ secret });
}

/** Strip markdown code fences if the model wrapped the whole document. */
function unwrapMarkdown(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:markdown|md)?\s*([\s\S]*?)```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function buildSystemPrompt(): string {
  return [
    "You are Ghost AI, a senior software architect.",
    "Write a clear, well-structured technical specification in GitHub-flavored Markdown",
    "from an architecture canvas (nodes and edges) and the team's chat discussion.",
    "",
    "Requirements:",
    "- Output Markdown only. Do not wrap the whole document in a code fence.",
    "- Start with a single H1 title, then an Overview.",
    "- Include sections such as: Overview, Components, Data / Request Flow,",
    "  Key Decisions, and Open Questions (only when relevant).",
    "- Describe each canvas node as a component, using its label and shape to infer",
    "  its role (rectangle = service/app, cylinder = database/storage, diamond =",
    "  decision/gateway, hexagon = queue/broker, circle = client/user, pill = external API).",
    "- Describe each edge as a relationship / data flow between components.",
    "- Fold in intent, constraints, and decisions from the chat history.",
    "- Be concrete and concise; do not invent components that are not on the canvas",
    "  or implied by the discussion.",
  ].join("\n");
}

function buildUserPrompt(payload: ParsedPayload): string {
  const nodeSummary = payload.nodes.map((n) => ({
    id: n.id,
    label: n.data?.label ?? "",
    shape: n.data?.shape ?? "rectangle",
  }));
  const edgeSummary = payload.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.data?.label ?? "",
  }));
  const chat = payload.chatHistory.map((m) => ({
    sender: m.sender ?? m.role ?? "user",
    content: m.content,
  }));

  return [
    "Generate the technical specification from the following context.",
    "",
    "Canvas nodes (components):",
    JSON.stringify(nodeSummary, null, 2),
    "",
    "Canvas edges (relationships):",
    JSON.stringify(edgeSummary, null, 2),
    "",
    "Chat history (design discussion):",
    chat.length > 0
      ? chat.map((m) => `- ${m.sender}: ${m.content}`).join("\n")
      : "(no chat history)",
  ].join("\n");
}

async function generateMarkdown(payload: ParsedPayload): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const openRouter = new OpenRouter({ apiKey });

  const result = await openRouter.chat.send({
    chatRequest: {
      model: MODEL,
      stream: false,
      temperature: 0.5,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(payload) },
      ],
    },
  });

  const content = result.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("AI returned an empty response");
  }

  return unwrapMarkdown(content);
}

/**
 * Persist the generated Markdown: upload the content to Vercel Blob and store
 * the resulting blob URL in a `ProjectSpec` record linked to the project.
 *
 * Mirrors the canvas persistence pattern (Project.canvasJsonPath): the blob
 * holds the large generated artifact, Prisma holds only the reference. A unique
 * blob path per spec (specs/{projectId}/{runId}.md) keeps each generation's
 * content addressable without overwriting earlier specs. Returns the created
 * record id.
 */
async function persistSpec(
  projectId: string,
  runId: string,
  spec: string,
): Promise<string> {
  const blob = await put(`specs/${projectId}/${runId}.md`, spec, {
    access: "private",
    contentType: "text/markdown",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  const record = await prisma.projectSpec.create({
    data: {
      projectId,
      filePath: blob.url,
    },
  });

  return record.id;
}

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

export const generateSpecTask = task({
  id: "generate-spec",
  run: async (rawPayload: GenerateSpecPayload, { ctx }) => {
    const payload = generateSpecPayloadSchema.parse(rawPayload);
    const { roomId, projectId } = payload;
    const runId = ctx.run.id;
    const liveblocks = getLiveblocks();

    // Publish a message to the shared `ai-status-feed` so every participant can
    // follow progress in real time (canvas status pill + sidebar). Best-effort.
    const broadcast = async (phase: AiStatusPhase, text: string) => {
      // Surface progress to the run-scoped client tracking (useRealtimeRun).
      metadata.set("phase", phase);
      metadata.set("text", text);
      if (!liveblocks) return;
      try {
        await liveblocks.broadcastEvent(roomId, {
          feed: AI_STATUS_FEED,
          phase,
          text,
          runId,
        });
      } catch (error) {
        // Status feed is best-effort; never let it fail the run.
        logger.warn("Failed to broadcast AI status", { error: String(error) });
      }
    };

    logger.info("Spec generation started", {
      roomId,
      nodeCount: payload.nodes.length,
      edgeCount: payload.edges.length,
      chatCount: payload.chatHistory.length,
    });

    await broadcast("started", "Ghost AI is reading your canvas…");

    try {
      await broadcast("processing", "Writing the technical spec…");

      const spec = await generateMarkdown(payload);

      // Persist the Markdown to Vercel Blob + a ProjectSpec record so it can be
      // downloaded later via the secure download route. Generation already
      // succeeded and the content is returned regardless, so a persistence
      // failure is logged but does not fail the run (the realtime client still
      // receives `spec`).
      let specId: string | undefined;
      try {
        specId = await persistSpec(projectId, runId, spec);
        logger.info("Spec persisted", { specId, projectId });
      } catch (persistError) {
        logger.error("Failed to persist generated spec", {
          error: String(persistError),
          projectId,
        });
      }

      await broadcast("complete", "Spec generated.");

      logger.info("Spec generation complete", { length: spec.length });
      return { status: "complete" as const, spec, specId };
    } catch (error) {
      logger.error("Spec generation failed", { error: String(error) });
      await broadcast("error", "Ghost AI couldn't generate the spec. Please try again.");
      throw error;
    }
  },
});
