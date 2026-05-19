import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";

interface ProjectSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectSidebar({ isOpen, onOpenChange }: ProjectSidebarProps) {
  return (
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
      direction="left"
    >
      <DrawerContent className="z-50 w-64">
        <DrawerHeader className="flex flex-row justify-between items-center">
          <DrawerTitle>Projects</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close sidebar">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <Tabs defaultValue="my-projects" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="my-projects" className="w-full">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="w-full">
              Shared
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects" className="p-4">
            {/* Placeholder for My Projects tab */}
            <div className="text-muted-foreground text-center py-8">
              No projects yet
            </div>
          </TabsContent>

          <TabsContent value="shared" className="p-4">
            {/* Placeholder for Shared tab */}
            <div className="text-muted-foreground text-center py-8">
              No shared projects
            </div>
          </TabsContent>
        </Tabs>

        <DrawerFooter className="px-4 pb-4">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}