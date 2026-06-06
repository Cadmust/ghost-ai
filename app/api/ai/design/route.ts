import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { tasks, auth as triggerAuth } from '@trigger.dev/sdk';
import prisma from '@/lib/prisma';
import { getCurrentIdentity, canAccessProject } from '@/lib/project-access';
import type { designAgentTask } from '@/trigger/design-agent';

interface DesignRequest {
  prompt: string;
  projectId: string;
  /** Optional client-generated id used to dedupe accidental double submits. */
  requestId?: string;
}

function parseDesignRequest(value: unknown): DesignRequest | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const { prompt, projectId, requestId } = value as Record<string, unknown>;

  if (
    typeof prompt !== 'string' ||
    prompt.trim().length === 0 ||
    typeof projectId !== 'string' ||
    projectId.length === 0
  ) {
    return null;
  }

  // Note: any client-supplied `roomId` is intentionally ignored. The Liveblocks
  // room is keyed by project id, so the room the agent acts on is derived from
  // the authorized projectId below — never from a separate, untrusted field.
  return {
    prompt: prompt.trim(),
    projectId,
    requestId:
      typeof requestId === 'string' && requestId.length > 0 ? requestId : undefined,
  };
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

  const hasAccess = await canAccessProject(parsed.projectId, identity.userId, identity.emails);
  if (!hasAccess) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // The Liveblocks room is keyed by project id, so derive the room the agent
  // acts on from the authorized project rather than any client-supplied value.
  const roomId = parsed.projectId;

  try {
    const handle = await tasks.trigger<typeof designAgentTask>(
      'design-agent',
      {
        projectId: parsed.projectId,
        roomId,
        prompt: parsed.prompt,
      },
      // A client-supplied requestId makes the trigger idempotent: a retried
      // submit returns the same run handle instead of enqueuing a duplicate.
      parsed.requestId ? { idempotencyKey: parsed.requestId } : undefined,
    );

    // Upsert (not create) so an idempotent retry — which yields the same
    // handle.id — converges on the existing row instead of failing the unique
    // constraint on runId and 500'ing the retry.
    await prisma.taskRun.upsert({
      where: { runId: handle.id },
      create: {
        runId: handle.id,
        projectId: parsed.projectId,
        userId: identity.userId,
      },
      update: {},
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
