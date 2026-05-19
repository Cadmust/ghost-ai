# Architecture Context

## Stack

| Layer     | Technology                  | Role   |
| --------- | --------------------------- | ------ |
| Framework | Next.js + TypeScript        | Full-stack app with server/client boundaries |
| UI        | Tailwind + shadcn/ui        | Component composition and styling |
| Auth      | Clerk                       | User identity and route protection |
| Database  | Prisma + PostgreSQL  | Relational metadata: projects, collaborators, specs, task runs |
| Canvas   | Liveblock + React Flow       | Real-time collaborative canvas, presence, and cursors |
| Background tasks   |  Trigger.dev       | Durable AI generation workflows |
| Artifact   | Vercel Blob                | Canvas snapshots and generated Markdown specs |

## System Boundaries

- `app/api` — Authenticated request handlers: input validation, ownership checks, task triggering, and persistence.
- `trigger` — Long-running background jobs: AI design generation and spec generation.
- `lib` — Shared infrastructure: Prisma client, access control helpers, and utilities.
- `components` — UI composition: canvas surfaces, sidebars, dialogs, and interactive elements.
- `prisma` — Database schema and generated client output.
- `data` — Legacy local directory. Not used for new artifacts.

## Storage Model

- **Database**: metadata, ownership, relationships and task run records.
- **Blob/File Storage**: generated files, media, large artifacts.
- Project records, spec records, and task run records belong in PostgreSQL.
- Canvas content and Markdown output are stored in and retrieved from Vercel Blob.
- The blob URL is stored in the database (canvasJsonPath, filePath) as the reference to the artifact.

## Auth and Access Model

- Every user signs in via Clerk
- Every project has a single owner
- Only authenticated users can access protected routers.
- Only the owner or a collaborator can mutate project resources
- Liveblocks room tokens are issued only after verifying project membership.

## Invariants

1. Request handlers do not run long-lived AI work - that belongs in background tasks.
2. Metadata and large generated artifacts are stored in separate layers.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema must remain consistent between user-created content and imported templates.


