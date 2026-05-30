import { Button } from '@/components/ui/button';
import { Share2, LayoutTemplateIcon, PanelRightOpen, PanelRightClose, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

interface WorkspaceNavbarProps {
  projectName: string;
  isSidebarOpen: boolean;
  isAiSidebarOpen: boolean;
  onSidebarToggle: () => void;
  onAiSidebarToggle: () => void;
  onShare: () => void;
  onTemplates: () => void;
}

export function WorkspaceNavbar({
  projectName,
  isSidebarOpen,
  isAiSidebarOpen,
  onSidebarToggle,
  onAiSidebarToggle,
  onShare,
  onTemplates,
}: WorkspaceNavbarProps) {
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
          style={{ color: 'var(--text-secondary)' }}
          className="hover:bg-muted/30"
        >
          {isAiSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </Button>
        <UserButton />
      </div>
    </nav>
  );
}