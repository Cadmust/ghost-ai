# Current Issues — RESOLVED

## Issues Fixed (2026-05-24)

### 1. Canvas visual — floating card effect
**Root cause:** The canvas wrapper div in [workspace-client.tsx](../components/editor/workspace-client.tsx) had `m-3 rounded-2xl overflow-hidden` — margin and rounded corners made it float like a card. Combined with `backgroundColor: 'var(--bg-surface)'` (vs container's `var(--bg-base)`) this created a visible elevation effect.

**Fix:**
- Removed `m-3 rounded-2xl` from the wrapper div
- Changed ReactFlow background to `var(--bg-base)` in [canvas-editor.tsx](../components/editor/canvas-editor.tsx)
- Changed loading/error fallback backgrounds to `var(--bg-base)` for consistency

### 2. Right sidebar pushing canvas
**Root cause:** The AI sidebar was rendered as an inline `<aside>` in the flex flow with `shrink-0`, so it physically pushed the canvas area.

**Fix:** Changed to `fixed right-0 top-14 bottom-0 w-72 z-40` with shadow, floating over the canvas.

### 3. Drag-and-drop not working
**Root cause:** The `onDragOver` / `onDrop` handlers were on a wrapper div surrounding ReactFlow, but ReactFlow's internal `<div class="react-flow__pane">` intercepts drag events before they bubble up, so the handlers never fired.

**Fix:** Moved `onDragOver` and `onDrop` props directly onto the `<ReactFlow>` component (ReactFlow accepts these as native DragEvent props and passes them through to the pane).

### 4. Left sidebar not fully hiding
**Root cause:** The ProjectSidebar's `DrawerContent` used `className="z-50 w-64 border-r"` — the `w-64` class had equal specificity to Vaul's built-in `data-[vaul-drawer-direction=left]:w-3/4`. This caused Tailwind's resolution order ambiguity, and Vaul's slide animation (which measures element/container width) could miscompute the closed-state translate, leaving the drawer partially visible.

**Fix:** Set `width: '16rem'` via the `style` prop instead of `w-64` in className, so there is no CSS specificity conflict with Vaul's responsive width classes. Also wrapped with `className="z-50 border-r"` exclusively.