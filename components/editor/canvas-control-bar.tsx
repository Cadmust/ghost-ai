'use client';

import { useUndo, useRedo, useCanUndo, useCanRedo } from '@liveblocks/react';
import { useReactFlow } from '@xyflow/react';

export function CanvasControlBar() {
  const reactFlowInstance = useReactFlow();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const handleZoomIn = () => reactFlowInstance.zoomIn();
  const handleZoomOut = () => reactFlowInstance.zoomOut();
  const handleFitView = () => reactFlowInstance.fitView({ duration: 200 });

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
      className="absolute bottom-20 left-6 z-50 flex items-center gap-1.5 px-2 py-1.5 rounded-full border shadow-lg"
    >
      {/* Zoom controls */}
      <button
        onClick={handleZoomOut}
        title="Zoom out (-)"
        style={{ color: 'var(--text-secondary)' }}
        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button
        onClick={handleFitView}
        title="Fit view"
        style={{ color: 'var(--text-secondary)' }}
        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-xs font-medium px-2"
      >
        Fit
      </button>
      <button
        onClick={handleZoomIn}
        title="Zoom in (+)"
        style={{ color: 'var(--text-secondary)' }}
        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Divider */}
      <div
        style={{ backgroundColor: 'var(--border-subtle)' }}
        className="w-px h-5 mx-1"
      />

      {/* History controls */}
      <button
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        style={{ color: 'var(--text-secondary)' }}
        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="M3 10H13C17 10 21 13 21 18V21" />
          <path d="M3 10L7 6" />
          <path d="M3 10L7 14" />
        </svg>
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
        style={{ color: 'var(--text-secondary)' }}
        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="M21 10H11C7 10 3 13 3 18V21" />
          <path d="M21 10L17 6" />
          <path d="M21 10L17 14" />
        </svg>
      </button>
    </div>
  );
}