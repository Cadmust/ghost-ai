'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRealtimeRun } from '@trigger.dev/react-hooks';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  BotMessageSquare,
  X,
  Sparkles,
  Send,
  FileText,
  Loader2,
} from 'lucide-react';
import { useAiStatusFeed } from '@/hooks/use-ai-status-feed';
import { useAiChatFeed } from '@/hooks/use-ai-chat-feed';
import { SpecsPanel } from '@/components/editor/specs-panel';
import type { designAgentTask } from '@/trigger/design-agent';

interface AiSidebarProps {
  /** Project / Liveblocks room the design agent should act on. */
  projectId: string;
  /** Open/close state is owned by the parent. */
  isOpen: boolean;
  onClose: () => void;
}

/** A triggered design run we're tracking via Trigger.dev realtime. */
interface ActiveRun {
  runId: string;
  publicToken: string;
}

const STARTER_PROMPTS = [
  'Design an e-commerce backend',
  'Create a chat app architecture',
  'Build a CI/CD pipeline',
];

const TEXTAREA_MIN_HEIGHT = 72;
const TEXTAREA_MAX_HEIGHT = 160;

/** Format a message timestamp as a short local time (e.g. "3:42 PM"). */
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function AiSidebar({ projectId, isOpen, onClose }: AiSidebarProps) {
  const [input, setInput] = useState('');
  const [sendError, setSendError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Shared room chat over the `ai-chat` feed — separate from the AI status feed
  // below. Messages are broadcast to and received from every participant. The
  // user's prompt and the AI's completion summary are both posted here.
  const { messages, sendMessage, sendAiMessage } = useAiChatFeed();

  // Shared generation state from the `ai-status-feed` — broadcast by the design
  // agent and visible to EVERY participant. Drives the status strip + busy
  // state regardless of who triggered the run.
  const { latest: aiStatus, isActive: isGenerating } = useAiStatusFeed();

  // Subscribe to the run we triggered. useRealtimeRun is a no-op until a runId
  // is provided; on completion we post the agent's summary back to the chat and
  // clear the run so the composer re-enables. The canvas itself updates through
  // Liveblocks (Storage mutated server-side) — never touched here.
  const { run: trackedRun } = useRealtimeRun<typeof designAgentTask>(
    activeRun?.runId,
    {
      accessToken: activeRun?.publicToken,
      enabled: !!activeRun,
      onComplete: (run, error) => {
        if (!error && run.output?.summary) {
          try {
            sendAiMessage(run.output.summary);
          } catch {
            // Posting the summary is best-effort; the canvas already updated.
          }
        }
        setActiveRun(null);
      },
    },
  );

  // Safety net: clear the run as soon as the subscription reports a terminal
  // status, even if onComplete didn't fire (a dropped/late terminal snapshot
  // would otherwise leave the composer stuck on "Ghost AI is working…"). The
  // summary is posted from onComplete; this only guarantees the busy state
  // releases. Runs only advance forward, so a terminal status is final.
  useEffect(() => {
    if (!trackedRun || !activeRun) return;
    if (trackedRun.id !== activeRun.runId) return;
    const TERMINAL: readonly string[] = [
      'COMPLETED',
      'FAILED',
      'CANCELED',
      'CRASHED',
      'SYSTEM_FAILURE',
      'EXPIRED',
      'TIMED_OUT',
    ];
    if (TERMINAL.includes(trackedRun.status)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- terminal-status release from realtime subscription
      setActiveRun(null);
    }
  }, [trackedRun, activeRun]);

  // A run is in flight while we're POSTing, while our own run is live, or while
  // ANY participant's run is active on the shared status feed (collaborative
  // busy state). `activeRun` follows the authoritative Trigger.dev run state and
  // clears on a terminal status (see the effect above), and `isGenerating` is
  // now self-healing (useAiStatusFeed clears a stale active status), so a
  // dropped terminal event can no longer wedge the composer shut indefinitely.
  const isBusy = isSubmitting || !!activeRun || isGenerating;

  // Keep the chat scrolled to the latest message as it grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = `${TEXTAREA_MIN_HEIGHT}px`;
    const next = Math.min(
      Math.max(el.scrollHeight, TEXTAREA_MIN_HEIGHT),
      TEXTAREA_MAX_HEIGHT,
    );
    el.style.height = `${next}px`;
  };

  const submitMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isBusy) return;

    // Post the user's prompt to the shared chat immediately.
    try {
      sendMessage(trimmed);
    } catch {
      setSendError(true);
      return;
    }

    // Clear the composer once the prompt is in the feed.
    setInput('');
    setSendError(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = `${TEXTAREA_MIN_HEIGHT}px`;
    }

    // Trigger the design agent and start tracking the run.
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/ai/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // roomId == projectId — the canvas room is keyed by project id.
        body: JSON.stringify({ prompt: trimmed, roomId: projectId, projectId }),
      });
      if (!response.ok) throw new Error(`Design request failed: ${response.status}`);

      const { runId, publicToken } = (await response.json()) as {
        runId?: string;
        publicToken?: string;
      };
      if (!runId || !publicToken) throw new Error('Missing run token');

      setActiveRun({ runId, publicToken });
    } catch {
      // Surface a small error and let the realtime/status feed clear itself.
      setSendError(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [input, isBusy, sendMessage, projectId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submitMessage();
    }
  };

  const handleStarterClick = (prompt: string) => {
    setInput(prompt);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        autoResize(textareaRef.current);
      }
    });
  };

  return (
    <aside
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 95%, transparent)',
        borderLeftColor: 'var(--border-subtle)',
      }}
      className={`fixed right-0 top-14 bottom-0 w-80 z-40 border-l backdrop-blur shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <header
        style={{ borderBottomColor: 'var(--border-subtle)' }}
        className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
      >
        <div
          style={{
            backgroundColor: 'var(--accent-primary-dim)',
            color: 'var(--accent-primary)',
          }}
          className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
        >
          <BotMessageSquare className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            style={{ color: 'var(--text-primary)' }}
            className="text-sm font-semibold leading-tight truncate"
          >
            AI Workspace
          </h2>
          <p
            style={{ color: 'var(--text-muted)' }}
            className="text-xs leading-tight truncate"
          >
            Collaborate with Ghost AI
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close AI sidebar"
          style={{ color: 'var(--text-muted)' }}
          className="hover:bg-muted/30 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      {/* Tabbed layout */}
      <Tabs
        defaultValue="architect"
        className="flex-1 min-h-0 min-w-0 gap-0"
      >
        <div className="px-4 pt-3 shrink-0">
          <TabsList className="w-full bg-transparent gap-1">
            <TabsTrigger value="architect" className="flex-1">
              <Sparkles className="h-4 w-4" />
              AI Architect
            </TabsTrigger>
            <TabsTrigger value="specs" className="flex-1">
              <FileText className="h-4 w-4" />
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Architect tab */}
        <TabsContent
          value="architect"
          className="flex flex-col min-h-0 data-[state=inactive]:hidden"
        >
          {/* Scrollable chat area */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center gap-4 py-8">
                <div
                  style={{
                    backgroundColor: 'var(--accent-primary-dim)',
                    color: 'var(--accent-primary)',
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                >
                  <Sparkles className="h-6 w-6" />
                </div>
                <p
                  style={{ color: 'var(--text-muted)' }}
                  className="text-sm max-w-[14rem]"
                >
                  Describe a system and Ghost AI will design it on the canvas.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleStarterClick(prompt)}
                      disabled={isBusy}
                      style={{
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--accent-primary)',
                      }}
                      className="rounded-full px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((message) => {
                  const isAi = message.role === 'ai';
                  return (
                    <div
                      key={message.id}
                      className={`flex flex-col gap-1 ${isAi ? 'items-start' : 'items-end'}`}
                    >
                      {/* Sender + timestamp */}
                      <div
                        className="flex items-center gap-2 px-1 text-[11px]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <span className="font-medium truncate max-w-[10rem]">
                          {message.sender}
                        </span>
                        <span>{formatTime(message.timestamp)}</span>
                      </div>
                      {/* Message content */}
                      <div
                        style={
                          isAi
                            ? {
                                backgroundColor: 'var(--bg-subtle)',
                                color: 'var(--text-secondary)',
                              }
                            : {
                                backgroundColor: 'var(--accent-primary-dim)',
                                borderColor:
                                  'color-mix(in srgb, var(--accent-primary) 50%, transparent)',
                                color: 'var(--text-primary)',
                              }
                        }
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                          isAi ? '' : 'border-2'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Input area */}
          <div
            style={{ borderTopColor: 'var(--border-subtle)' }}
            className="border-t px-4 py-3 shrink-0"
          >
            {/* Compact status strip — shown only while a run is active. Reflects
                the room-wide `ai-status-feed`, so every participant sees the
                latest progress line (not just the person who triggered it). */}
            {isBusy && (
              <div
                role="status"
                aria-live="polite"
                className="mb-2 flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: 'var(--accent-primary-dim)',
                  color: 'var(--accent-primary)',
                }}
              >
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                <span className="truncate">
                  {aiStatus?.text ?? 'Ghost AI is working…'}
                </span>
              </div>
            )}
            {/* Small error state if the last send failed. */}
            {sendError && (
              <p
                role="alert"
                className="mb-2 px-1 text-xs"
                style={{ color: 'var(--state-error)' }}
              >
                Couldn&apos;t send your message. Please try again.
              </p>
            )}
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (sendError) setSendError(false);
                  autoResize(e.target);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Describe a system to design…"
                rows={1}
                disabled={isBusy}
                style={{
                  minHeight: `${TEXTAREA_MIN_HEIGHT}px`,
                  maxHeight: `${TEXTAREA_MAX_HEIGHT}px`,
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                className="resize-none pr-12 disabled:opacity-60"
              />
              <Button
                type="button"
                size="icon"
                onClick={() => void submitMessage()}
                disabled={!input.trim() || isBusy}
                aria-label="Send message"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--bg-base)',
                }}
                className="absolute bottom-2 right-2 h-8 w-8 disabled:opacity-40"
              >
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Specs tab — lists persisted specs, opens a Markdown preview modal,
            and offers per-spec download (see SpecsPanel). */}
        <TabsContent
          value="specs"
          className="flex flex-col min-h-0 min-w-0 data-[state=inactive]:hidden"
        >
          <SpecsPanel
            projectId={projectId}
            chatHistory={messages.map((m) => ({
              sender: m.sender,
              role: m.role,
              content: m.content,
            }))}
          />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
