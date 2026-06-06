import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { normalizeEmail, getProjectAccess } from '@/lib/project-access';

// Never cache this route — the collaborator list changes on invite/remove and
// must reflect the DB on every request (including after client-side navigation
// back to a project). Without this, a cached 200 can show a stale/empty list.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/projects/[projectId]/collaborators
// Returns the list of collaborators enriched with Clerk user data (name, avatar)
export async function GET(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  const { userId } = await auth();
  const { projectId } = await context.params;

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Owner-or-collaborator access check, normalized + Clerk-failure tolerant.
    // Owner is resolved by userId (no Clerk call), so an owner's list never
    // disappears just because a Clerk lookup hiccups on a cold dev-server start.
    const access = await getProjectAccess(projectId);

    if (access.reason === 'not_found') {
      return new NextResponse('Project not found', { status: 404 });
    }
    if (!access.allowed || !access.project) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const isOwner = access.project.ownerId === userId;

    // Fetch raw collaborators from DB
    const collaborators = await prisma.projectCollaborator.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    // Batch-enrich with Clerk user data (single API call)
    const clerkUserMap = new Map<string, { name: string | null; avatarUrl: string | null }>();
    try {
      const client = await clerkClient();
      const emails = collaborators.map((c) => c.email).filter(Boolean);
      if (emails.length > 0) {
        const users = await client.users.getUserList({
          emailAddress: emails,
          limit: emails.length,
        });

        for (const clerkUser of users.data) {
          const data = {
            name: clerkUser.firstName && clerkUser.lastName
              ? `${clerkUser.firstName} ${clerkUser.lastName}`
              : clerkUser.firstName || clerkUser.username || null,
            avatarUrl: clerkUser.imageUrl,
          };
          // Key by every normalized address on the user. The collaborator was
          // stored lowercased and may match a non-primary Clerk address, so
          // keying only by emailAddresses[0] (raw casing) would drop the match.
          for (const addr of clerkUser.emailAddresses) {
            const key = normalizeEmail(addr.emailAddress);
            if (key) {
              clerkUserMap.set(key, data);
            }
          }
        }
      }
    } catch {
      // Clerk lookup failed — all collaborators fall back to email-only below
    }

    const enriched = collaborators.map((collab) => {
      const clerkData = clerkUserMap.get(collab.email);
      return {
        id: collab.id,
        email: collab.email,
        name: clerkData?.name ?? null,
        avatarUrl: clerkData?.avatarUrl ?? null,
        createdAt: collab.createdAt.toISOString(),
      };
    });

    return NextResponse.json(
      {
        collaborators: enriched,
        isOwner,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (error) {
    console.error('[COLLABORATORS_GET]', error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal Error', detail }, { status: 500 });
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
    const email = normalizeEmail(typeof body?.email === 'string' ? body.email : '') ?? '';

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
    const ownerEmail = normalizeEmail(currentUser.emailAddresses[0]?.emailAddress);

    if (ownerEmail && ownerEmail === email) {
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
    const email = normalizeEmail(searchParams.get('email')) ?? '';

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