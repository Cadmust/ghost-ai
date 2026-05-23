import { auth, clerkClient } from '@clerk/nextjs/server';
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

    // Get user email from Clerk to find shared projects
    let sharedProjects: ProjectWithCollaborators[] = [];
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const email = user.emailAddresses[0]?.emailAddress;

      if (email) {
        const collaborators = await prisma.projectCollaborator.findMany({
          where: { email },
          include: { project: true },
          orderBy: { createdAt: 'desc' },
        });

        sharedProjects = collaborators.map((c) => c.project);
      }
    } catch {
      // If Clerk API fails, shared projects will be empty
    }

    return {
      owned: ownedProjects,
      shared: sharedProjects,
    };
  } catch (error) {
    console.error('[GET_PROJECTS_FOR_USER]', error);
    throw error;
  }
}