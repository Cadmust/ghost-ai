import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth, clerkClient } from '@clerk/nextjs/server';

// GET /api/projects/[projectId]/collaborators
// Returns the list of collaborators enriched with Clerk user data (name, avatar)
export async function GET(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  const { userId } = await auth();
  const { projectId } = await context.params;

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Check access: owner or collaborator
    const isOwner = project.ownerId === userId;
    let isCollaborator = false;

    if (!isOwner) {
      const client = await clerkClient();
      const currentUser = await client.users.getUser(userId);
      const email = currentUser.emailAddresses[0]?.emailAddress;

      if (email) {
        const collab = await prisma.projectCollaborator.findUnique({
          where: { projectId_email: { projectId, email } },
          select: { id: true },
        });
        isCollaborator = !!collab;
      }
    }

    if (!isOwner && !isCollaborator) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Fetch raw collaborators from DB
    const collaborators = await prisma.projectCollaborator.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    // Enrich with Clerk user data
    const client = await clerkClient();
    const enriched = await Promise.all(
      collaborators.map(async (collab) => {
        try {
          // Look up Clerk users by email
          const users = await client.users.getUserList({
            emailAddress: [collab.email],
            limit: 1,
          });

          if (users.data.length > 0) {
            const clerkUser = users.data[0];
            return {
              id: collab.id,
              email: collab.email,
              name: clerkUser.firstName && clerkUser.lastName
                ? `${clerkUser.firstName} ${clerkUser.lastName}`
                : clerkUser.firstName || clerkUser.username || null,
              avatarUrl: clerkUser.imageUrl,
              createdAt: collab.createdAt.toISOString(),
            };
          }
        } catch {
          // Clerk lookup failed, fall through to email-only
        }

        // Fallback: email only
        return {
          id: collab.id,
          email: collab.email,
          name: null,
          avatarUrl: null,
          createdAt: collab.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      collaborators: enriched,
      isOwner,
    });
  } catch (error) {
    console.error('[COLLABORATORS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/projects/[projectId]/collaborators
// Invite a collaborator by email (owner only)
export async function POST(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  const { userId } = await auth();
  const { projectId } = await context.params;

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Enforce ownership
    if (project.ownerId !== userId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Check if already a collaborator
    const existing = await prisma.projectCollaborator.findUnique({
      where: { projectId_email: { projectId, email } },
    });

    if (existing) {
      return NextResponse.json({ error: 'User is already a collaborator' }, { status: 409 });
    }

    // Check if the owner is trying to add themselves
    const client = await clerkClient();
    const currentUser = await client.users.getUser(userId);
    const ownerEmail = currentUser.emailAddresses[0]?.emailAddress;

    if (ownerEmail && ownerEmail.toLowerCase() === email) {
      return NextResponse.json({ error: 'You are the project owner' }, { status: 400 });
    }

    const collaborator = await prisma.projectCollaborator.create({
      data: { projectId, email },
    });

    return NextResponse.json({ id: collaborator.id, email: collaborator.email }, { status: 201 });
  } catch (error) {
    console.error('[COLLABORATORS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// DELETE /api/projects/[projectId]/collaborators?email=xxx
// Remove a collaborator by email (owner only)
export async function DELETE(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  const { userId } = await auth();
  const { projectId } = await context.params;

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Enforce ownership
    if (project.ownerId !== userId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase() ?? '';

    if (!email) {
      return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 });
    }

    const existing = await prisma.projectCollaborator.findUnique({
      where: { projectId_email: { projectId, email } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 });
    }

    await prisma.projectCollaborator.delete({
      where: { id: existing.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[COLLABORATORS_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}