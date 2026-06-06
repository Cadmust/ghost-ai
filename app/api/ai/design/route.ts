import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { tasks, auth as triggerAuth } from '@trigger.dev/sdk';
import prisma from '@/lib/prisma';
import { getCurrentIdentity, canAccessProject } from '@/lib/project-access';
import type { designAgentTask } from '@/trigger/design-agent';

interface DesignRequest {
  prompt: string;
  roomId: string;
  projectId: string;
}

function parseDesignRequest(value: unknown): DesignRequest | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const { prompt, roomId, projectId } = value as Record<string, unknown>;

  if (
    typeof prompt !== 'string' ||
    prompt.trim().length === 0 ||
    typeof roomId !== 'string' ||
    roomId.length === 0 ||
    typeof projectId !== 'string' ||
    projectId.length === 0
  ) {
    return null;
  }

  return { prompt: prompt.trim(), roomId, projectId };
}

// POST — trigger the design background task, record the run for ownership
// verification, and return the run ID to the client.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = parseDesignRequest(body);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid design request' }, { status: 400 });
  }

  const identity = await getCurrentIdentity();
  if (!identity) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const hasAccess = await canAccessProject(parsed.projectId, identity.userId, identity.email);
  if (!hasAccess) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const handle = await tasks.trigger<typeof designAgentTask>('design-agent', {
      projectId: parsed.projectId,
      roomId: parsed.roomId,
      prompt: parsed.prompt,
    });

    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: parsed.projectId,
        userId: identity.userId,
      },
    });

    // Mint a public token scoped to read just this run so the client can
    // subscribe via useRealtimeRun without a second round-trip. The caller is
    // already authenticated and owns the run (we just created it for them), so
    // returning the token here is safe. The standalone /token route stays as
    // the verified path for re-minting an expired token on an existing run.
    const publicToken = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          runs: [handle.id],
        },
      },
      expirationTime: '1h',
    });

    return NextResponse.json({ runId: handle.id, publicToken });
  } catch (error) {
    console.error('[AI_DESIGN_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
