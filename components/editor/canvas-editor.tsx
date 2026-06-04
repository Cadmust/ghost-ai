'use client';

import { Component, type ReactNode, useCallback, useState, useRef, type DragEvent } from 'react';
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from '@liveblocks/react';
import { useLiveblocksFlow } from '@liveblocks/react-flow';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  type DefaultEdgeOptions,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CanvasNodeRenderer } from '@/components/editor/canvas-node';
import { CanvasEdgeRenderer } from '@/components/editor/canvas-edge';
import { ShapePanel } from '@/components/editor/shape-panel';
import { ShapeRenderer } from '@/components/editor/shape-renderer';
import { CanvasControlBar } from '@/components/editor/canvas-control-bar';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useUndo, useRedo } from '@liveblocks/react';
import { StarterTemplatesModal } from '@/components/editor/starter-templates-modal';
import type { CanvasTemplate } from '@/components/editor/starter-templates';
import { SHAPE_DEFAULT_SIZES } from '@/types/canvas';
import type { CanvasNode, CanvasEdge, ShapeDragPayload, Shape } from '@/types/canvas';

interface CanvasEditorProps {
  roomId: string;
  showTemplates?: boolean;
  onTemplatesOpenChange?: (open: boolean) => void;
}

let nodeCounter = 0;

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'canvasEdge',
  style: { stroke: 'var(--border-subtle)', strokeWidth: 2 },
};

const nodeTypes = {
  canvasNode: CanvasNodeRenderer,
};

const edgeTypes = {
  canvasEdge: CanvasEdgeRenderer,
};

export function CanvasEditor({ roomId, showTemplates = false, onTemplatesOpenChange }: CanvasEditorProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{ cursor: null, isThinking: false }}>
        <ErrorBoundary fallback={<CanvasErrorFallback />}>
          <ClientSideSuspense fallback={<CanvasLoadingFallback />}>
            {() => <CanvasFlow showTemplates={showTemplates} onTemplatesOpenChange={onTemplatesOpenChange} />}
          </ClientSideSuspense>
        </ErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function CanvasFlow({ showTemplates, onTemplatesOpenChange }: { showTemplates: boolean; onTemplatesOpenChange?: (open: boolean) => void }) {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner showTemplates={showTemplates} onTemplatesOpenChange={onTemplatesOpenChange} />
    </ReactFlowProvider>
  );
}

function CanvasFlowInner({ showTemplates, onTemplatesOpenChange }: { showTemplates: boolean; onTemplatesOpenChange?: (open: boolean) => void }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true });
  const reactFlowInstance = useReactFlow();

  const undo = useUndo();
  const redo = useRedo();

  useKeyboardShortcuts({ reactFlowInstance, undo, redo });

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      // Offset imported nodes slightly so they don't overlap the existing canvas
      const offsetX = 80;
      const offsetY = 80;

      // Build a stable map from each template node's original id to a fresh
      // unique id, so the canvas can be imported repeatedly without collisions.
      const stamp = Date.now();
      const idMap = new Map<string, string>();
      template.nodes.forEach((n, i) => {
        idMap.set(n.id, `${template.id}-${stamp}-${nodeCounter}-n${i}`);
      });
      nodeCounter++;

      const nodeAdds = template.nodes.map((n) => {
        const defaultSize = SHAPE_DEFAULT_SIZES[n.data.shape];
        return {
          type: 'add' as const,
          item: {
            ...n,
            id: idMap.get(n.id)!,
            position: {
              x: n.position.x + offsetX,
              y: n.position.y + offsetY,
            },
            width: n.width ?? defaultSize.width,
            height: n.height ?? defaultSize.height,
          },
        };
      });

      // Rewire edges through the id map so source/target reference the freshly
      // created nodes; edges pointing at unknown ids would be silently dropped.
      const edgeAdds = template.edges
        .map((e, i) => {
          const source = idMap.get(e.source);
          const target = idMap.get(e.target);
          if (!source || !target) return null;
          return {
            type: 'add' as const,
            item: {
              ...e,
              id: `${template.id}-${stamp}-${nodeCounter}-e${i}`,
              source,
              target,
            },
          };
        })
        .filter((change): change is NonNullable<typeof change> => change !== null);

      onNodesChange(nodeAdds);
      onEdgesChange(edgeAdds);
    },
    [onNodesChange, onEdgesChange],
  );

  const [ghostDrag, setGhostDrag] = useState<{
    shape: Shape;
    width: number;
    height: number;
  } | null>(null);
  const ghostPos = useRef({ x: 0, y: 0 });
  const ghostFrame = useRef(0);
  const ghostElRef = useRef<HTMLDivElement>(null);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';

    ghostPos.current = { x: event.clientX, y: event.clientY };

    if (ghostElRef.current) {
      cancelAnimationFrame(ghostFrame.current);
      ghostFrame.current = requestAnimationFrame(() => {
        if (ghostElRef.current) {
          ghostElRef.current.style.left = `${ghostPos.current.x}px`;
          ghostElRef.current.style.top = `${ghostPos.current.y}px`;
        }
      });
    }
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setGhostDrag(null);

      const raw = event.dataTransfer.getData('application/ghost-shape');
      if (!raw) return;

      const payload: ShapeDragPayload = JSON.parse(raw);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const id = `${payload.shape}-${Date.now()}-${++nodeCounter}`;

      const newNode: CanvasNode = {
        id,
        type: 'canvasNode',
        position,
        data: {
          label: '',
          color: 'var(--accent-primary-dim)',
          shape: payload.shape,
          textColor: 'var(--text-primary)',
        },
        width: payload.width,
        height: payload.height,
      };

      onNodesChange([{ type: 'add', item: newNode }]);
    },
    [reactFlowInstance, onNodesChange],
  );

  const handleShapeDragStart = useCallback(
    (shape: Shape, width: number, height: number) => {
      setGhostDrag({ shape, width, height });
    },
    [],
  );

  const handleShapeDragEnd = useCallback(() => {
    setGhostDrag(null);
  }, []);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        defaultEdgeOptions={defaultEdgeOptions}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{ backgroundColor: 'var(--bg-base)' }}
      >
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <marker
              id="edge-arrowhead"
              viewBox="0 0 10 7"
              refX="9"
              refY="3.5"
              markerWidth="10"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="currentColor"
              />
            </marker>
          </defs>
        </svg>
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="var(--border-subtle)"
        />
        </ReactFlow>

      {ghostDrag && (
        <div
          ref={ghostElRef}
          style={{
            position: 'fixed',
            left: ghostPos.current.x,
            top: ghostPos.current.y,
            transform: 'translate(-50%, -50%)',
            opacity: 0.6,
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          <ShapeRenderer
            shape={ghostDrag.shape}
            width={ghostDrag.width}
            height={ghostDrag.height}
            color="var(--accent-primary-dim)"
            borderColor="var(--accent-primary)"
            borderWidth={2}
          />
        </div>
      )}

      <CanvasControlBar />

      <ShapePanel
        onDragStart={handleShapeDragStart}
        onDragEnd={handleShapeDragEnd}
      />

      <StarterTemplatesModal
        open={showTemplates}
        onOpenChange={onTemplatesOpenChange ?? (() => {})}
        onImport={handleImportTemplate}
      />
    </div>
  );
}

function CanvasLoadingFallback() {
  return (
    <div
      style={{ backgroundColor: 'var(--bg-base)' }}
      className="flex-1 flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{
            borderColor: 'var(--border-subtle)',
            borderTopColor: 'var(--accent-primary)',
          }}
        />
        <p style={{ color: 'var(--text-muted)' }} className="text-sm">
          Loading canvas…
        </p>
      </div>
    </div>
  );
}

function CanvasErrorFallback() {
  return (
    <div
      style={{ backgroundColor: 'var(--bg-base)' }}
      className="flex-1 flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-3 text-center max-w-xs">
        <p style={{ color: 'var(--state-error)' }} className="text-sm font-medium">
          Connection error
        </p>
        <p style={{ color: 'var(--text-muted)' }} className="text-xs">
          Could not connect to the collaboration server. Check your connection
          and try again.
        </p>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}