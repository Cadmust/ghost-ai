import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { tasks, auth as triggerAuth } from '@trigger.dev/sdk';
import prisma from '@/lib/prisma';
import { getCurrentIdentity, canAccessProject } from '@/lib/project-access';
import type { generateSpecTask } from '@/trigger/generate-spec';

interface ChatMessage {
  sender?: string;
  role?: string;
  content: string;
}

interface SpecRequest {
  roomId: string;
  chatHistory: ChatMessage[];
  nodes: unknown[];
  edges: unknown[];
}

function parseChatHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null,
    )
    .filter((item) => typeof item.content === 'string')
    .map((item) => ({
      sender: typeof item.sender === 'string' ? item.sender : undefined,
      role: typeof item.role === 'string' ? item.role : undefined,
      content: item.content as string,
    }));
}

function parseSpecRequest(value: unknown): SpecRequest | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const { roomId, chatHistory, nodes, edges } = value as Record<string, unknown>;

  if (typeof roomId !== 'string' || roomId.length === 0) {
    return null;
  }

  return {
    roomId,
    chatHistory: parseChatHistory(chatHistory),
    nodes: Array.isArray(nodes) ? nodes : [],
    edges: Array.isArray(edges) ? edges : [],
  };
}

// POST — trigger the spec generation background task, record the run for
// ownership verification, and return the run ID to the client.
//
// Project access is resolved from `roomId` (rooms are keyed by project id); a
// client-supplied `projectId` is never trusted.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = parseSpecRequest(body);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid spec request' }, { status: 400 });
  }

  const identity = await getCurrentIdentity();
  if (!identity) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // The room id is the project id; resolve and verify access from it rather
  // than trusting any client-supplied project id.
  const projectId = parsed.roomId;
  const hasAccess = await canAccessProject(projectId, identity.userId, identity.email);
  if (!hasAccess) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const handle = await tasks.trigger<typeof generateSpecTask>('generate-spec', {
      projectId,
      roomId: parsed.roomId,
      chatHistory: parsed.chatHistory,
      nodes: parsed.nodes,
      edges: parsed.edges,
    });

    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId,
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
    console.error('[AI_SPEC_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
