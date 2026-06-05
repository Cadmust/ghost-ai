import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { put, get } from '@vercel/blob';
import prisma from '@/lib/prisma';
import { getProjectAccess } from '@/lib/project-access';

interface CanvasPayload {
  nodes: unknown[];
  edges: unknown[];
}

function isCanvasPayload(value: unknown): value is CanvasPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as CanvasPayload).nodes) &&
    Array.isArray((value as CanvasPayload).edges)
  );
}

// PUT — persist the latest canvas JSON to Vercel Blob and store the blob URL
// on the project record. Prisma keeps only the reference (metadata).
export async function PUT(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;

  const access = await getProjectAccess(projectId);
  if (!access.allowed) {
    if (access.reason === 'unauthenticated') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (access.reason === 'not_found') {
      return new NextResponse('Project not found', { status: 404 });
    }
    return new NextResponse('Forbidden', { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isCanvasPayload(body)) {
    return NextResponse.json({ error: 'Invalid canvas payload' }, { status: 400 });
  }

  try {
    const blob = await put(`canvas/${projectId}.json`, JSON.stringify(body), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('[PROJECT_CANVAS_PUT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// GET — read the saved blob URL from Prisma and return the canvas JSON fetched
// from Vercel Blob, so the editor can hydrate an empty room.
export async function GET(_request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;

  const access = await getProjectAccess(projectId);
  if (!access.allowed) {
    if (access.reason === 'unauthenticated') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (access.reason === 'not_found') {
      return new NextResponse('Project not found', { status: 404 });
    }
    return new NextResponse('Forbidden', { status: 403 });
  }

  const blobUrl = access.project?.canvasJsonPath;
  if (!blobUrl) {
    return NextResponse.json({ nodes: [], edges: [] });
  }

  try {
    const result = await get(blobUrl, { access: 'private' });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ nodes: [], edges: [] });
    }

    const canvas: unknown = await new Response(result.stream).json();
    if (!isCanvasPayload(canvas)) {
      return NextResponse.json({ nodes: [], edges: [] });
    }

    return NextResponse.json({ nodes: canvas.nodes, edges: canvas.edges });
  } catch (error) {
    console.error('[PROJECT_CANVAS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
