'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { CanvasNode } from '@/types/canvas';

export const CanvasNodeRenderer = memo(function CanvasNodeRenderer({
  data,
}: NodeProps<CanvasNode>) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minWidth: 60,
        minHeight: 40,
        border: '2px solid var(--border-subtle)',
        borderRadius: 8,
        backgroundColor: 'var(--bg-elevated)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 12px',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <span
        style={{ color: 'var(--text-primary)' }}
        className="text-xs font-medium truncate"
      >
        {data.label}
      </span>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
});