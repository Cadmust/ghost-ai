'use client';

import { Component, type ReactNode, useCallback, useEffect, useState, useRef, type DragEvent, type MouseEvent } from 'react';
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
import { PresenceAvatars } from '@/components/editor/presence-avatars';
import { LiveCursors } from '@/components/editor/live-cursors';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useCanvasAutosave, type SaveStatus } from '@/hooks/use-canvas-autosave';
import { useUndo, useRedo, useUpdateMyPresence } from '@liveblocks/react';
import { StarterTemplatesModal } from '@/components/editor/starter-templates-modal';
import type { CanvasTemplate } from '@/components/editor/starter-templates';
import { SHAPE_DEFAULT_SIZES } from '@/types/canvas';
import type { CanvasNode, CanvasEdge, ShapeDragPayload, Shape } from '@/types/canvas';

interface CanvasEditorProps {
  roomId: string;
  showTemplates?: boolean;
  onTemplatesOpenChange?: (open: boolean) => void;
  onSaveStatusChange?: (status: SaveStatus) => void;
  onSaveAvailable?: (save: () => Promise<void>) => void;
}

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

export function CanvasEditor({ roomId, showTemplates = false, onTemplatesOpenChange, onSaveStatusChange, onSaveAvailable }: CanvasEditorProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{ cursor: null, thinking: false }}>
        <ErrorBoundary fallback={<CanvasErrorFallback />}>
          <ClientSideSuspense fallback={<CanvasLoadingFallback />}>
            {() => (
              <CanvasFlow
                projectId={roomId}
                showTemplates={showTemplates}
                onTemplatesOpenChange={onTemplatesOpenChange}
                onSaveStatusChange={onSaveStatusChange}
                onSaveAvailable={onSaveAvailable}
              />
            )}
          </ClientSideSuspense>
        </ErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

interface CanvasFlowProps {
  projectId: string;
  showTemplates: boolean;
  onTemplatesOpenChange?: (open: boolean) => void;
  onSaveStatusChange?: (status: SaveStatus) => void;
  onSaveAvailable?: (save: () => Promise<void>) => void;
}

function CanvasFlow({ projectId, showTemplates, onTemplatesOpenChange, onSaveStatusChange, onSaveAvailable }: CanvasFlowProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner
        projectId={projectId}
        showTemplates={showTemplates}
        onTemplatesOpenChange={onTemplatesOpenChange}
        onSaveStatusChange={onSaveStatusChange}
        onSaveAvailable={onSaveAvailable}
      />
    </ReactFlowProvider>
  );
}

function CanvasFlowInner({ projectId, showTemplates, onTemplatesOpenChange, onSaveStatusChange, onSaveAvailable }: CanvasFlowProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true });
  const reactFlowInstance = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const undo = useUndo();
  const redo = useRedo();

  const updateMyPresence = useUpdateMyPresence();

  useKeyboardShortcuts({ reactFlowInstance, undo, redo });

  // Latest nodes/edges read from a ref so the keydown handler can stay attached
  // once without re-binding on every collaborative change.
  const selectionRef = useRef({ nodes, edges });
  useEffect(() => {
    selectionRef.current = { nodes, edges };
  }, [nodes, edges]);

  // Delete selected nodes and edges on Delete / Backspace. Deletion goes through
  // Liveblocks' onDelete mutation, which removes them from shared Storage so the
  // change syncs to every connected client in real time. (onNodesChange /
  // onEdgesChange ignore `remove` changes — the @liveblocks/react-flow remove
  // case is a no-op — so onDelete is the only collaborative delete path.) React
  // Flow's built-in deleteKeyCode is intentionally left unset. The listener is
  // on the canvas wrapper, but keyboard focus does not reliably land inside the
  // React Flow pane, so it is registered on window and scoped by guarding the
  // edit-target check below.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;

      // Only act when the interaction is happening on this canvas: ignore key
      // presses that originate outside the canvas wrapper (sidebars, dialogs).
      const target = event.target as HTMLElement | null;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      if (target && target !== document.body && !wrapper.contains(target)) {
        return;
      }

      // Never hijack deletion while the user is editing text.
      if (target) {
        const tag = target.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      const selectedNodes = selectionRef.current.nodes.filter((n) => n.selected);
      const selectedEdges = selectionRef.current.edges.filter((e) => e.selected);

      if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

      event.preventDefault();

      onDelete({ nodes: selectedNodes, edges: selectedEdges });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDelete]);

  // Load saved canvas state once, only into an empty room. If the room already
  // has nodes or edges, skip the load entirely so active collaboration is never
  // overwritten. Autosave stays disabled until this check resolves so the
  // initial empty state can't clobber the persisted blob.
  const hasLoadedRef = useRef(false);
  const [loadResolved, setLoadResolved] = useState(false);
  // Set when the canvas had content at load time, so we frame it once. Never
  // set for later additions (drop / import), so fitView can't fire on a drop.
  const [shouldFitOnLoad, setShouldFitOnLoad] = useState(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    if (nodes.length > 0 || edges.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load resolution
      setShouldFitOnLoad(true);
      setLoadResolved(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`);
        if (!cancelled && response.ok) {
          const saved: { nodes?: CanvasNode[]; edges?: CanvasEdge[] } = await response.json();
          const savedNodes = saved.nodes ?? [];
          const savedEdges = saved.edges ?? [];

          if (savedNodes.length > 0 || savedEdges.length > 0) {
            onNodesChange(savedNodes.map((item) => ({ type: 'add', item })));
            onEdgesChange(savedEdges.map((item) => ({ type: 'add', item })));
            if (!cancelled) setShouldFitOnLoad(true);
          }
        }
      } catch {
        // Loading failed; leave the room empty and let the user start fresh.
      } finally {
        if (!cancelled) setLoadResolved(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Run once on mount; node/edge presence is captured at first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Frame the diagram once, only when the canvas already had content at load
  // time. fitView is intentionally NOT passed as a ReactFlow prop and is keyed
  // off shouldFitOnLoad (never off the live node count), so dropping the first
  // node onto an empty canvas does not trigger an automatic zoom-in — the
  // viewport stays exactly where the user left it.
  const hasFitRef = useRef(false);
  useEffect(() => {
    if (hasFitRef.current || !loadResolved || !shouldFitOnLoad) return;
    hasFitRef.current = true;
    reactFlowInstance.fitView({ duration: 200 });
  }, [loadResolved, shouldFitOnLoad, reactFlowInstance]);

  const { status: saveStatus, save } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: loadResolved,
  });

  useEffect(() => {
    onSaveStatusChange?.(saveStatus);
  }, [saveStatus, onSaveStatusChange]);

  // Expose the manual save function so the workspace Save button can trigger
  // an immediate save through the same path as autosave.
  useEffect(() => {
    onSaveAvailable?.(save);
  }, [save, onSaveAvailable]);

  // Broadcast the cursor in flow (canvas) coordinates so it stays anchored to
  // the same point on the diagram regardless of each viewer's pan and zoom.
  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      const { x, y } = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      updateMyPresence({ cursor: { x, y } });
    },
    [reactFlowInstance, updateMyPresence],
  );

  const onMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      // Offset imported nodes slightly so they don't overlap the existing canvas
      const offsetX = 80;
      const offsetY = 80;

      // Build a stable map from each template node's original id to a fresh
      // unique id, so the canvas can be imported repeatedly without collisions.
      // Use a globally-unique stamp (not Date.now()/a per-client counter) so
      // concurrent imports from different clients in the same room can't collide.
      const importStamp = crypto.randomUUID();
      const idMap = new Map<string, string>();
      template.nodes.forEach((n, i) => {
        idMap.set(n.id, `${template.id}-${importStamp}-n${i}`);
      });

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
              id: `${template.id}-${importStamp}-e${i}`,
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

      // screenToFlowPosition already accounts for the canvas container's
      // bounding rect plus the current React Flow pan offset and zoom scale.
      // The cursor marks where the node's center should land (the drag ghost is
      // centered on the cursor), so shift the position back by half the node's
      // width/height to get its top-left, which is what React Flow expects.
      const cursor = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const position = {
        x: cursor.x - payload.width / 2,
        y: cursor.y - payload.height / 2,
      };

      const id = `${payload.shape}-${crypto.randomUUID()}`;

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
    <div ref={wrapperRef} tabIndex={-1} className="w-full h-full relative outline-none">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        defaultEdgeOptions={defaultEdgeOptions}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
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

      <LiveCursors />

      <PresenceAvatars />

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