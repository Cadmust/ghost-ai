import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";

interface Project {
  id: string;
  name: string;
  owned: boolean;
}

interface ProjectSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: () => void;
  onRename: (projectId: string, projectName: string) => void;
  onDelete: (projectId: string, projectName: string) => void;
}

export function ProjectSidebar({
  isOpen,
  onOpenChange,
  onCreate,
  onRename,
  onDelete
}: ProjectSidebarProps) {
  // Mock project data
  const myProjects: Project[] = [
    { id: '1', name: 'Website Redesign', owned: true },
    { id: '2', name: 'Mobile App', owned: true },
    { id: '3', name: 'API Documentation', owned: true }
  ];

  const sharedProjects: Project[] = [
    { id: '4', name: 'Team Project', owned: false },
    { id: '5', name: 'Open Source Initiative', owned: false }
  ];

  return (
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
      direction="left"
    >
      <DrawerContent 
        style={{
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          borderRightColor: 'var(--border-subtle)',
        }}
        className="z-50 w-64 border-r"
      >
        <DrawerHeader 
          style={{ borderBottomColor: 'var(--border-subtle)' }}
          className="flex flex-row justify-between items-center border-b"
        >
          <DrawerTitle style={{ color: 'var(--text-primary)' }}>Projects</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close sidebar">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <Tabs defaultValue="my-projects" className="w-full">
          <TabsList 
            style={{ backgroundColor: 'var(--bg-base)' }}
            className="w-full grid grid-cols-2"
          >
            <TabsTrigger 
              value="my-projects" 
              className="w-full"
              style={{
                color: 'var(--text-secondary)',
              }}
            >
              My Projects
            </TabsTrigger>
            <TabsTrigger 
              value="shared" 
              className="w-full"
              style={{ color: 'var(--text-secondary)' }}
            >
              Shared
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects" className="p-4">
            {myProjects.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }} className="text-center py-8">
                No projects yet
              </div>
            ) : (
              <div className="space-y-2">
                {myProjects.map((project) => (
                  <div 
                    key={project.id} 
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                    className="flex items-center justify-between p-3 rounded border hover:border-accent-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        style={{
                          backgroundColor: 'var(--accent-primary-dim)',
                          color: 'var(--accent-primary)',
                        }}
                        className="h-8 w-8 flex items-center justify-center rounded"
                      >
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">
                          {project.name}
                        </p>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                          Owned
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRename(project.id, project.name)}
                        style={{ color: 'var(--text-muted)' }}
                        className="p-1 rounded hover:bg-subtle transition-colors"
                        aria-label="Rename project"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(project.id, project.name)}
                        className="p-1 rounded hover:bg-subtle transition-colors"
                        aria-label="Delete project"
                      >
                        <Trash2 
                          className="h-4 w-4"
                          style={{ color: 'var(--text-muted)' }}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shared" className="p-4">
            {sharedProjects.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }} className="text-center py-8">
                No shared projects
              </div>
            ) : (
              <div className="space-y-2">
                {sharedProjects.map((project) => (
                  <div 
                    key={project.id} 
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                    className="flex items-center p-3 rounded border hover:border-accent-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        style={{
                          backgroundColor: 'var(--accent-primary-dim)',
                          color: 'var(--text-muted)',
                        }}
                        className="h-8 w-8 flex items-center justify-center rounded"
                      >
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">
                          {project.name}
                        </p>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                          Shared
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DrawerFooter 
          style={{ borderTopColor: 'var(--border-subtle)' }}
          className="px-4 pb-4 border-t"
        >
          <Button
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--bg-base)',
              borderColor: 'var(--accent-primary)',
            }}
            className="w-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            onClick={onCreate}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}