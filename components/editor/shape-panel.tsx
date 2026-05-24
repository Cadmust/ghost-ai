'use client';

import { type DragEvent } from 'react';
import type { Shape, ShapeDragPayload } from '@/types/canvas';
import { SHAPE_DEFAULT_SIZES } from '@/types/canvas';

const shapes: { shape: Shape; label: string }[] = [
  { shape: 'rectangle', label: 'Rectangle' },
  { shape: 'diamond', label: 'Diamond' },
  { shape: 'circle', label: 'Circle' },
  { shape: 'pill', label: 'Pill' },
  { shape: 'cylinder', label: 'Cylinder' },
  { shape: 'hexagon', label: 'Hexagon' },
];

export function ShapePanel() {
  const handleDragStart = (e: DragEvent<HTMLButtonElement>, shape: Shape) => {
    const size = SHAPE_DEFAULT_SIZES[shape];
    const payload: ShapeDragPayload = { shape, ...size };
    e.dataTransfer.setData('application/ghost-shape', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-2 rounded-full border shadow-lg"
    >
      {shapes.map(({ shape, label }) => (
        <button
          key={shape}
          draggable
          onDragStart={(e) => handleDragStart(e, shape)}
          title={label}
          style={{ color: 'var(--text-secondary)' }}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-grab active:cursor-grabbing"
        >
          <ShapeIcon shape={shape} />
        </button>
      ))}
    </div>
  );
}

function ShapeIcon({ shape }: { shape: Shape }) {
  const className = 'w-5 h-5';

  switch (shape) {
    case 'rectangle':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <rect x="3" y="6" width="18" height="12" rx="1" />
        </svg>
      );
    case 'diamond':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <path d="M12 3L21 12L12 21L3 12Z" />
        </svg>
      );
    case 'circle':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
    case 'pill':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <rect x="4" y="7" width="16" height="10" rx="5" />
        </svg>
      );
    case 'cylinder':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <ellipse cx="12" cy="6" rx="8" ry="3" />
          <line x1="4" y1="6" x2="4" y2="18" />
          <line x1="20" y1="6" x2="20" y2="18" />
          <ellipse cx="12" cy="18" rx="8" ry="3" />
        </svg>
      );
    case 'hexagon':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <path d="M12 2L21 7V17L12 22L3 17V7Z" />
        </svg>
      );
  }
}