import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getCurrentIdentity, canAccessProject } from '@/lib/project-access';
import { userIdToColor } from '@/lib/color-helper';
import liveblocks from '@/lib/liveblocks';

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const projectId = typeof body?.projectId === 'string'
      ? body.projectId.trim()
      : typeof body?.room === 'string'
        ? body.room.trim()
        : '';

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Verify project access
    const identity = await getCurrentIdentity();
    if (!identity) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const hasAccess = await canAccessProject(projectId, identity.userId, identity.email);
    if (!hasAccess) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Fetch user display info from Clerk
    let displayName = 'Anonymous';
    let avatarUrl = '';

    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      displayName =
        clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.firstName || clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress || 'Anonymous';
      avatarUrl = clerkUser.imageUrl;
    } catch {
      // Fall through with defaults
    }

    const cursorColor = userIdToColor(userId);

    // Ensure the Liveblocks room exists (idempotent)
    await liveblocks.getOrCreateRoom(projectId, {
      defaultAccesses: [],
      usersAccesses: {
        [userId]: ['room:write'],
      },
    });

    // Issue an ID token
    const { status, body: liveblocksBody } = await liveblocks.identifyUser(
      {
        userId,
        groupIds: [],
      },
      {
        userInfo: {
          name: displayName,
          avatar: avatarUrl,
          color: cursorColor,
        },
      },
    );

    return new Response(liveblocksBody, { status });
  } catch (error) {
    console.error('[LIVEBLOCKS_AUTH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}