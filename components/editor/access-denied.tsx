import Link from 'next/link';
import { Lock } from 'lucide-react';

export function AccessDenied() {
  return (
    <div
      style={{ backgroundColor: 'var(--bg-base)' }}
      className="flex min-h-screen flex-col items-center justify-center p-8"
    >
      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
        className="flex flex-col items-center gap-6 rounded-2xl border p-12 max-w-md text-center"
      >
        <div
          style={{
            backgroundColor: 'var(--accent-primary-dim)',
            color: 'var(--accent-primary)',
          }}
          className="flex h-16 w-16 items-center justify-center rounded-full"
        >
          <Lock className="h-8 w-8" />
        </div>
        <h1
          style={{ color: 'var(--text-primary)' }}
          className="text-2xl font-bold"
        >
          Access Denied
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          This project either doesn&apos;t exist or you don&apos;t have
          permission to access it.
        </p>
        <Link
          href="/editor"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--bg-base)',
          }}
          className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Back to Editor
        </Link>
      </div>
    </div>
  );
}