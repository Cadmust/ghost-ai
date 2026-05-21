import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface CreateProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  slug: string;
  onProjectNameChange: (name: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error?: string | null;
}

export function CreateProjectDialog({
  isOpen,
  onOpenChange,
  projectName,
  slug,
  onProjectNameChange,
  onSubmit,
  loading,
  error,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Enter a name for your new project. A slug will be generated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Project name"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            autoFocus
          />
          <div className="text-sm text-muted-foreground">
            Slug: <code className="bg-muted px-1 py-0.5 rounded">{slug}</code>
          </div>
          {error && (
            <div
              role="alert"
              aria-live="assertive" 
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
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}