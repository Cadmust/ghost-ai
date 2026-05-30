'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import type { CanvasEdge } from '@/types/canvas';

export const CanvasEdgeRenderer = memo(function CanvasEdgeRenderer({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: EdgeProps<CanvasEdge>) {
  const { setEdges } = useReactFlow();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data?.label || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  // Sync edit value when data.label changes from outside
  useEffect(() => {
    if (!isEditing) {
      setEditValue(data?.label || '');
    }
  }, [data?.label, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(data?.label || '');
    },
    [data?.label],
  );

  const commitLabel = useCallback(
    (newLabel: string) => {
      const trimmed = newLabel.trim();
      if (trimmed !== (data?.label || '')) {
        setEdges((eds) =>
          eds.map((ed) =>
            ed.id === id
              ? { ...ed, data: { ...ed.data, label: trimmed } }
              : ed,
          ),
        );
      }
    },
    [data?.label, id, setEdges],
  );

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    commitLabel(editValue);
  }, [commitLabel, editValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEditing(false);
        setEditValue(data?.label || '');
      } else if (e.key === 'Enter') {
        setIsEditing(false);
        commitLabel(editValue);
      }
    },
    [commitLabel, data?.label, editValue],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditValue(e.target.value);
    },
    [],
  );

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        interactionWidth={16}
        style={{
          strokeLinecap: 'round',
          color: 'var(--border-subtle)',
        }}
        className="canvas-edge"
        markerEnd="url(#edge-arrowhead)"
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: 10,
          }}
          onDoubleClick={handleDoubleClick}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--accent-primary)',
                borderRadius: 4,
                color: 'var(--text-primary)',
                fontSize: 11,
                fontFamily: 'var(--font-sans)',
                textAlign: 'center',
                outline: 'none',
                padding: '2px 6px',
                minWidth: 30,
                maxWidth: 200,
                lineHeight: '1.4',
              }}
              className="nodrag nopan"
            />
          ) : data?.label ? (
            <span
              style={{
                background: 'var(--bg-elevated)',
                borderRadius: 4,
                color: selected
                  ? 'var(--accent-primary)'
                  : 'var(--text-muted)',
                fontSize: 11,
                fontFamily: 'var(--font-sans)',
                padding: '2px 8px',
                lineHeight: '1.4',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s',
                border: '1px solid transparent',
                cursor: 'pointer',
              }}
              className="nodrag nopan"
            >
              {data.label}
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});