'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Handle,
  Position,
  NodeResizer,
  useReactFlow,
  type NodeProps,
} from '@xyflow/react';
import type { CanvasNode, NodeColorTheme } from '@/types/canvas';
import { ShapeRenderer } from '@/components/editor/shape-renderer';
import { ColorToolbar } from '@/components/editor/color-toolbar';

// All four sides expose a source and a target handle so a connection can start
// from and end on any side of any node. Each handle gets a unique id so React
// Flow can address the overlapping source/target pair independently; the source
// sits above the target (zIndex) so a drag starts a connection while a drop
// still lands on the target.
const HANDLE_POSITIONS = [
  { position: Position.Top, key: 'top' },
  { position: Position.Right, key: 'right' },
  { position: Position.Bottom, key: 'bottom' },
  { position: Position.Left, key: 'left' },
] as const;

export const CanvasNodeRenderer = memo(function CanvasNodeRenderer({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<CanvasNode>) {
  const { setNodes } = useReactFlow();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local edit value when data.label changes from outside
  useEffect(() => {
    if (!isEditing) {
      setEditValue(data.label || '');
    }
  }, [data.label, isEditing]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(data.label || '');
    },
    [data.label],
  );

  const commitLabel = useCallback(
    (newLabel: string) => {
      const trimmed = newLabel.trim();
      if (trimmed !== (data.label || '')) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, label: trimmed } } : n,
          ),
        );
      }
    },
    [data.label, id, setNodes],
  );

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    commitLabel(editValue);
  }, [commitLabel, editValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEditing(false);
        setEditValue(data.label || '');
      }
    },
    [data.label],
  );

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditValue(e.target.value);
    },
    [],
  );

  const handleTextareaMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleColorSelect = useCallback(
    (theme: NodeColorTheme) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id
            ? { ...n, data: { ...n.data, color: theme.bg, textColor: theme.text } }
            : n,
        ),
      );
    },
    [id, setNodes],
  );

  const borderColor = selected ? 'var(--accent-primary)' : 'var(--border-subtle)';
  const borderWidth = selected ? 2 : 1;
  const nodeWidth = width ?? 160;
  const nodeHeight = height ?? 80;

  return (
    <div
      style={{
        width: nodeWidth,
        height: nodeHeight,
        position: 'relative',
        transition: 'border-color 0.15s, border-width 0.15s',
      }}
      onDoubleClick={handleDoubleClick}
    >
      {selected && (
        <NodeResizer
          minWidth={80}
          minHeight={60}
          handleStyle={{
            width: 8,
            height: 8,
            border: '1px solid var(--accent-primary)',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: 2,
          }}
          lineStyle={{
            borderColor: 'var(--accent-primary)',
            strokeDasharray: '3 2',
          }}
        />
      )}

      {selected && (
        <div style={{ position: 'relative', width: 0, height: 0, zIndex: 50 }}>
          <ColorToolbar
            currentColor={data.color || 'var(--bg-elevated)'}
            currentTextColor={data.textColor || ''}
            onColorSelect={handleColorSelect}
          />
        </div>
      )}

      <div className="node-handles">
        {HANDLE_POSITIONS.map(({ position, key }) => (
          <Handle
            key={`source-${key}`}
            id={`${key}-source`}
            type="source"
            position={position}
            className="!border-[var(--border-bold)] !bg-white !w-2.5 !h-2.5 nodrag"
            style={{ opacity: 0, transition: 'opacity 0.15s', zIndex: 1 }}
            isConnectable
          />
        ))}
        {HANDLE_POSITIONS.map(({ position, key }) => (
          <Handle
            key={`target-${key}`}
            id={`${key}-target`}
            type="target"
            position={position}
            className="!border-[var(--border-bold)] !bg-white !w-2.5 !h-2.5 nodrag"
            style={{ opacity: 0, transition: 'opacity 0.15s', zIndex: 0 }}
            isConnectable
          />
        ))}
      </div>

      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <ShapeRenderer
          shape={data.shape}
          width={nodeWidth}
          height={nodeHeight}
          color={data.color || 'var(--bg-elevated)'}
          borderColor={borderColor}
          borderWidth={borderWidth}
          label={data.label}
          textColor={data.textColor}
        />

        {isEditing && (
          <div
            style={{
              position: 'absolute',
              inset: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={handleTextareaChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onMouseDown={handleTextareaMouseDown}
              rows={1}
              style={{
                width: 'calc(100% - 8px)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
                textAlign: 'center',
                resize: 'none',
                outline: 'none',
                padding: '2px 4px',
                overflow: 'hidden',
                lineHeight: '1.4',
                maxHeight: 'calc(100% - 8px)',
              }}
              className="text-xs font-medium"
            />
          </div>
        )}
      </div>
    </div>
  );
});