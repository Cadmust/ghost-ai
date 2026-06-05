import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, LayoutTemplateIcon, BotMessageSquare, PanelLeftOpen, PanelLeftClose, Loader2, Save } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import type { SaveStatus } from '@/hooks/use-canvas-autosave';

interface WorkspaceNavbarProps {
  projectName: string;
  isSidebarOpen: boolean;
  isAiSidebarOpen: boolean;
  saveStatus: SaveStatus;
  onSidebarToggle: () => void;
  onAiSidebarToggle: () => void;
  onShare: () => void;
  onTemplates: () => void;
  onSave: () => void;
}

// How long the Save button lingers on "Saved" / "Error" before returning to
// "Save", so the outcome is visible without becoming a permanent label.
const SAVE_BUTTON_RESET_MS = 1500;

const SAVE_BUTTON_LABEL: Record<SaveStatus, string> = {
  idle: 'Save',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Error',
};

export function WorkspaceNavbar({
  projectName,
  isSidebarOpen,
  isAiSidebarOpen,
  saveStatus,
  onSidebarToggle,
  onAiSidebarToggle,
  onShare,
  onTemplates,
  onSave,
}: WorkspaceNavbarProps) {
  // The button mirrors saveStatus, but a terminal "saved"/"error" should only
  // show briefly then fall back to "Save". The effect syncs the displayed
  // status to each change and schedules a revert for terminal states; the
  // timeout fires once per status change, so repeated saves each show their
  // own brief confirmation.
  const [buttonStatus, setButtonStatus] = useState<SaveStatus>(saveStatus);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing button label to the latest save status
    setButtonStatus(saveStatus);
    if (saveStatus === 'saved' || saveStatus === 'error') {
      const timer = setTimeout(() => setButtonStatus('idle'), SAVE_BUTTON_RESET_MS);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const isSaving = buttonStatus === 'saving';
  return (
    <nav
      style={{
        backgroundColor: 'var(--bg-base)',
        borderBottomColor: 'var(--border-subtle)',
      }}
      className="fixed left-0 right-0 top-0 h-14 flex items-center px-4 border-b backdrop-blur z-[60]"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          aria-label="Toggle project sidebar"
          style={{ color: 'var(--text-primary)' }}
          className="hover:bg-muted/30 shrink-0"
        >
          {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </Button>
        <h1
          style={{ color: 'var(--text-primary)' }}
          className="text-sm font-medium truncate"
        >
          {projectName}
        </h1>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          aria-live="polite"
          aria-label="Save canvas"
          style={{ color: 'var(--text-secondary)' }}
          className="hover:bg-muted/30 gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {SAVE_BUTTON_LABEL[buttonStatus]}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onTemplates}
          style={{ color: 'var(--text-secondary)' }}
          className="hover:bg-muted/30 gap-2"
        >
          <LayoutTemplateIcon className="h-4 w-4" />
          Templates
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onShare}
          style={{ color: 'var(--text-secondary)' }}
          className="hover:bg-muted/30 gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onAiSidebarToggle}
          aria-label="Toggle AI sidebar"
          aria-pressed={isAiSidebarOpen}
          style={{ color: isAiSidebarOpen ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
          className="hover:bg-muted/30"
        >
          <BotMessageSquare className="h-4 w-4" />
        </Button>
        <UserButton />
      </div>
    </nav>
  );
}