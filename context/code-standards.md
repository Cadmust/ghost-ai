# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes, do not layer workarounds.
- Do not mix unrelated concerns in one component or route.

## TypeScript

- Strict mode is required throughout the project.
- Avoid any — use explicit interfaces or narrowly scoped types.
- Validate unknown external input at system boundaries before trusting it.
- Use interface for object contracts.

## Next.js

- Default to server components.
- Add use client only when browser interactivity requires it
- Keep route handlers focused on a single responsibility.
- Long-running work belongs in background tasks, not in request handlers.

## Styling

- Use CSS custom property tokens defined in globals.css — no hardcoded hex values
- Reference tokens through their Tailwind utility names: bg-base, text-copy-primary, border-surface-border, text-brand, etc.
- Maintain the border radius scale: rounded-xl for small elements, rounded-2xl for cards, rounded-3xl for modals.
- Follow the border radius scale defined in ui-context.md

## API Routes

- Validate and parse request input before any logic runs
- Enforce auth and ownership before any mutation
- Return consistent, predictable response shapes
- Keep route handlers thin - push complexity in to shared modules or background tasks.

## Data and Storage

- Metadata belongs in the database
- Large generated content belongs in file or blob storage
- Do not store large content directly in the database.
- Task run records are first-class relation data - treat ownership and run IDs as verified before any token issuance.

## File Organization

- `lib/` — shared infrastructure: Prisma client, auth helpers, utilities.
- `trigger/` — all durable background tasks and AI workflows.
- `components/` — UI composition only: no business logic.
- `app/api/` — route handlers for auth, triggering, and persistence.
- Name files after the responsibility they contain, not the technology.
