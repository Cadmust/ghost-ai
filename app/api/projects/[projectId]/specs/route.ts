import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getProjectAccess } from '@/lib/project-access';

// GET — list the generated specs for a project (metadata only).
//
// Returns the ProjectSpec records for the project, newest first, as
// { id, createdAt, filename }. Access is verified the same way as the download
// route (authenticate + project membership); the Blob URL (filePath) is never
// exposed — clients fetch content through the secure download route instead.
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
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

  try {
    const specs = await prisma.projectSpec.findMany({
      where: { projectId },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    // ProjectSpec stores only a blob reference, not an original filename, so
    // derive a stable, human-readable name matching the download route's
    // `spec-{specId}.md` convention.
    const items = specs.map((spec) => ({
      id: spec.id,
      createdAt: spec.createdAt.toISOString(),
      filename: `spec-${spec.id}.md`,
    }));

    return NextResponse.json({ specs: items });
  } catch (error) {
    console.error('[PROJECT_SPECS_LIST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
