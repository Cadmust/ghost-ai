'use client';

import { useEffect } from 'react';
import type { ReactFlowInstance } from '@xyflow/react';

interface UseKeyboardShortcutsOptions {
  reactFlowInstance: ReactFlowInstance;
  undo: () => void;
  redo: () => void;
}

export function useKeyboardShortcuts({
  reactFlowInstance,
  undo,
  redo,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isEditable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isEditable) return;

      const isMod = event.metaKey || event.ctrlKey;

      if ((event.key === '+' || event.key === '=') && !isMod) {
        event.preventDefault();
        reactFlowInstance.zoomIn();
        return;
      }

      if (event.key === '-' && !isMod) {
        event.preventDefault();
        reactFlowInstance.zoomOut();
        return;
      }

      if (isMod && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      if (isMod && event.key === 'z' && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }

      if (isMod && event.key === 'y') {
        event.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reactFlowInstance, undo, redo]);
}