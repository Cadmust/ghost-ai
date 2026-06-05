import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth as triggerAuth } from '@trigger.dev/sdk';
import prisma from '@/lib/prisma';
import { getCurrentIdentity } from '@/lib/project-access';

function parseRunId(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const { runId } = value as Record<string, unknown>;
  return typeof runId === 'string' && runId.length > 0 ? runId : null;
}

// POST — verify the caller owns the recorded run, then mint a Trigger.dev
// public token scoped to read that single run so the client can subscribe.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const runId = parseRunId(body);
  if (!runId) {
    return NextResponse.json({ error: 'Invalid run ID' }, { status: 400 });
  }

  const identity = await getCurrentIdentity();
  if (!identity) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const taskRun = await prisma.taskRun.findUnique({
      where: { runId },
      select: { userId: true },
    });

    if (!taskRun) {
      return new NextResponse('Run not found', { status: 404 });
    }

    if (taskRun.userId !== identity.userId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const token = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          runs: [runId],
        },
      },
      expirationTime: '1h',
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('[AI_DESIGN_TOKEN_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
