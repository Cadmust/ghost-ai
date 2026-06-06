import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { get } from '@vercel/blob';
import prisma from '@/lib/prisma';
import { getProjectAccess } from '@/lib/project-access';

// GET — securely download a generated spec as a Markdown file.
//
// Flow: authenticate + verify project access, verify the spec belongs to that
// project, fetch the Markdown from Vercel Blob using ProjectSpec.filePath, and
// return it as a downloadable file. The blob URL is never exposed to the client
// — it is dereferenced server-side behind the access checks.
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ projectId: string; specId: string }> },
) {
  const { projectId, specId } = await context.params;

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

  const spec = await prisma.projectSpec.findUnique({
    where: { id: specId },
    select: { projectId: true, filePath: true, createdAt: true },
  });

  // Not found, or belongs to a different project — never leak another project's
  // spec to a member of this one.
  if (!spec || spec.projectId !== projectId) {
    return new NextResponse('Spec not found', { status: 404 });
  }

  try {
    const result = await get(spec.filePath, { access: 'private' });
    if (!result || result.statusCode !== 200) {
      return new NextResponse('Spec file not found', { status: 404 });
    }

    const markdown = await new Response(result.stream).text();
    const filename = `spec-${specId}.md`;

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[PROJECT_SPEC_DOWNLOAD]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
