'use client';

import { useEffect, useState } from 'react';
import { useEventListener } from '@liveblocks/react/suspense';
import {
  parseAiStatusMessage,
  isAiStatusActive,
  type AiStatusMessage,
} from '@/types/tasks';

/** How long a terminal (complete/error) message lingers before clearing. */
const TERMINAL_DISMISS_MS = 4000;

/**
 * How long an active (started/processing) message may sit without a follow-up
 * before it is treated as stale and cleared. Room events are best-effort, so a
 * dropped terminal (complete/error) event must not leave the feed — and any
 * composer gated on it — stuck on "processing" forever. Each new status resets
 * this timer, so a healthy run that keeps reporting progress never trips it.
 */
const ACTIVE_STALE_MS = 90000;

export interface AiStatusFeedState {
  /** The most recent validated message on `ai-status-feed`, or null. */
  latest: AiStatusMessage | null;
  /** True while a run is in progress (phase started/processing). */
  isActive: boolean;
}

/**
 * Subscribes to the shared `ai-status-feed` and exposes only the latest status.
 *
 * This is the single read point for the AI status feed — the canvas status pill
 * and the AI sidebar both consume it, so there is one subscription and one
 * validation boundary (parseAiStatusMessage) rather than parallel realtime
 * state. Incoming room events are validated before being trusted; anything that
 * isn't a well-formed status message is ignored. Terminal phases auto-clear so
 * the indicator doesn't stick around after a run finishes.
 *
 * Must be called inside a Liveblocks RoomProvider.
 */
export function useAiStatusFeed(): AiStatusFeedState {
  const [latest, setLatest] = useState<AiStatusMessage | null>(null);

  useEventListener(({ event }) => {
    const message = parseAiStatusMessage(event);
    if (!message) return;
    setLatest(message);
  });

  useEffect(() => {
    if (!latest) return;
    // Terminal phases linger briefly, then clear so the indicator goes away.
    // Active phases get a longer staleness fallback so a missed terminal event
    // can't leave the feed (and the composer) stuck reporting "processing".
    const delay =
      latest.phase === 'complete' || latest.phase === 'error'
        ? TERMINAL_DISMISS_MS
        : ACTIVE_STALE_MS;
    const timer = setTimeout(() => setLatest(null), delay);
    return () => clearTimeout(timer);
  }, [latest]);

  return { latest, isActive: isAiStatusActive(latest) };
}
