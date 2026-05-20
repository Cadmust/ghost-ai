# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase
- Feature implementation complete: '/editor' home screen and project dialogs/sidebar actions

## Current Goal
- Implement feature specified in 05-prisma.md

## Completed
- Install shadcn UI dependencies (clsx, tailwind-merge)
- Create lib/utils.ts with cn helper
- Add shadcn UI components: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea
- Create editor navbar component (components/editor/editor-navbar.tsx)
- Create project sidebar component (components/editor/project-sidebar.tsx)
- Implement dialog pattern using existing color tokens
- Install @clerk/ui dependency
- Implement Clerk authentication (provider, auth pages, route protection, user menu)
  - Wrapped root layout with ClerkProvider using dark theme from '@clerk/ui/themes'
  - Created proxy.ts at root for route protection (not middleware.ts) as specified
  - Created sign-in and sign-up pages using Clerk components with catch-all routes ([[...rest]])
  - Updated root layout to redirect authenticated users to /editor and unauthenticated to /sign-in
  - Added Clerk's UserButton to editor navbar for profile settings and logout
  - Used Clerk's default user menu and profile flows
  - Used existing Clerk env vars (no renaming or inventing new ones)
- UI Design Implementation - Sign-in Page Split Layout
  - Created 50/50 split layout with branded left sidebar and form on right
  - Implemented AuthSidebar component (components/ui/auth-sidebar.tsx) with:
    - Ghost AI logo with cyan accent (#00c8d4)
    - Main headline: "Design systems at the speed of thought"
    - Description text
    - Three feature cards with icons (AI Architecture Generation, Real-time Collaboration, Instant Spec Generation)
    - Footer copyright text
  - Updated auth layout (app/(auth)/layout.tsx) to use split design
  - Added color tokens to globals.css (--accent-primary, --bg-base, etc.) from UI guidelines
  - Updated app layout to use Geist Sans and Mono fonts (--font-sans, --font-mono)
  - Updated Clerk appearance config to use Geist fonts and cyan accent color (#00c8d4)
  - Styled right panel with dark background for form display
- Build '/editor' home screen and project dialogs/sidebar actions (per feature-specs/04-project-dialogs.md)
  - Created editor home with heading, description, and New Project button
  - Implemented Create Project dialog with live slug preview
  - Implemented Rename Project dialog with prefilled input and auto-focus
  - Implemented Delete Project dialog with destructive confirmation
  - Added sidebar actions (rename, delete) for owned projects only
  - Wired dialog state management via custom hook
  - Used mock project data only (no API calls or persistence)
- Dark theme implementation in /editor page
  - Applied Ghost AI theme colors to EditorNavbar component:
    - Background: var(--bg-base) (#080809)
    - Border color: var(--border-subtle) (#3a4a42)
  - Applied Ghost AI theme colors to ProjectSidebar component:
    - Drawer background: var(--bg-surface) (#111114)
    - Text color: var(--text-primary) (#f0f0f4)
    - Tab list background: var(--bg-base) (#080809)
    - Project items: var(--bg-elevated) (#18181c) with subtle borders
    - Accent colors: var(--accent-primary) (#00c8d4) for icons and button
    - New Project button: cyan accent with hover opacity transition
  - Applied Ghost AI theme colors to editor page:
    - Canvas background: var(--bg-base) (#080809)
    - Elevated sections: var(--bg-elevated) (#18181c)
    - Primary text: var(--text-primary) (#f0f0f4)
    - Secondary text: var(--text-secondary) (#c0c0cc)
    - CTA button: var(--accent-primary) (#00c8d4) on dark background
- Implement Prisma ORM with Project and ProjectCollaborator models (per feature-specs/05-prisma.md)
  - Created prisma/models/project.prisma with Project and ProjectCollaborator models
  - Added proper relations, indexes, and constraints as specified
  - Created lib/prisma.ts as a cached singleton Prisma client
  - Implemented branching logic for DATABASE_URL (Accelerate vs direct pg adapter)
  - Ran migration and generated Prisma client successfully


## Next Up
- 06 -

## Open Questions
- [Any unresolved product or technical decisions]

## Architecture Decisions
- Use Clerk's 'dark' theme from '@clerk/ui/themes' as base, overriding appearance variables with app's existing CSS variables (no hardcoded colors)
- Used proxy.ts (not middleware.ts) for route protection as specified
- Protected all routes by default except public auth paths
- Implemented client-side redirects in app/page.tsx using useEffect hook
- Used catch-all routes ([[...rest]]) for Clerk sign-in and sign-up pages to avoid routing conflicts

## Session Notes
- Authentication implementation complete per spec @context/feature-specs/03-auth.md
- Fixed Clerk themes import path (@clerk/ui/themes)
- Updated auth pages to use catch-all route format to prevent middleware protection issues
- Ready to implement next feature from specs