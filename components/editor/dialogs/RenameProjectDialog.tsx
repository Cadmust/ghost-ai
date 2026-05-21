import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RenameProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentProjectName: string | null;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error?: string | null;
}

export function RenameProjectDialog({
  isOpen,
  onOpenChange,
  currentProjectName,
  projectName,
  onProjectNameChange,
  onSubmit,
  loading,
  error,
}: RenameProjectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Project</DialogTitle>
          <DialogDescription>
            Renaming "{currentProjectName}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Project name"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            autoFocus
          />
          {error && (
            <div 
              style={{ color: 'var(--text-error, #ff4444)' }}
              className="text-sm p-2 rounded bg-red-900/20"
            >
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="text" 
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={onSubmit}
              disabled={loading || !projectName.trim()}
              className="flex-1 sm:flex-none"
            >
              {loading ? "Renaming..." : "Rename Project"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}