'use client';

import { useState } from 'react';
import { EditorNavbar } from '@/components/editor/editor-navbar';
import { ProjectSidebar } from '@/components/editor/project-sidebar';

export default function EditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Navbar */}
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onOpenChange={(open) => setIsSidebarOpen(open)}
        />

        {/* Editor Canvas */}
        <div className="flex-1 overflow-hidden">
          {/* Placeholder for the main editor canvas */}
          <div className="flex min-h-full flex-col items-center justify-center bg-muted/50">
            <h2 className="text-2xl font-bold text-foreground/80 mb-4">
              Ghost AI Editor
            </h2>
            <p className="text-muted-foreground max-w-xl text-center">
              Design your architecture here. Add nodes, connect them, and collaborate with your team in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}