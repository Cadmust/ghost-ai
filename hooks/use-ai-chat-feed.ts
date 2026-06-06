'use client';

import { useCallback, useState } from 'react';
import {
  useBroadcastEvent,
  useEventListener,
  useSelf,
} from '@liveblocks/react/suspense';
import {
  AI_CHAT_FEED,
  parseAiChatMessage,
  type AiChatMessage,
  type AiChatRole,
} from '@/types/tasks';
import { AI_AGENT_NAME } from '@/liveblocks.config';

export interface AiChatFeedState {
  /** Validated chat messages, in the order they arrived. */
  messages: AiChatMessage[];
  /**
   * Broadcast a chat message to everyone in the room (sender filled from the
   * current user's presence info). Resolves once broadcast; throws on failure
   * so the caller can show an error state. Returns the sent message.
   */
  sendMessage: (content: string) => AiChatMessage;
  /**
   * Broadcast an AI-authored message (role 'ai') to everyone in the room — used
   * to post the design agent's completion summary back into the chat. Returns
   * the sent message.
   */
  sendAiMessage: (content: string) => AiChatMessage;
}

/**
 * Single read/write point for the shared `ai-chat` room feed.
 *
 * This is the room chat channel only — kept separate from `ai-status-feed`
 * (AI progress/presence), which is handled by useAiStatusFeed. Incoming events
 * are validated through parseAiChatMessage; anything that isn't a well-formed
 * chat message is ignored.
 *
 * Liveblocks room events are ephemeral (no history is replayed), so we only see
 * messages broadcast while connected — matching the spec's "don't show full
 * feed history" limit. Messages are kept in arrival order.
 *
 * Must be called inside a Liveblocks RoomProvider.
 */
export function useAiChatFeed(): AiChatFeedState {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const broadcast = useBroadcastEvent();
  const self = useSelf();

  useEventListener(({ event }) => {
    const message = parseAiChatMessage(event);
    if (!message) return;
    setMessages((prev) => {
      // Guard against an echoed/duplicate broadcast of the same message id.
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  });

  // Build, broadcast, and locally append a chat message. Broadcast events are
  // not echoed back to the sender, so we append locally too.
  const publish = useCallback(
    (content: string, role: AiChatRole, sender: string): AiChatMessage => {
      const message: AiChatMessage = {
        feed: AI_CHAT_FEED,
        id: crypto.randomUUID(),
        sender,
        role,
        content: content.trim(),
        timestamp: Date.now(),
      };

      broadcast(message);
      setMessages((prev) => [...prev, message]);

      return message;
    },
    [broadcast],
  );

  const sendMessage = useCallback(
    (content: string): AiChatMessage =>
      publish(content, 'user', self?.info?.name ?? 'You'),
    [publish, self],
  );

  const sendAiMessage = useCallback(
    (content: string): AiChatMessage => publish(content, 'ai', AI_AGENT_NAME),
    [publish],
  );

  return { messages, sendMessage, sendAiMessage };
}
