import { Suspense } from 'react';
import { EditorClient } from '@/components/editor/editor-client';
import { getProjectsForUser } from '@/lib/projects';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export const metadata = {
  title: 'Editor | Ghost AI',
};

async function EditorPageContent() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  try {
    const { owned, shared } = await getProjectsForUser();

    return (
      <EditorClient
        initialOwnedProjects={owned.map(p => ({
          id: p.id,
          name: p.name,
          ownerId: p.ownerId,
        }))}
        initialSharedProjects={shared.map(p => ({
          id: p.id,
          name: p.name,
          ownerId: p.ownerId,
        }))}
      />
    );
  } catch (error) {
    console.error('[EDITOR_PAGE]', error);
    throw error;
  }
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditorPageContent />
    </Suspense>
  );
}