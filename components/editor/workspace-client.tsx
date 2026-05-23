'use client';

import { useState } from 'react';
import { WorkspaceNavbar } from '@/components/editor/workspace-navbar';
import { ProjectSidebar, type Project } from '@/components/editor/project-sidebar';
import { ShareDialog } from '@/components/editor/share-dialog';

interface WorkspaceClientProps {
  projectId: string;
  projectName: string;
  isOwner: boolean;
  ownedProjects: Project[];
  sharedProjects: Project[];
}

export function WorkspaceClient({
  projectId,
  projectName,
  isOwner,
  ownedProjects,
  sharedProjects,
}: WorkspaceClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  return (
    <div
      style={{ backgroundColor: 'var(--bg-base)' }}
      className="h-screen flex flex-col overflow-hidden"
    >
      {/* Navbar */}
      <WorkspaceNavbar
        projectName={projectName}
        isSidebarOpen={isSidebarOpen}
        isAiSidebarOpen={isAiSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onAiSidebarToggle={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
        onShare={() => setIsShareDialogOpen(true)}
      />

      {/* Main workspace area */}
      <div className="flex flex-1 pt-14 overflow-hidden">
        {/* Left Sidebar */}
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onOpenChange={(open) => setIsSidebarOpen(open)}
          onCreate={() => {
            // Placeholder — create from workspace will be implemented later
          }}
          onRename={(id, name) => {
            // Placeholder — rename from workspace will be implemented later
          }}
          onDelete={(id, name) => {
            // Placeholder — delete from workspace will be implemented later
          }}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          currentRoomId={projectId}
        />

        {/* Center Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div
            style={{ backgroundColor: 'var(--bg-surface)' }}
            className="flex-1 flex items-center justify-center m-3 rounded-2xl"
          >
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
              <div
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
                className="flex items-center justify-center h-16 w-16 rounded-2xl border"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <h2
                style={{ color: 'var(--text-primary)' }}
                className="text-xl font-semibold"
              >
                Canvas
              </h2>
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                The interactive canvas will appear here. Add nodes, connect them,
                and collaborate with your team in real time.
              </p>
            </div>
          </div>
        </main>

        {/* Right AI Sidebar */}
        {isAiSidebarOpen && (
          <aside
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderLeftColor: 'var(--border-subtle)',
            }}
            className="w-72 shrink-0 border-l overflow-y-auto"
          >
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <p style={{ color: 'var(--text-muted)' }} className="text-sm">
                AI chat will appear here
              </p>
            </div>
          </aside>
        )}
      </div>

      {/* Share Dialog */}
      <ShareDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        projectId={projectId}
        isOwner={isOwner}
      />
    </div>
  );
}