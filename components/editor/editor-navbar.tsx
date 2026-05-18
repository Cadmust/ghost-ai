import { Button } from "@/components/ui/button";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export function EditorNavbar({ isSidebarOpen, onSidebarToggle }: EditorNavbarProps) {
  return (
    <nav className="fixed left-0 right-0 top-0 h-16 flex items-center px-4 bg-background/80 backdrop-blur border-b border-border/50 z-50">
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
        {/* Right section - stays empty for now */}
      </div>
    </nav>
  );
}