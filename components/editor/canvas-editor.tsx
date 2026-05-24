'use client';

import { Component, type ReactNode, useCallback, type DragEvent } from 'react';
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from '@liveblocks/react';
import { useLiveblocksFlow } from '@liveblocks/react-flow';
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Background,
  BackgroundVariant,
  type DefaultEdgeOptions,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CanvasNodeRenderer } from '@/components/editor/canvas-node';
import { ShapePanel } from '@/components/editor/shape-panel';
import type { CanvasNode, CanvasEdge, ShapeDragPayload } from '@/types/canvas';

interface CanvasEditorProps {
  roomId: string;
}

let nodeCounter = 0;

const defaultEdgeOptions: DefaultEdgeOptions = {
  style: { stroke: 'var(--border-subtle)', strokeWidth: 2 },
};

const nodeTypes = {
  canvasNode: CanvasNodeRenderer,
};

export function CanvasEditor({ roomId }: CanvasEditorProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{ cursor: null, isThinking: false }}>
        <ErrorBoundary fallback={<CanvasErrorFallback />}>
          <ClientSideSuspense fallback={<CanvasLoadingFallback />}>
            {() => <CanvasFlow />}
          </ClientSideSuspense>
        </ErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function CanvasFlow() {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner />
    </ReactFlowProvider>
  );
}

function CanvasFlowInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true });
  const reactFlowInstance = useReactFlow();

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
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
        },
        width: payload.width,
        height: payload.height,
      };

      onNodesChange([{ type: 'add', item: newNode }]);
    },
    [reactFlowInstance, onNodesChange],
  );

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
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{ backgroundColor: 'var(--bg-base)' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="var(--border-subtle)"
        />
        <MiniMap
          style={{ backgroundColor: 'var(--bg-elevated)' }}
          maskColor="rgba(0,0,0,0.6)"
          nodeColor="var(--accent-primary-dim)"
          nodeBorderRadius={4}
        />
      </ReactFlow>
      <ShapePanel />
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