import { useState, useCallback } from 'react';

interface ProjectDialogsState {
  isCreateOpen: boolean;
  isRenameOpen: boolean;
  isDeleteOpen: boolean;
  projectName: string;
  slug: string;
  loading: boolean;
  currentProjectId: string | null;
  currentProjectName: string | null;
}

export function useProjectDialogs() {
  const [state, setState] = useState<ProjectDialogsState>({
    isCreateOpen: false,
    isRenameOpen: false,
    isDeleteOpen: false,
    projectName: '',
    slug: '',
    loading: false,
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

  // Submit handlers (mock)
  const handleCreateSubmit = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setState(prev => ({
        ...prev,
        isCreateOpen: false,
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
    // In real app, we would reset form and maybe show success
  }, []);

  const handleRenameSubmit = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setState(prev => ({
      ...prev,
      loading: false,
      isRenameOpen: false,
    }));
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setState(prev => ({
      ...prev,
      loading: false,
      isDeleteOpen: false,
    }));
  }, []);

  return {
    // State
    isCreateOpen: state.isCreateOpen,
    isRenameOpen: state.isRenameOpen,
    isDeleteOpen: state.isDeleteOpen,
    projectName: state.projectName,
    slug: state.slug,
    loading: state.loading,
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