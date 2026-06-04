'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { CanvasNode, CanvasEdge } from '@/types/canvas';
import { CANVAS_TEMPLATES, type CanvasTemplate } from '@/components/editor/starter-templates';
import { ShapeRenderer } from '@/components/editor/shape-renderer';

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

const PREVIEW_WIDTH = 280;
const PREVIEW_HEIGHT = 160;
const PREVIEW_PADDING = 20;

function computePreviewBounds(nodes: CanvasNode[]) {
  if (nodes.length === 0) return { minX: 0, minY: 0, scale: 1 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const w = node.width ?? 120;
    const h = node.height ?? 70;
    if (node.position.x < minX) minX = node.position.x;
    if (node.position.y < minY) minY = node.position.y;
    if (node.position.x + w > maxX) maxX = node.position.x + w;
    if (node.position.y + h > maxY) maxY = node.position.y + h;
  }

  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const availW = PREVIEW_WIDTH - PREVIEW_PADDING * 2;
  const availH = PREVIEW_HEIGHT - PREVIEW_PADDING * 2;
  const scale = Math.min(availW / contentW, availH / contentH, 1);

  return { minX, minY, scale };
}

function getNodeCenter(node: CanvasNode) {
  const w = node.width ?? 120;
  const h = node.height ?? 70;
  return { cx: node.position.x + w / 2, cy: node.position.y + h / 2 };
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const { nodes } = template;

  const bounds = useMemo(() => computePreviewBounds(nodes), [nodes]);

  const { minX, minY, scale } = bounds;
  const transform = `translate(${PREVIEW_PADDING}px, ${PREVIEW_PADDING}px) scale(${scale}) translate(${-minX}px, ${-minY}px)`;

  return (
    <div
      style={{
        width: PREVIEW_WIDTH,
        height: PREVIEW_HEIGHT,
        backgroundColor: 'var(--bg-elevated)',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform,
          transformOrigin: '0 0',
        }}
      >
        {/* Edges */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          {template.edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const from = getNodeCenter(sourceNode);
            const to = getNodeCenter(targetNode);

            return (
              <line
                key={edge.id}
                x1={from.cx}
                y1={from.cy}
                x2={to.cx}
                y2={to.cy}
                stroke="var(--border-subtle)"
                strokeWidth={2 / scale}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const w = node.width ?? 120;
          const h = node.height ?? 70;
          const borderColor = 'var(--border-subtle)';
          const borderWidth = 1;
          const color = node.data.color;
          const textColor = node.data.textColor;

          if (
            node.data.shape === 'rectangle' ||
            node.data.shape === 'pill' ||
            node.data.shape === 'circle'
          ) {
            const borderRadius =
              node.data.shape === 'rectangle' ? '8px' : '9999px';
            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: node.position.x,
                  top: node.position.y,
                  width: w,
                  height: h,
                  border: `${borderWidth}px solid ${borderColor}`,
                  borderRadius,
                  backgroundColor: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 6px',
                  fontSize: Math.min(8 / scale, 10),
                }}
              >
                <span
                  style={{
                    color: textColor ?? 'var(--text-primary)',
                    fontSize: Math.min(7 / scale, 9),
                    lineHeight: 1.2,
                    textAlign: 'center',
                    whiteSpace: 'pre-line',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  className="font-medium truncate"
                >
                  {node.data.label}
                </span>
              </div>
            );
          }

          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: node.position.x,
                top: node.position.y,
                width: w,
                height: h,
              }}
            >
              <ShapeRenderer
                shape={node.data.shape}
                width={w}
                height={h}
                color={color}
                borderColor={borderColor}
                borderWidth={borderWidth}
                label={node.data.label}
                textColor={textColor}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl"
        style={{ maxWidth: '900px' }}
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>Import Template</DialogTitle>
          <DialogDescription>
            Choose a starter template to pre-populate your canvas. Any existing nodes will be replaced — use ⌘Z to undo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-2">
          {CANVAS_TEMPLATES.map((template) => (
            <div
              key={template.id}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
              className="flex flex-col rounded-xl border overflow-hidden"
            >
              <TemplatePreview template={template} />

              <div className="flex flex-col gap-2 p-4 flex-1">
                <h3
                  style={{ color: 'var(--text-primary)' }}
                  className="text-sm font-semibold"
                >
                  {template.name}
                </h3>
                <p
                  style={{ color: 'var(--text-secondary)' }}
                  className="text-xs leading-relaxed"
                >
                  {template.description}
                </p>
                <div className="mt-auto pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                    }}
                    onClick={() => {
                      onImport(template);
                      onOpenChange(false);
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Import
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { CANVAS_TEMPLATES };