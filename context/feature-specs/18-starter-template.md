Add a small starter template library so users can start a canvas from a pre-built diagram instead of building from scratch.

## Implementation

1. Create `components/editor/starter-templates.ts`
   
   Include:
   - a `CanvasTemplate` type
   - a `CANVAS_TEMPLATES` array
   - at least three templates, such as microservices, CI/CD pipeline, and event-driven system
   
   Each template should include:
   - `id`
   - `name`
   - `description`
   - nodes
   - egdes

Use the shared canvas types and existing color palette. Add small helper functions if needed to keep the template data readable.

2. Create `components/editor/starter-templates-model.tsx`.
   
   The modal should:
   - open as a dialog
   - show template cards in a scrollable grid
   - show the template name and description
   - include an import button for each template
   - call `onImport` with the selected tempate, then close

3. Add s simple diagram preview to each template card.
   - fit the preview to a fixed-size viewport
   - calculate the preview bounds from the template node positions
   - draw edges as simpel lines between node centers
   - draw nodes using their shape and color data
   - keep the preview lightweight, no React Flow instance needed