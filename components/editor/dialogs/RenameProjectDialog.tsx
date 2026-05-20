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
}

export function RenameProjectDialog({
  isOpen,
  onOpenChange,
  currentProjectName,
  projectName,
  onProjectNameChange,
  onSubmit,
  loading,
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={onSubmit}
            disabled={loading || !projectName.trim()}
            className="w-full"
          >
            {loading ? "Renaming..." : "Rename Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}