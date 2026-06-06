'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Copy,
  Check,
  Mail,
  UserPlus,
  X,
  Loader2,
} from 'lucide-react';

interface Collaborator {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  isOwner: boolean;
}

export function ShareDialog({ open, onOpenChange, projectId, isOwner }: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCollaborators = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, { cache: 'no-store', signal });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const detail = data?.detail ? `: ${data.detail}` : '';
        throw new Error(`Failed to load collaborators (${res.status})${detail}`);
      }
      const data = await res.json();
      if (signal?.aborted) return;
      setCollaborators(Array.isArray(data.collaborators) ? data.collaborators : []);
    } catch (e) {
      if (signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) return;
      setError(e instanceof Error ? e.message : 'Failed to load collaborators');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [projectId]);

  // Load (and reload) the list whenever the dialog opens. This is driven by the
  // controlled `open` PROP, not Radix's onOpenChange — onOpenChange only fires
  // for Radix-internal triggers, so opening the dialog from the parent's Share
  // button (which flips the `open` prop directly) would otherwise never refetch,
  // leaving a stale/empty list after navigating away and back. The AbortSignal
  // guards against a remount/reopen race overwriting fresh data with stale data.
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetchCollaborators(controller.signal);
    return () => controller.abort();
  }, [open, fetchCollaborators]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    onOpenChange(nextOpen);
  }, [onOpenChange]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) return;

    setInviting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      if (res.status === 409) {
        setError('This user is already a collaborator');
        return;
      }

      if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Invalid email');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to invite collaborator');
      }

      setInviteEmail('');
      await fetchCollaborators();
    } catch (e) {
      setError('Failed to invite collaborator');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (email: string) => {
    setRemoving(email);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators?email=${encodeURIComponent(email)}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        throw new Error('Failed to remove collaborator');
      }

      await fetchCollaborators();
    } catch (e) {
      setError('Failed to remove collaborator');
    } finally {
      setRemoving(null);
    }
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/editor/${projectId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={() => {
          setInviteEmail('');
          setCopied(false);
        }}
      >
        <DialogHeader>
          <DialogTitle>Share project</DialogTitle>
          <DialogDescription>
            {isOwner
              ? 'Invite collaborators to edit this project with you.'
              : 'Collaborators on this project.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Copy link */}
          <div className="flex flex-col gap-1.5">
            <span
              style={{ color: 'var(--text-secondary)' }}
              className="text-xs font-medium"
            >
              Project link
            </span>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/editor/${projectId}`}
                  onClick={(e) => e.currentTarget.select()}
                  className="pr-8 text-xs"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-1.5 shrink-0"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: copied ? 'var(--state-success)' : 'var(--text-primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                }}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" style={{ color: 'var(--state-success)' }} />
                    <span style={{ color: 'var(--state-success)' }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Separator */}
          <div
            style={{ backgroundColor: 'var(--border-subtle)' }}
            className="h-px w-full"
          />

          {/* Invite form — owner only */}
          {isOwner && (
            <div className="flex flex-col gap-1.5">
              <span
                style={{ color: 'var(--text-secondary)' }}
                className="text-xs font-medium"
              >
                Invite by email
              </span>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Mail
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <Input
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInvite();
                    }}
                    className="pl-8 text-xs"
                  />
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim() || !inviteEmail.includes('@')}
                  className="gap-1.5 shrink-0"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: '#080809',
                  }}
                >
                  {inviting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
                  )}
                  Invite
                </Button>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div
              style={{ color: 'var(--state-error)' }}
              className="text-xs"
            >
              {error}
            </div>
          )}

          {/* Collaborators list */}
          <div className="flex flex-col gap-1.5">
            <span
              style={{ color: 'var(--text-secondary)' }}
              className="text-xs font-medium"
            >
              Collaborators ({collaborators.length})
            </span>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </div>
              ) : collaborators.length === 0 ? (
                <p
                  style={{ color: 'var(--text-muted)' }}
                  className="text-xs py-4 text-center"
                >
                  No collaborators yet
                </p>
              ) : (
                collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                    className="flex items-center gap-2.5 rounded-xl border px-3 py-2"
                  >
                    {/* Avatar */}
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                      style={{
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {collab.avatarUrl ? (
                        <img
                          src={collab.avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium uppercase">
                          {(collab.name?.[0] || collab.email[0])}
                        </span>
                      )}
                    </div>

                    {/* Name / Email */}
                    <div className="flex-1 min-w-0">
                      <div
                        style={{ color: 'var(--text-primary)' }}
                        className="text-xs font-medium truncate"
                      >
                        {collab.name || collab.email}
                      </div>
                      {collab.name && (
                        <div
                          style={{ color: 'var(--text-muted)' }}
                          className="text-[11px] truncate"
                        >
                          {collab.email}
                        </div>
                      )}
                    </div>

                    {/* Remove — owner only */}
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemove(collab.email)}
                        disabled={removing === collab.email}
                        aria-label={`Remove ${collab.email}`}
                        style={{ color: 'var(--text-muted)' }}
                        className="hover:opacity-60 shrink-0"
                      >
                        {removing === collab.email ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}