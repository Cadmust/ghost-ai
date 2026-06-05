/**
 * Shared status feed broadcast by the AI design agent (trigger/design-agent.ts)
 * so every connected participant can follow the agent's progress in real time.
 * Phases: started → processing (one per applied change) → complete | error.
 */
export type AiStatusEvent = {
  type: 'ai-status';
  phase: 'started' | 'processing' | 'complete' | 'error';
  /** Human-readable status line shown to all participants. */
  message: string;
  /** The run id of the originating Trigger.dev task, for correlation. */
  runId: string;
};

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

    RoomEvent: AiStatusEvent;

    ThreadMetadata: {};

    RoomInfo: {};
  }
}

export {};