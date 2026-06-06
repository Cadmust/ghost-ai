import type { AiStatusMessage, AiChatMessage } from './types/tasks';

/**
 * Identity used for the AI agent's ephemeral presence in a room. The agent sets
 * presence through the Liveblocks node client (no WebSocket connection), so its
 * cursor and "thinking" state surface to participants through the same
 * useOthers()/useOthersConnectionIds() flow as human collaborators.
 */
export const AI_AGENT_USER_ID = 'ghost-ai-agent';
export const AI_AGENT_NAME = 'Ghost AI';
export const AI_AGENT_COLOR = '#00c8d4';

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: {};

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    // Room events share one transport, split into separate "feeds" by the
    // `feed` discriminator on each payload:
    //  - `ai-status-feed` (AiStatusMessage): AI progress/presence, reusable for
    //    design and spec generation. See parseAiStatusMessage.
    //  - `ai-chat` (AiChatMessage): human room chat. See parseAiChatMessage.
    // Both schemas + validators live in types/tasks.ts.
    RoomEvent: AiStatusMessage | AiChatMessage;

    ThreadMetadata: {};

    RoomInfo: {};
  }
}

export {};