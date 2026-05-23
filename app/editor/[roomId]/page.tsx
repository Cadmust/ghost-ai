import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getProjectAccess } from '@/lib/project-access';
import { getProjectsForUser } from '@/lib/projects';
import { AccessDenied } from '@/components/editor/access-denied';
import { WorkspaceClient } from '@/components/editor/workspace-client';

export const metadata = {
  title: 'Workspace | Ghost AI',
};

interface Props {
  params: Promise<{ roomId: string }>;
}

export default async function WorkspacePage({ params }: Props) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const { roomId } = await params;

  const access = await getProjectAccess(roomId);

  if (!access.allowed || !access.project) {
    return <AccessDenied />;
  }

  // Fetch projects for sidebar
  const { owned, shared } = await getProjectsForUser();

  const isOwner = access.project.ownerId === userId;

  return (
    <WorkspaceClient
      projectId={roomId}
      projectName={access.project.name}
      isOwner={isOwner}
      ownedProjects={owned.map((p) => ({
        id: p.id,
        name: p.name,
        ownerId: p.ownerId,
      }))}
      sharedProjects={shared.map((p) => ({
        id: p.id,
        name: p.name,
        ownerId: p.ownerId,
      }))}
    />
  );
}