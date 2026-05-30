'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceNavbar } from '@/components/editor/workspace-navbar';
import { ProjectSidebar, type Project } from '@/components/editor/project-sidebar';
import { ShareDialog } from '@/components/editor/share-dialog';
import { useProjectDialogs } from '@/hooks/use-project-dialogs';
import { CreateProjectDialog } from '@/components/editor/dialogs/CreateProjectDialog';
import { RenameProjectDialog } from '@/components/editor/dialogs/RenameProjectDialog';
import { DeleteProjectDialog } from '@/components/editor/dialogs/DeleteProjectDialog';
import { CanvasEditor } from '@/components/editor/canvas-editor';

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
  const router = useRouter();
  const pendingDeleteRef = useRef<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const {
    isCreateOpen,
    isRenameOpen,
    isDeleteOpen,
    projectName: dialogProjectName,
    slug,
    loading,
    error,
    currentProjectId,
    currentProjectName,
    openCreateDialog,
    closeCreateDialog,
    openRenameDialog,
    closeRenameDialog,
    openDeleteDialog,
    closeDeleteDialog,
    updateSlug,
    handleCreateSubmit,
    handleRenameSubmit,
    handleDeleteConfirm,
  } = useProjectDialogs({
    onProjectsRefresh: useCallback(async () => {
      if (pendingDeleteRef.current === projectId) {
        pendingDeleteRef.current = null;
        router.push('/editor');
        return;
      }
      router.refresh();
    }, [projectId, router]),
  });

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
        onTemplates={() => setShowTemplates(true)}
      />

      {/* Main workspace area */}
      <div className="flex flex-1 pt-14 overflow-hidden">
        {/* Left Sidebar */}
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onOpenChange={(open) => setIsSidebarOpen(open)}
          onCreate={openCreateDialog}
          onRename={(id, name) => openRenameDialog(id, name)}
          onDelete={(id, name) => {
            pendingDeleteRef.current = id;
            openDeleteDialog(id, name);
          }}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          currentRoomId={projectId}
        />

        {/* Center Canvas — fills available space, no card styling */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <CanvasEditor roomId={projectId} showTemplates={showTemplates} onTemplatesOpenChange={setShowTemplates} />
        </main>

        {/* Right AI Sidebar — fixed overlay, not inline flow */}
        {isAiSidebarOpen && (
          <aside
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderLeftColor: 'var(--border-subtle)',
            }}
            className="fixed right-0 top-14 bottom-0 w-72 z-40 border-l overflow-y-auto shadow-lg"
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

      {/* Project Dialogs */}
      <CreateProjectDialog
        isOpen={isCreateOpen}
        onOpenChange={closeCreateDialog}
        projectName={dialogProjectName}
        slug={slug}
        onProjectNameChange={updateSlug}
        onSubmit={handleCreateSubmit}
        loading={loading}
        error={error}
      />
      <RenameProjectDialog
        isOpen={isRenameOpen}
        onOpenChange={closeRenameDialog}
        currentProjectName={currentProjectName}
        projectName={dialogProjectName}
        onProjectNameChange={updateSlug}
        onSubmit={handleRenameSubmit}
        loading={loading}
        error={error}
      />
      <DeleteProjectDialog
        isOpen={isDeleteOpen}
        onOpenChange={closeDeleteDialog}
        currentProjectName={currentProjectName}
        onConfirm={handleDeleteConfirm}
        loading={loading}
        error={error}
      />
    </div>
  );
}