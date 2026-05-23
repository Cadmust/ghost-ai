import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('[PROJECTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await request.json().catch(() => null)
    const rawName = typeof body?.name === 'string' ? body.name.trim() : ''
    if (body?.name !== undefined && rawName.length === 0) {
      return NextResponse.json({ error: 'Invalid project name' }, { status: 400 })
    }
    const name = rawName || 'Untitled Project'

    const project = await prisma.project.create({
      data: {
        ownerId: userId,
        name,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('[PROJECTS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}