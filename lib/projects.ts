import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export interface ProjectWithCollaborators {
  id: string;
  name: string;
  description: string | null;
  status: string;
  canvasJsonPath: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
}

export async function getProjectsForUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    // Get owned projects
    const ownedProjects = await prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    // Get shared projects (where user is a collaborator)
    // TODO: Fetch user email from Clerk to query collaborators
    // For now, return empty array
    const sharedProjects: ProjectWithCollaborators[] = [];

    return {
      owned: ownedProjects,
      shared: sharedProjects,
    };
  } catch (error) {
    console.error('[GET_PROJECTS_FOR_USER]', error);
    throw error;
  }
}
