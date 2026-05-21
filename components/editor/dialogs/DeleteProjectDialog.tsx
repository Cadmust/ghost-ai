import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentProjectName: string | null;
  onConfirm: () => void;
  loading: boolean;
  error?: string | null;
}

export function DeleteProjectDialog({
  isOpen,
  onOpenChange,
  currentProjectName,
  onConfirm,
  loading,
  error,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{currentProjectName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div 
            role="alert"
            ria-live="assertive"
            style={{ color: 'var(--text-error, #ff4444)' }}
            className="text-sm p-2 rounded bg-red-900/20"
          >
            {error}
          </div>
        )}
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
              variant="destructive"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              {loading ? "Deleting..." : "Delete Project"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}