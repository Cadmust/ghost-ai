import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export interface ProjectAccess {
  userId: string;
  emails: string[];
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

  // Fetch user emails from Clerk. A user can have several addresses (e.g. a
  // personal primary plus a verified work address); a collaborator may have
  // been invited via any of them, so we normalize and check them all.
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const emails = user.emailAddresses
      .map((entry) => normalizeEmail(entry.emailAddress))
      .filter((email): email is string => email !== null);
    return { userId, emails };
  } catch {
    return { userId, emails: [] };
  }
}

export async function canAccessProject(projectId: string, userId: string, userEmails: string[]): Promise<boolean> {
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

    // Collaborator check across all of the user's verified emails
    const normalizedEmails = userEmails
      .map((email) => normalizeEmail(email))
      .filter((email): email is string => email !== null);

    if (normalizedEmails.length > 0) {
      const collaborator = await prisma.projectCollaborator.findFirst({
        where: { projectId, email: { in: normalizedEmails } },
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

    const hasAccess = await canAccessProject(projectId, identity.userId, identity.emails);

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