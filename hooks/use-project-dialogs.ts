import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectDialogsState {
  isCreateOpen: boolean;
  isRenameOpen: boolean;
  isDeleteOpen: boolean;
  projectName: string;
  slug: string;
  loading: boolean;
  error: string | null;
  currentProjectId: string | null;
  currentProjectName: string | null;
}

interface UseProjectDialogsProps {
  onProjectsRefresh?: () => void;
}

export function useProjectDialogs({ onProjectsRefresh }: UseProjectDialogsProps = {}) {
  const router = useRouter();
  const [state, setState] = useState<ProjectDialogsState>({
    isCreateOpen: false,
    isRenameOpen: false,
    isDeleteOpen: false,
    projectName: '',
    slug: '',
    loading: false,
    error: null,
    currentProjectId: null,
    currentProjectName: null,
  });

  // Generate slug from project name
  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }, []);

  // Update slug when project name changes
  const updateSlug = useCallback((name: string) => {
    setState(prev => ({
      ...prev,
      projectName: name,
      slug: generateSlug(name),
    }));
  }, [generateSlug]);

  // Open create dialog
  const openCreateDialog = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCreateOpen: true,
      projectName: '',
      slug: '',
    }));
  }, []);

  // Close create dialog
  const closeCreateDialog = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCreateOpen: false,
    }));
  }, []);

  // Open rename dialog
  const openRenameDialog = useCallback((projectId: string, projectName: string) => {
    setState(prev => ({
      ...prev,
      isRenameOpen: true,
      currentProjectId: projectId,
      currentProjectName: projectName,
      projectName: projectName,
      slug: generateSlug(projectName),
    }));
  }, [generateSlug]);

  // Close rename dialog
  const closeRenameDialog = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRenameOpen: false,
      currentProjectId: null,
      currentProjectName: null,
    }));
  }, []);

  // Open delete dialog
  const openDeleteDialog = useCallback((projectId: string, projectName: string) => {
    setState(prev => ({
      ...prev,
      isDeleteOpen: true,
      currentProjectId: projectId,
      currentProjectName: projectName,
    }));
  }, []);

  // Close delete dialog
  const closeDeleteDialog = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDeleteOpen: false,
      currentProjectId: null,
      currentProjectName: null,
    }));
  }, []);

  // Create project - call POST /api/projects
  const handleCreateSubmit = useCallback(async () => {
    if (!state.projectName.trim()) {
      setState(prev => ({ ...prev, error: 'Project name is required' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: state.projectName }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const project = await response.json();
      
      // Reset dialog and refresh projects
      setState(prev => ({
        ...prev,
        isCreateOpen: false,
        projectName: '',
        slug: '',
        loading: false,
      }));

      // Refresh project list
      if (onProjectsRefresh) {
        onProjectsRefresh();
      }

      // Navigate to workspace
      router.push(`/editor/${project.id}`);
    } catch (error) {
      console.error('[CREATE_PROJECT]', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
      }));
    }
  }, [state.projectName, router, onProjectsRefresh]);

  // Rename project - call PATCH /api/projects/[id]
  const handleRenameSubmit = useCallback(async () => {
    if (!state.currentProjectId) {
      setState(prev => ({ ...prev, error: 'No project selected' }));
      return;
    }

    if (!state.projectName.trim()) {
      setState(prev => ({ ...prev, error: 'Project name is required' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(`/api/projects/${state.currentProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: state.projectName }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename project');
      }

      // Reset dialog and refresh projects
      setState(prev => ({
        ...prev,
        isRenameOpen: false,
        projectName: '',
        slug: '',
        currentProjectId: null,
        currentProjectName: null,
        loading: false,
      }));

      // Refresh project list
      if (onProjectsRefresh) {
        onProjectsRefresh();
      }
    } catch (error) {
      console.error('[RENAME_PROJECT]', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to rename project',
      }));
    }
  }, [state.currentProjectId, state.projectName, onProjectsRefresh]);

  // Delete project - call DELETE /api/projects/[id]
  const handleDeleteConfirm = useCallback(async () => {
    if (!state.currentProjectId) {
      setState(prev => ({ ...prev, error: 'No project selected' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(`/api/projects/${state.currentProjectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // Reset dialog state
      setState(prev => ({
        ...prev,
        isDeleteOpen: false,
        projectName: '',
        slug: '',
        currentProjectId: null,
        currentProjectName: null,
        loading: false,
      }));

      // Refresh project list
      if (onProjectsRefresh) {
        onProjectsRefresh();
      }
    } catch (error) {
      console.error('[DELETE_PROJECT]', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to delete project',
      }));
    }
  }, [state.currentProjectId, onProjectsRefresh]);

  return {
    // State
    isCreateOpen: state.isCreateOpen,
    isRenameOpen: state.isRenameOpen,
    isDeleteOpen: state.isDeleteOpen,
    projectName: state.projectName,
    slug: state.slug,
    loading: state.loading,
    error: state.error,
    currentProjectId: state.currentProjectId,
    currentProjectName: state.currentProjectName,

    // Actions
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
  };
}