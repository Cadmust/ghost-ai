/**
 * Shared AI status feed.
 *
 * A single Liveblocks room-event "feed" named `ai-status-feed` carries the AI
 * agent's progress to every participant in the room. It is broadcast by the
 * background tasks (trigger/design-agent.ts today, spec generation later) and
 * read in the editor (the canvas status pill and the AI sidebar).
 *
 * Kept deliberately generic so design generation and spec generation can both
 * use the same channel — only `phase` is required; `text` is an optional
 * human-readable line. Anything else is intentionally out of the payload.
 *
 * Because the payload travels over Liveblocks room events it must satisfy the
 * `Json` constraint, so this is a `type` (not an `interface` — interfaces don't
 * satisfy that constraint and produce a "not a valid JSON value" error).
 */

import { z } from 'zod';

/** Name of the shared AI status feed (a Liveblocks room-event channel). */
export const AI_STATUS_FEED = 'ai-status-feed' as const;

/** Lifecycle of a single AI run, as it surfaces to participants. */
export type AiStatusPhase = 'started' | 'processing' | 'complete' | 'error';

const AI_STATUS_PHASES: readonly AiStatusPhase[] = [
  'started',
  'processing',
  'complete',
  'error',
];

/** Payload for a single message published to {@link AI_STATUS_FEED}. */
export type AiStatusMessage = {
  /** Discriminator so other room events can share the channel safely. */
  feed: typeof AI_STATUS_FEED;
  /** Where the run currently is. */
  phase: AiStatusPhase;
  /** Optional human-readable status line shown to all participants. */
  text?: string;
  /** Originating Trigger.dev run id, for correlation across messages. */
  runId: string;
};

function isPhase(value: unknown): value is AiStatusPhase {
  return typeof value === 'string' && (AI_STATUS_PHASES as readonly string[]).includes(value);
}

/**
 * Validate an incoming feed message before it is trusted/displayed.
 *
 * Returns the typed message when the payload is a well-formed AI status message
 * on this feed, or `null` otherwise (wrong feed, missing/invalid phase, bad
 * `text`, …) so callers can simply ignore anything that doesn't validate.
 */
export function parseAiStatusMessage(value: unknown): AiStatusMessage | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;

  if (record.feed !== AI_STATUS_FEED) return null;
  if (!isPhase(record.phase)) return null;
  if (typeof record.runId !== 'string' || record.runId.length === 0) return null;
  if (record.text !== undefined && typeof record.text !== 'string') return null;

  return {
    feed: AI_STATUS_FEED,
    phase: record.phase,
    runId: record.runId,
    text: typeof record.text === 'string' ? record.text : undefined,
  };
}

/** True while a run is active (so UI can disable input / show a spinner). */
export function isAiStatusActive(message: AiStatusMessage | null): boolean {
  return message?.phase === 'started' || message?.phase === 'processing';
}

// ---------------------------------------------------------------------------
// AI chat feed
// ---------------------------------------------------------------------------

/**
 * Shared room chat feed.
 *
 * A second Liveblocks room-event "feed" named `ai-chat` carries human chat
 * messages between everyone in the room. It is deliberately kept SEPARATE from
 * {@link AI_STATUS_FEED} — that channel is for AI progress/presence, this one is
 * only for participant chat. Both ride the same room-event transport and are
 * told apart by the `feed` discriminator (see liveblocks.config.ts RoomEvent).
 *
 * Validated with Zod at the boundary so feed messages are checked before they
 * are rendered (see {@link parseAiChatMessage}). Like the status feed it must
 * satisfy Liveblocks' `Json` constraint — the schema only uses primitives.
 */

/** Name of the shared room chat feed (a Liveblocks room-event channel). */
export const AI_CHAT_FEED = 'ai-chat' as const;

/** Who authored a chat message: a human participant or the AI agent. */
export const AI_CHAT_ROLES = ['user', 'ai'] as const;

/**
 * Zod schema for a single message on {@link AI_CHAT_FEED}. The shape mirrors the
 * spec: sender, role, content, and timestamp (plus a `feed` discriminator and a
 * client-generated `id` so React can key the list).
 */
export const aiChatMessageSchema = z.object({
  /** Discriminator so the chat feed can share the room-event channel safely. */
  feed: z.literal(AI_CHAT_FEED),
  /** Stable id for list keys / de-duplication. */
  id: z.string().min(1),
  /** Display name of the message author. */
  sender: z.string().min(1),
  /** Author role. */
  role: z.enum(AI_CHAT_ROLES),
  /** The message body. */
  content: z.string().min(1),
  /** Unix epoch milliseconds the message was sent. */
  timestamp: z.number().int().nonnegative(),
});

/** Payload for a single message published to {@link AI_CHAT_FEED}. */
export type AiChatMessage = z.infer<typeof aiChatMessageSchema>;

/** Author role of a chat message. */
export type AiChatRole = (typeof AI_CHAT_ROLES)[number];

/**
 * Validate an incoming chat message before it is trusted/rendered.
 *
 * Returns the typed message when the payload is a well-formed chat message on
 * this feed, or `null` otherwise (wrong feed, missing fields, bad types, …) so
 * callers can simply ignore anything that doesn't validate.
 */
export function parseAiChatMessage(value: unknown): AiChatMessage | null {
  const result = aiChatMessageSchema.safeParse(value);
  return result.success ? result.data : null;
}
