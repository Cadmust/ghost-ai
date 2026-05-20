'use client';

import { useState } from 'react';
import { EditorNavbar } from '@/components/editor/editor-navbar';
import { ProjectSidebar } from '@/components/editor/project-sidebar';
import { useProjectDialogs } from '@/hooks/use-project-dialogs';
import { CreateProjectDialog } from '@/components/editor/dialogs/CreateProjectDialog';
import { RenameProjectDialog } from '@/components/editor/dialogs/RenameProjectDialog';
import { DeleteProjectDialog } from '@/components/editor/dialogs/DeleteProjectDialog';
import { Plus } from 'lucide-react';

export default function EditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {
    isCreateOpen,
    isRenameOpen,
    isDeleteOpen,
    projectName,
    slug,
    loading,
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
  } = useProjectDialogs();

  return (
    <div 
      style={{ backgroundColor: 'var(--bg-base)' }}
      className="min-h-screen"
    >
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
          onCreate={openCreateDialog}
          onRename={(projectId) => openRenameDialog(projectId, currentProjectName || '')}
          onDelete={(projectId) => openDeleteDialog(projectId, currentProjectName || '')}
        />

        {/* Editor Canvas */}
        <div className="flex-1 overflow-hidden">
          {/* Editor Home */}
          {!isCreateOpen && !isRenameOpen && !isDeleteOpen && (
            <div 
              style={{
                backgroundColor: 'var(--bg-base)',
              }}
              className="flex min-h-full flex-col items-center justify-center p-8"
            >
              <h1 
                style={{ color: 'var(--text-primary)' }}
                className="text-3xl font-bold mb-4"
              >
                Create a project or open an existing one
              </h1>
              <p 
                style={{ color: 'var(--text-secondary)' }}
                className="max-w-xl text-center mb-6"
              >
                Start a new architecture workspace, or choose a project from the sidebar.
              </p>
              <button
                onClick={openCreateDialog}
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--bg-base)',
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            </div>
          )}

          {/* Placeholder for the main editor canvas when dialogs are open or projects exist */}
          {(isCreateOpen || isRenameOpen || isDeleteOpen) && (
            <div 
              style={{
                backgroundColor: 'var(--bg-elevated)',
              }}
              className="flex min-h-full flex-col items-center justify-center"
            >
              <h2 
                style={{ color: 'var(--text-primary)' }}
                className="text-2xl font-bold mb-4"
              >
                Ghost AI Editor
              </h2>
              <p 
                style={{ color: 'var(--text-secondary)' }}
                className="max-w-xl text-center"
              >
                Design your architecture here. Add nodes, connect them, and collaborate with your team in real-time.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateProjectDialog
        isOpen={isCreateOpen}
        onOpenChange={closeCreateDialog}
        projectName={projectName}
        slug={slug}
        onProjectNameChange={updateSlug}
        onSubmit={handleCreateSubmit}
        loading={loading}
      />
      <RenameProjectDialog
        isOpen={isRenameOpen}
        onOpenChange={closeRenameDialog}
        currentProjectName={currentProjectName}
        projectName={projectName}
        onProjectNameChange={updateSlug}
        onSubmit={handleRenameSubmit}
        loading={loading}
      />
      <DeleteProjectDialog
        isOpen={isDeleteOpen}
        onOpenChange={closeDeleteDialog}
        currentProjectName={currentProjectName}
        onConfirm={handleDeleteConfirm}
        loading={loading}
      />
    </div>
  );
}