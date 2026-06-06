'use client';

import { Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAiStatusFeed } from '@/hooks/use-ai-status-feed';
import type { AiStatusPhase } from '@/types/tasks';

/**
 * Shows the AI agent's live status to every participant in the room.
 *
 * Reads the shared `ai-status-feed` (validated in useAiStatusFeed) and renders
 * only the most recent message as a floating pill at the top-center of the
 * canvas. The feed is broadcast by the background task, so the status is visible
 * to all collaborators — not just the person who triggered the run. Terminal
 * phases (complete/error) auto-dismiss via the hook.
 */
export function AiStatusFeed() {
  const { latest } = useAiStatusFeed();

  if (!latest || !latest.text) return null;

  const isError = latest.phase === 'error';

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
        <StatusIcon phase={latest.phase} />
        <span className="whitespace-nowrap">{latest.text}</span>
      </div>
    </div>
  );
}

function StatusIcon({ phase }: { phase: AiStatusPhase }) {
  if (phase === 'error') {
    return <AlertCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--state-error)' }} />;
  }
  if (phase === 'complete') {
    return (
      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
    );
  }
  if (phase === 'started' || phase === 'processing') {
    return (
      <Loader2
        className="h-4 w-4 shrink-0 animate-spin"
        style={{ color: 'var(--accent-primary)' }}
      />
    );
  }
  return <Sparkles className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />;
}
