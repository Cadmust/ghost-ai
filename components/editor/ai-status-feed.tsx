'use client';

import { useEffect, useState } from 'react';
import { useEventListener } from '@liveblocks/react/suspense';
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import type { AiStatusEvent } from '@/liveblocks.config';

/**
 * Shows the AI design agent's live status to every participant in the room.
 *
 * The agent (trigger/design-agent.ts) broadcasts `ai-status` room events at each
 * step (started → processing → complete | error). This listens for those events
 * — so the feed is visible to all collaborators, not just the person who
 * triggered the run — and renders the latest message as a floating pill at the
 * top-center of the canvas. Terminal phases (complete/error) auto-dismiss.
 */
export function AiStatusFeed() {
  const [status, setStatus] = useState<AiStatusEvent | null>(null);

  useEventListener(({ event }) => {
    if (event.type !== 'ai-status') return;
    setStatus(event);
  });

  // Auto-dismiss once the run reaches a terminal phase.
  useEffect(() => {
    if (!status) return;
    if (status.phase !== 'complete' && status.phase !== 'error') return;
    const timer = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  if (!status) return null;

  const isActive = status.phase === 'started' || status.phase === 'processing';
  const isError = status.phase === 'error';

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-40 -translate-x-1/2">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium shadow-2xl backdrop-blur"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-elevated) 92%, transparent)',
          border: `1px solid ${
            isError
              ? 'color-mix(in srgb, var(--state-error) 50%, transparent)'
              : 'color-mix(in srgb, var(--accent-primary) 40%, transparent)'
          }`,
          color: 'var(--text-primary)',
        }}
      >
        <StatusIcon phase={status.phase} active={isActive} />
        <span className="whitespace-nowrap">{status.message}</span>
      </div>
    </div>
  );
}

function StatusIcon({ phase, active }: { phase: AiStatusEvent['phase']; active: boolean }) {
  if (phase === 'error') {
    return <AlertCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--state-error)' }} />;
  }
  if (phase === 'complete') {
    return (
      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
    );
  }
  if (active) {
    return (
      <Loader2
        className="h-4 w-4 shrink-0 animate-spin"
        style={{ color: 'var(--accent-primary)' }}
      />
    );
  }
  return <Sparkles className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />;
}
