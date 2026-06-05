'use client';

import { useRef, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  BotMessageSquare,
  X,
  Sparkles,
  Send,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';

interface AiSidebarProps {
  /** Open/close state is owned by the parent. */
  isOpen: boolean;
  onClose: () => void;
  /** Project (and Liveblocks room) the design agent should generate into. */
  projectId: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  content: string;
}

const STARTER_PROMPTS = [
  'Design an e-commerce backend',
  'Create a chat app architecture',
  'Build a CI/CD pipeline',
];

const TEXTAREA_MIN_HEIGHT = 72;
const TEXTAREA_MAX_HEIGHT = 160;

export function AiSidebar({ isOpen, onClose, projectId }: AiSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = `${TEXTAREA_MIN_HEIGHT}px`;
    const next = Math.min(
      Math.max(el.scrollHeight, TEXTAREA_MIN_HEIGHT),
      TEXTAREA_MAX_HEIGHT,
    );
    el.style.height = `${next}px`;
  };

  const submitMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}`, role: 'user', content: trimmed },
    ]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = `${TEXTAREA_MIN_HEIGHT}px`;
    }

    // Kick off the background design agent. Progress (presence + status feed)
    // surfaces on the shared canvas for every participant, so the sidebar only
    // needs to confirm the request was accepted or report a failure.
    setIsSending(true);
    try {
      const response = await fetch('/api/ai/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed, projectId, roomId: projectId }),
      });
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-ack`,
          role: 'system',
          content: 'Ghost AI is working on the canvas — watch it build your design.',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'system',
          content: "Couldn't start the design agent. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

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
        className="flex-1 min-h-0 gap-0"
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
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
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
                  Describe a system and Ghost AI will map it onto the canvas.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleStarterClick(prompt)}
                      style={{
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--accent-primary)',
                      }}
                      className="rounded-full px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((message) =>
                  message.role === 'user' ? (
                    <div key={message.id} className="flex justify-end">
                      <div
                        style={{
                          backgroundColor: 'var(--accent-primary-dim)',
                          borderColor: 'color-mix(in srgb, var(--accent-primary) 50%, transparent)',
                          color: 'var(--text-primary)',
                        }}
                        className="max-w-[80%] rounded-2xl border-2 px-3 py-2 text-sm whitespace-pre-wrap break-words"
                      >
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div key={message.id} className="flex justify-start">
                      <div
                        style={{
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                        className="max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words"
                      >
                        {message.content}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Input area */}
          <div
            style={{ borderTopColor: 'var(--border-subtle)' }}
            className="border-t px-4 py-3 shrink-0"
          >
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResize(e.target);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Describe the system you want to design…"
                rows={1}
                style={{
                  minHeight: `${TEXTAREA_MIN_HEIGHT}px`,
                  maxHeight: `${TEXTAREA_MAX_HEIGHT}px`,
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                className="resize-none pr-12"
              />
              <Button
                type="button"
                size="icon"
                onClick={() => void submitMessage()}
                disabled={!input.trim() || isSending}
                aria-label="Send message"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--bg-base)',
                }}
                className="absolute bottom-2 right-2 h-8 w-8 disabled:opacity-40"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Specs tab */}
        <TabsContent
          value="specs"
          className="flex flex-col min-h-0 data-[state=inactive]:hidden"
        >
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            <Button
              type="button"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
              }}
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate Spec
            </Button>

            {/* Demo spec card */}
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
              className="rounded-2xl border p-4 flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
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
                    className="text-sm font-medium leading-tight"
                  >
                    System Architecture Spec
                  </h3>
                  <p
                    style={{ color: 'var(--text-muted)' }}
                    className="mt-1 text-xs leading-relaxed line-clamp-2"
                  >
                    A generated technical specification describing the services,
                    data stores, and message flows on the canvas.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
                className="w-full gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
