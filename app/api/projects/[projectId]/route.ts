import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function PATCH(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  const { userId } = await auth()
  const { projectId } = await context.params

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    // Check ownership
    if (project.ownerId !== userId) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return NextResponse.json({ error: 'Invalid project name' }, { status: 400 })
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { name },
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('[PROJECT_ID_PATCH]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  const { userId } = await auth()
  const { projectId } = await context.params

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    // Check ownership
    if (project.ownerId !== userId) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    await prisma.project.delete({
      where: { id: projectId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[PROJECT_ID_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}