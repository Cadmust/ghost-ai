import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export interface ProjectAccess {
  userId: string;
  email: string | null;
}

/**
 * Collaborator emails are stored lowercased (see the collaborators POST route),
 * so every access lookup must normalize the same way. Clerk can return an
 * address with different casing than the user typed when inviting, and a
 * case-sensitive `findUnique` on `projectId_email` would otherwise miss —
 * silently denying access and hiding the collaborator from lists.
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

export async function getCurrentIdentity(): Promise<ProjectAccess | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Fetch user email from Clerk
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = normalizeEmail(user.emailAddresses[0]?.emailAddress);
    return { userId, email };
  } catch {
    return { userId, email: null };
  }
}

export async function canAccessProject(projectId: string, userId: string, userEmail: string | null): Promise<boolean> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return false;
    }

    // Owner always has access
    if (project.ownerId === userId) {
      return true;
    }

    // Collaborator check by email
    const normalizedEmail = normalizeEmail(userEmail);
    if (normalizedEmail) {
      const collaborator = await prisma.projectCollaborator.findUnique({
        where: {
          projectId_email: { projectId, email: normalizedEmail },
        },
        select: { id: true },
      });

      if (collaborator) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('[PROJECT_ACCESS]', error);
    return false;
  }
}

export async function getProjectAccess(projectId: string) {
  const identity = await getCurrentIdentity();

  if (!identity) {
    return { allowed: false, reason: 'unauthenticated' as const, project: null };
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return { allowed: false, reason: 'not_found' as const, project: null };
    }

    const hasAccess = await canAccessProject(projectId, identity.userId, identity.email);

    if (!hasAccess) {
      return { allowed: false, reason: 'unauthorized' as const, project: null };
    }

    return { allowed: true, reason: null, project };
  } catch (error) {
    console.error('[GET_PROJECT_ACCESS]', error);
    return { allowed: false, reason: 'not_found' as const, project: null };
  }
}

export async function isProjectOwner(projectId: string, userId: string): Promise<boolean> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    return project?.ownerId === userId;
  } catch {
    return false;
  }
}