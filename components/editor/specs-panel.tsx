'use client';

import { useCallback, useEffect, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2, Eye, Sparkles } from 'lucide-react';
import { useSpecGeneration } from '@/hooks/use-spec-generation';

/** A persisted spec's metadata, as returned by the list endpoint. */
interface SpecItem {
  id: string;
  createdAt: string;
  filename: string;
}

/** A chat message handed to the spec generator as design context. */
interface SpecChatMessage {
  sender?: string;
  role?: string;
  content: string;
}

interface SpecsPanelProps {
  /** Project the specs belong to (== Liveblocks room id). */
  projectId: string;
  /**
   * Room chat history used as design context for spec generation. Sourced from
   * the sidebar's shared `ai-chat` feed so it stays the single source of truth.
   */
  chatHistory: SpecChatMessage[];
}

/** Format an ISO timestamp as a short local date + time. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Specs tab content: lists the project's generated specs, opens a Markdown
 * preview modal for a selected spec, and offers a download action per spec.
 *
 * The spec Markdown is always fetched through the secure download route
 * (GET /api/projects/{projectId}/specs/{specId}/download) — the client never
 * touches Vercel Blob directly. The same endpoint backs both preview (fetch +
 * read text) and download (browser navigation honors the attachment header).
 */
export function SpecsPanel({ projectId, chatHistory }: SpecsPanelProps) {
  const [specs, setSpecs] = useState<SpecItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Read the live canvas graph at generation time. SpecsPanel renders inside the
  // editor's ReactFlowProvider (AiSidebar → CanvasFlowInner), so getNodes/
  // getEdges reflect the current collaborative state without prop-drilling.
  const reactFlow = useReactFlow();

  // The spec being previewed (modal open when non-null).
  const [active, setActive] = useState<SpecItem | null>(null);
  const [content, setContent] = useState('');
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [contentError, setContentError] = useState(false);

  const loadSpecs = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const response = await fetch(`/api/projects/${projectId}/specs`);
      if (!response.ok) throw new Error(`List failed: ${response.status}`);
      const data = (await response.json()) as { specs?: SpecItem[] };
      setSpecs(data.specs ?? []);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Load the list on mount and whenever the project changes. loadSpecs sets a
  // loading flag synchronously before the fetch (standard fetch-on-mount), which
  // the set-state-in-effect rule flags — same convention used in canvas-editor.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount loading flag
    void loadSpecs();
  }, [loadSpecs]);

  // Spec generation: triggers the background task and refreshes the list when
  // the run completes (a new ProjectSpec record will have been persisted).
  const { isGenerating, error: generateError, generate } =
    useSpecGeneration(loadSpecs);

  const handleGenerate = useCallback(() => {
    void generate({
      roomId: projectId,
      nodes: reactFlow.getNodes(),
      edges: reactFlow.getEdges(),
      chatHistory,
    });
  }, [generate, projectId, reactFlow, chatHistory]);

  const downloadUrl = useCallback(
    (specId: string) =>
      `/api/projects/${projectId}/specs/${specId}/download`,
    [projectId],
  );

  // Open the preview modal and fetch the Markdown for the selected spec.
  const openPreview = useCallback(
    async (spec: SpecItem) => {
      setActive(spec);
      setContent('');
      setContentError(false);
      setIsContentLoading(true);
      try {
        const response = await fetch(downloadUrl(spec.id));
        if (!response.ok) throw new Error(`Content failed: ${response.status}`);
        setContent(await response.text());
      } catch {
        setContentError(true);
      } finally {
        setIsContentLoading(false);
      }
    },
    [downloadUrl],
  );

  // Let the browser handle the actual file download via the download route.
  const downloadSpec = useCallback(
    (specId: string) => {
      const link = document.createElement('a');
      link.href = downloadUrl(specId);
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    [downloadUrl],
  );

  return (
    <div className="flex flex-col min-h-0 min-w-0 w-full flex-1">
      {/* Generate action — reads the live canvas + room chat and triggers the
          spec background task. Disabled while a run is in flight; the shared
          status strip in the AI Architect tab reflects room-wide progress. */}
      <div
        style={{ borderBottomColor: 'var(--border-subtle)' }}
        className="border-b px-4 py-3 shrink-0"
      >
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--bg-base)',
          }}
          className="w-full gap-2 disabled:opacity-60"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating ? 'Generating spec…' : 'Generate spec'}
        </Button>
        {generateError && (
          <p
            role="alert"
            className="mt-2 px-1 text-xs"
            style={{ color: 'var(--state-error)' }}
          >
            Couldn&apos;t generate the spec. Please try again.
          </p>
        )}
      </div>

      {/* w-full + [&>div>div]:!block forces the Radix viewport's inner wrapper
          (display:table by default, which sizes to content) to respect the
          panel width so long filenames truncate instead of widening the panel. */}
      <ScrollArea className="flex-1 min-h-0 w-full [&>div>div]:!block [&>div>div]:!min-w-0">
        <div className="px-4 py-4 flex flex-col gap-3 min-w-0">
          {isLoading ? (
            <div
              className="flex items-center justify-center gap-2 py-8 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading specs…
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-xs" style={{ color: 'var(--state-error)' }}>
                Couldn&apos;t load specs.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadSpecs()}
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                Retry
              </Button>
            </div>
          ) : specs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div
                style={{
                  backgroundColor: 'var(--accent-primary-dim)',
                  color: 'var(--accent-primary)',
                }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
              >
                <FileText className="h-6 w-6" />
              </div>
              <p
                className="text-sm max-w-[14rem]"
                style={{ color: 'var(--text-muted)' }}
              >
                No specs yet. Generate one to capture your architecture as a
                technical spec.
              </p>
            </div>
          ) : (
            specs.map((spec) => (
              <div
                key={spec.id}
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="rounded-2xl border p-3 flex flex-col gap-3"
              >
                <button
                  type="button"
                  onClick={() => void openPreview(spec)}
                  className="flex w-full min-w-0 items-start gap-3 text-left transition-opacity hover:opacity-80"
                >
                  <div
                    style={{
                      backgroundColor: 'var(--accent-primary-dim)',
                      color: 'var(--accent-primary)',
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                  >
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      style={{ color: 'var(--text-primary)' }}
                      className="text-sm font-medium leading-tight truncate"
                    >
                      {spec.filename}
                    </h3>
                    <p
                      style={{ color: 'var(--text-muted)' }}
                      className="mt-0.5 text-xs leading-tight"
                    >
                      {formatDate(spec.createdAt)}
                    </p>
                  </div>
                </button>
                {/* Preview + Download: equal-width, matching accent (cyan)
                    outline buttons. Transparent bg overrides the outline
                    variant's `bg-background` (which is light); min-w-0 lets the
                    pair shrink to fit the narrow sidebar instead of overflowing. */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void openPreview(spec)}
                    style={{
                      backgroundColor: 'transparent',
                      borderColor:
                        'color-mix(in srgb, var(--accent-primary) 45%, transparent)',
                      color: 'var(--accent-primary)',
                    }}
                    className="flex-1 min-w-0 gap-1.5"
                  >
                    <Eye className="h-4 w-4 shrink-0" />
                    <span className="truncate">Preview</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => downloadSpec(spec.id)}
                    aria-label={`Download ${spec.filename}`}
                    style={{
                      backgroundColor: 'transparent',
                      borderColor:
                        'color-mix(in srgb, var(--accent-primary) 45%, transparent)',
                      color: 'var(--accent-primary)',
                    }}
                    className="flex-1 min-w-0 gap-1.5"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    <span className="truncate">Download</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Preview modal — Radix Dialog provides Esc/overlay close + focus trap. */}
      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        {/* Force a real flex column over DialogContent's base `grid` so the
            scroll region below can take the remaining height (flex-1 + min-h-0).
            overflow-hidden keeps long content clipped to the rounded box. */}
        <DialogContent className="sm:max-w-2xl max-h-[80vh] !flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">
              {active?.filename ?? 'Spec'}
            </DialogTitle>
            <DialogDescription>
              {active ? formatDate(active.createdAt) : ''}
            </DialogDescription>
          </DialogHeader>

          {/* Native overflow scroll (same pattern as the AI Architect chat) —
              reliably scrolls the full spec. flex-1 + min-h-0 lets it fill the
              dialog's remaining height; overscroll-contain stops scroll chaining. */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain -mx-1 px-1 pr-3">
            {isContentLoading ? (
              <div
                className="flex items-center justify-center gap-2 py-12 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading spec…
              </div>
            ) : contentError ? (
              <p
                className="py-12 text-center text-xs"
                style={{ color: 'var(--state-error)' }}
              >
                Couldn&apos;t load the spec content.
              </p>
            ) : (
              <div
                className="markdown-preview text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
