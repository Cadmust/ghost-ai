'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasNode, CanvasEdge } from '@/types/canvas';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseCanvasAutosaveOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  /**
   * Debounce window in milliseconds before a save is sent.
   * @default 1500
   */
  debounceMs?: number;
  /**
   * When false, autosave is held off (e.g. while the saved canvas is still
   * loading) so the initial empty state never overwrites persisted content.
   */
  enabled?: boolean;
}

export interface UseCanvasAutosaveResult {
  /** Current save status, driven by both autosave and manual saves. */
  status: SaveStatus;
  /**
   * Triggers an immediate save through the same persistence path as autosave.
   * Resolves once the request settles. Safe to wire to a manual Save button.
   */
  save: () => Promise<void>;
}

/**
 * Watches the collaborative canvas nodes and edges and persists them through
 * the canvas API route, debouncing writes to avoid excessive blob uploads.
 * Exposes the current save status plus a manual save function for the editor's
 * Save button.
 */
export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  debounceMs = 1500,
  enabled = true,
}: UseCanvasAutosaveOptions): UseCanvasAutosaveResult {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Skip the very first run so loading existing state isn't echoed back as a save.
  const isFirstRun = useRef(true);

  // Keep the latest nodes/edges in a ref so a manual save always persists the
  // current canvas without needing to be re-created on every change.
  const latestRef = useRef({ nodes, edges });
  latestRef.current = { nodes, edges };

  const persist = useCallback(async () => {
    setStatus('saving');
    try {
      const response = await fetch(`/api/projects/${projectId}/canvas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(latestRef.current),
      });

      setStatus(response.ok ? 'saved' : 'error');
    } catch {
      setStatus('error');
    }
  }, [projectId]);

  const save = useCallback(async () => {
    // A manual save supersedes any pending debounced autosave.
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await persist();
  }, [persist]);

  useEffect(() => {
    if (!enabled) return;

    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      void persist();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [projectId, nodes, edges, debounceMs, enabled, persist]);

  return { status, save };
}
