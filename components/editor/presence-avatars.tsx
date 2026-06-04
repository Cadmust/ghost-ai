'use client';

import { useOthers } from '@liveblocks/react/suspense';
import { useUser, UserButton } from '@clerk/nextjs';

const AVATAR_SIZE = 32;
const MAX_VISIBLE = 5;

interface Collaborator {
  connectionId: number;
  id: string;
  name: string;
  avatar: string;
  color: string;
}

/**
 * Presence avatar group shown in the top-right of the editor canvas.
 *
 * Collaborators come from Liveblocks presence (excluding the current Clerk
 * user). The current user is always rendered separately via Clerk's UserButton,
 * so they never appear twice.
 */
export function PresenceAvatars() {
  const { user } = useUser();
  const currentUserId = user?.id;

  const collaborators = useOthers((others) =>
    others
      .filter((other) => other.id && other.id !== currentUserId)
      .map<Collaborator>((other) => ({
        connectionId: other.connectionId,
        id: other.id as string,
        name: other.info.name,
        avatar: other.info.avatar,
        color: other.info.color,
      })),
  );

  const visible = collaborators.slice(0, MAX_VISIBLE);
  const overflow = collaborators.length - visible.length;

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-30 flex items-center gap-2">
      {collaborators.length > 0 && (
        <div className="pointer-events-auto flex items-center -space-x-2">
          {visible.map((collaborator) => (
            <CollaboratorAvatar key={collaborator.connectionId} collaborator={collaborator} />
          ))}

          {overflow > 0 && (
            <div
              className="flex items-center justify-center rounded-full text-xs font-medium ring-2"
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                // @ts-expect-error -- ring color via CSS variable
                '--tw-ring-color': 'var(--bg-base)',
              }}
            >
              +{overflow}
            </div>
          )}
        </div>
      )}

      {/* Divider only when at least one collaborator exists */}
      {collaborators.length > 0 && (
        <div
          className="h-6 w-px"
          style={{ backgroundColor: 'var(--border-subtle)' }}
        />
      )}

      {/* Current user — Clerk UserButton (display + account actions) */}
      <div className="pointer-events-auto flex items-center">
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: { width: AVATAR_SIZE, height: AVATAR_SIZE },
            },
          }}
        />
      </div>
    </div>
  );
}

function CollaboratorAvatar({ collaborator }: { collaborator: Collaborator }) {
  const initials = collaborator.name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full ring-2 select-none"
      title={collaborator.name}
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        backgroundColor: collaborator.color,
        color: 'var(--bg-base)',
        // @ts-expect-error -- ring color via CSS variable
        '--tw-ring-color': 'var(--bg-base)',
      }}
    >
      {collaborator.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={collaborator.avatar}
          alt={collaborator.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-xs font-semibold">{initials}</span>
      )}
    </div>
  );
}
