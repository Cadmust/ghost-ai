# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase
- Feature 12 (Shape Panel) implementation complete

## Current Goal
- Ready to implement next feature (custom node rendering / AI)

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
  - Applied Ghost AI theme colors to EditorNavbar component
  - Applied Ghost AI theme colors to ProjectSidebar component
  - Applied Ghost AI theme colors to editor page
- Implement Prisma ORM with Project and ProjectCollaborator models (per feature-specs/05-prisma.md)
  - Created prisma/models/project.prisma with Project and ProjectCollaborator models
  - Added proper relations, indexes, and constraints as specified
  - Created lib/prisma.ts as a cached singleton Prisma client
  - Implemented branching logic for DATABASE_URL (Accelerate vs direct pg adapter)
  - Ran migration and generated Prisma client successfully
- Implement project APIs (per feature-specs/06-project-apis.md)
  - Created REST endpoints for project CRUD
  - Security: authenticated user checks, ownership enforcement
- Build `/editor/[roomId]` workspace shell with server-side access checks (per feature-specs/08-editor-workspace-shell.md)
  - Created lib/project-access.ts with access helpers (getCurrentIdentity, canAccessProject, getProjectAccess)
  - Created components/editor/access-denied.tsx with centered lock icon, message, and link back to /editor
  - Created app/editor/[roomId]/page.tsx as server component with:
    - Unauthenticated redirect to /sign-in
    - Project access check (owner or collaborator)
    - AccessDenied for missing or unauthorized projects
  - Created components/editor/workspace-navbar.tsx with project name display, share button, AI sidebar toggle, and UserButton
  - Created components/editor/workspace-client.tsx with full-viewport layout:
    - Top navbar showing project name
    - Left sidebar (ProjectSidebar) with current room highlighted
    - Center canvas placeholder with dark surface background and centered message
    - Right sidebar placeholder for future AI chat (togglable)
  - Updated ProjectSidebar to support currentRoomId prop for active highlighting
  - Updated ProjectSidebar project items to use Link for navigation to workspace
  - Updated useProjectDialogs navigation path from /editor/workspace/ to /editor/
- Implement Share Dialog (per feature-specs/09-share-dialog.md)
  - Switched ProjectCollaborator schema from clerkId to email-based tracking
  - Created migration 20260523000002_switch_to_email_collaborators
  - Updated lib/project-access.ts: getCurrentIdentity now fetches user email from Clerk, collaborator checks use email
  - Updated lib/projects.ts: shared projects query uses email from Clerk
  - Created GET /api/projects/[projectId]/collaborators: lists collaborators enriched with Clerk user data (name, avatar) — falls back to email-only when Clerk lookup fails
  - Created POST /api/projects/[projectId]/collaborators: invite by email (owner only, server-enforced)
  - Created DELETE /api/projects/[projectId]/collaborators: remove by email (owner only, server-enforced)
  - Created components/editor/share-dialog.tsx with:
    - Owner view: invite by email, collaborator list with avatars/names, remove button per collaborator, copy project link with "Copied!" feedback
    - Collaborator view: read-only collaborator list with avatars/names, copy project link
  - Wired ShareDialog in workspace-client.tsx with isOwner prop from server
- Implement Liveblocks Setup (per feature-specs/10-liveblocks-setup.md)
  - Installed @liveblocks/node for server-side auth
  - Configured liveblocks.config.ts with Presence (cursor, isThinking) and UserMeta (id, name, avatar, color)
  - Created lib/liveblocks.ts as a cached Liveblocks node client singleton
  - Created lib/color-helper.ts with deterministic userId-to-color mapping from a 10-color palette
  - Created POST /api/liveblocks-auth route:
    - Clerk authentication required
    - Project access verified via canAccessProject helper
    - Room auto-created via getOrCreateRoom with per-user write access
    - Returns Liveblocks ID token with user name, avatar, and cursor color
    - Returns 403 for unauthorized project access

- Implement Liveblocks Setup (per feature-specs/10-liveblocks-setup.md)
  - Installed @liveblocks/node for server-side auth
  - Configured liveblocks.config.ts with Presence (cursor, isThinking) and UserMeta (id, name, avatar, color)
  - Created lib/liveblocks.ts as a cached Liveblocks node client singleton
  - Created lib/color-helper.ts with deterministic userId-to-color mapping from a 10-color palette
  - Created POST /api/liveblocks-auth route:
    - Clerk authentication required
    - Project access verified via canAccessProject helper
    - Room auto-created via getOrCreateRoom with per-user write access
    - Returns Liveblocks ID token with user name, avatar, and cursor color
    - Returns 403 for unauthorized project access
- Implement Base Canvas (per feature-specs/11-base-canvas.md)
  - Created types/canvas.ts with CanvasNodeData (label, color, shape) and CanvasNode/CanvasEdge type aliases
  - Created components/editor/canvas-editor.tsx as a client-side canvas wrapper:
    - LiveblocksProvider pointed at /api/liveblocks-auth
    - RoomProvider with the project room ID and initial presence (cursor: null, isThinking: false)
    - ClientSideSuspense with spinner loading state
    - ErrorBoundary with connection-error fallback for Liveblocks issues
    - Inner CanvasFlow component using useLiveblocksFlow({ suspense: true })
  - Wired React Flow with Liveblocks-synced nodes, edges, and change handlers
  - Added MiniMap, dot-pattern Background, fitView, and loose connection edge defaults
  - Updated auth route to accept the `room` field (sent by the Liveblocks client) in addition to `projectId`
  - Replaced workspace-client.tsx canvas placeholder with CanvasEditor component
- Implement Shape Panel (per feature-specs/12-shape.panel.md)
  - Expanded shape union type in types/canvas.ts to include all 6 shapes (rectangle, diamond, circle, pill, cylinder, hexagon)
  - Added SHAPE_DEFAULT_SIZES map with sensible defaults for each shape
  - Added ShapeDragPayload type for drag-and-drop data transfer
  - Created components/editor/shape-panel.tsx with floating pill-shaped toolbar at bottom-center
    - SVG icons for each shape variant
    - Drag start handler sets application/ghost-shape data with shape and default size
  - Created components/editor/canvas-node.tsx with basic bordered rectangle renderer
    - Centered label text, handles for connections
    - Registered as custom 'canvasNode' node type
  - Updated canvas-editor.tsx with drag-and-drop support:
    - Wrapped ReactFlow in ReactFlowProvider for useReactFlow access
    - dragover/drop handlers on canvas wrapper div
    - Drop reads shape payload, converts screen coords via screenToFlowPosition, creates node
    - Node IDs generated as `${shape}-${timestamp}-${counter}`
    - New nodes use empty label, default color, and dragged shape value

## Next Up
- 13-custom-nodes.md: Custom node and edge rendering

## Open Questions
- [Any unresolved product or technical decisions]

## Architecture Decisions
- Use Clerk's 'dark' theme from '@clerk/ui/themes' as base, overriding appearance variables with app's existing CSS variables (no hardcoded colors)
- Used proxy.ts (not middleware.ts) for route protection as specified
- Protected all routes by default except public auth paths
- Implemented client-side redirects in app/page.tsx using useEffect hook
- Used catch-all routes ([[...rest]]) for Clerk sign-in and sign-up pages to avoid routing conflicts
- Used onNodesChange with the 'add' change type to add nodes to Liveblocks-synced React Flow state (NodeAddChange pattern)

## Session Notes
- Authentication implementation complete per spec @context/feature-specs/03-auth.md
- Fixed Clerk themes import path (@clerk/ui/themes)
- Updated auth pages to use catch-all route format to prevent middleware protection issues
- Feature 12 shape panel implementation complete
- All 6 shape icons (rectangle, diamond, circle, pill, cylinder, hexagon) render SVG inline icons
- Drag-and-drop creates Liveblocks-synced nodes with proper shape data
- Node IDs use `${shape}-${Date.now()}-${counter}` format for uniqueness
- Fixed canvas visual issues (2026-05-24):
  - Removed `m-3 rounded-2xl` wrapper div causing floating card effect — canvas now fills space flush with background
  - Changed ReactFlow background from `var(--bg-surface)` to `var(--bg-base)` to blend with container
  - Changed loading/error fallback backgrounds to `var(--bg-base)` for consistency
- Fixed right sidebar to overlay with fixed positioning (was inline flex pushing the canvas)
- Fixed drag-and-drop by moving handlers from wrapper div to ReactFlow component directly (ReactFlow pane was intercepting events)
- Fixed left sidebar Drawer width by using style prop instead of `w-64` className to avoid Vaul CSS specificity conflict