'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRealtimeRun } from '@trigger.dev/react-hooks';
import type { generateSpecTask } from '@/trigger/generate-spec';

/** A triggered spec run we're tracking via Trigger.dev realtime. */
interface ActiveRun {
  runId: string;
  publicToken: string;
}

/** The canvas graph + chat context handed to the spec generator. */
export interface SpecGenerationInput {
  /** Liveblocks room / project id the spec belongs to. */
  roomId: string;
  /** Current canvas nodes. */
  nodes: unknown[];
  /** Current canvas edges. */
  edges: unknown[];
  /** Room chat history framing the design intent. */
  chatHistory: { sender?: string; role?: string; content: string }[];
}

export interface SpecGenerationState {
  /** True while a spec run is being triggered or is in flight. */
  isGenerating: boolean;
  /** Set when the last trigger/run failed, so the UI can surface an error. */
  error: boolean;
  /** Trigger a spec generation run for the given canvas + chat context. */
  generate: (input: SpecGenerationInput) => Promise<void>;
}

/**
 * Drives a single spec-generation run: POSTs the canvas graph + chat context to
 * `/api/ai/spec`, then subscribes to the Trigger.dev run via `useRealtimeRun`.
 *
 * Mirrors the design-agent tracking already in ai-sidebar.tsx (activeRun +
 * realtime subscription + terminal-status safety net). When the run reaches a
 * terminal status the run is cleared and `onComplete` fires so the caller can
 * refresh the persisted spec list (a new ProjectSpec record was just created).
 *
 * Room-wide progress text still flows through the shared `ai-status-feed`
 * (useAiStatusFeed); this hook only owns the *triggering* client's run state.
 */
export function useSpecGeneration(onComplete: () => void): SpecGenerationState {
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const { run: trackedRun } = useRealtimeRun<typeof generateSpecTask>(
    activeRun?.runId,
    {
      accessToken: activeRun?.publicToken,
      enabled: !!activeRun,
    },
  );

  // Clear the run and refresh the list once the subscription reports a terminal
  // status. Runs only advance forward, so a terminal status is final. onComplete
  // refreshes regardless of success — a failed run leaves no spec, and the list
  // simply re-renders unchanged.
  useEffect(() => {
    if (!trackedRun || !activeRun) return;
    if (trackedRun.id !== activeRun.runId) return;
    const TERMINAL: readonly string[] = [
      'COMPLETED',
      'FAILED',
      'CANCELED',
      'CRASHED',
      'SYSTEM_FAILURE',
      'EXPIRED',
      'TIMED_OUT',
    ];
    if (TERMINAL.includes(trackedRun.status)) {
      // Terminal status is final (runs only advance forward); clearing the run
      // here is the authoritative release point — mirrors the design-agent
      // safety net in ai-sidebar.tsx.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- terminal-status release from realtime subscription
      if (trackedRun.status !== 'COMPLETED') setError(true);
      setActiveRun(null);
      onComplete();
    }
  }, [trackedRun, activeRun, onComplete]);

  const generate = useCallback(
    async (input: SpecGenerationInput) => {
      if (isSubmitting || activeRun) return;
      setIsSubmitting(true);
      setError(false);
      try {
        const response = await fetch('/api/ai/spec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // roomId == projectId — the canvas room is keyed by project id.
            roomId: input.roomId,
            chatHistory: input.chatHistory,
            nodes: input.nodes,
            edges: input.edges,
            // Dedupe accidental double submits via the trigger idempotencyKey.
            requestId: crypto.randomUUID(),
          }),
        });
        if (!response.ok) throw new Error(`Spec request failed: ${response.status}`);

        const { runId, publicToken } = (await response.json()) as {
          runId?: string;
          publicToken?: string;
        };
        if (!runId || !publicToken) throw new Error('Missing run token');

        setActiveRun({ runId, publicToken });
      } catch {
        setError(true);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, activeRun],
  );

  return { isGenerating: isSubmitting || !!activeRun, error, generate };
}
