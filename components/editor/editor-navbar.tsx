import { Button } from "@/components/ui/button";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export function EditorNavbar({ isSidebarOpen, onSidebarToggle }: EditorNavbarProps) {
  return (
    <nav 
      style={{
        backgroundColor: 'var(--bg-base)',
        borderBottomColor: 'var(--border-subtle)',
      }}
      className="fixed left-0 right-0 top-0 h-16 flex items-center px-4 border-b backdrop-blur z-[60]"
    >
      <div className="flex-1 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        {/* Center section - can be extended later */}
      </div>
      <div className="flex-1 flex items-center justify-end">
        <UserButton />
      </div>
    </nav>
  );
}