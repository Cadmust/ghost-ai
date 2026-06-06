'use client';

import { memo } from 'react';
import { useOther, useOthersConnectionIds } from '@liveblocks/react/suspense';
import { useReactFlow } from '@xyflow/react';
import { Loader2 } from 'lucide-react';

/**
 * Renders live cursors for every other participant in the room.
 *
 * Cursor positions are broadcast in flow (canvas) coordinates so they stay
 * anchored to the same point on the diagram regardless of each viewer's pan
 * and zoom. Here we convert back to screen coordinates for rendering.
 */
function LiveCursorsBase() {
  const connectionIds = useOthersConnectionIds();

  return (
    <>
      {connectionIds.map((connectionId) => (
        <Cursor key={connectionId} connectionId={connectionId} />
      ))}
    </>
  );
}

export const LiveCursors = memo(LiveCursorsBase);

function Cursor({ connectionId }: { connectionId: number }) {
  const cursor = useOther(connectionId, (other) => other.presence.cursor);
  const name = useOther(connectionId, (other) => other.info.name);
  const color = useOther(connectionId, (other) => other.info.color);
  const thinking = useOther(connectionId, (other) => other.presence.thinking);
  const { flowToScreenPosition } = useReactFlow();

  if (!cursor) return null;

  const { x, y } = flowToScreenPosition({ x: cursor.x, y: cursor.y });

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-50"
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      {/* Colored pointer */}
      <svg
        width="20"
        height="22"
        viewBox="0 0 20 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <path
          d="M1.5 1.5L7.5 19.5L10.5 12.5L17.5 9.5L1.5 1.5Z"
          fill={color}
          stroke="var(--bg-base)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* Name badge — shows a spinner while this participant is thinking
          (e.g. the AI agent generating, or a collaborator mid-action). */}
      <div
        className="absolute left-4 top-4 flex items-center gap-1 whitespace-nowrap rounded-xl px-2 py-0.5 text-xs font-medium shadow-sm"
        style={{
          backgroundColor: color,
          color: 'var(--bg-base)',
        }}
      >
        {thinking && <Loader2 className="h-3 w-3 shrink-0 animate-spin" />}
        {name}
      </div>
    </div>
  );
}
