Wire up the AI sidebar so users can submit design prompt, track AI run status in real time, and reflect AI-driven canvas updates through Liveblocks.

### Implementation

1. Submit from AI sidebar

- On submit:
  - push the user message to the `ai-chat` feed
  - call `POST /api/ai/design` with `{prompt, roomId}`
  - read `{runId, publicToken}` from the response
- store `runId` and `publicToken` in local state

2. Run status tracking

- Use `useRealtimeRun(runId, {accessToken: publicToken})`
- While the run is active:
  - disable the chat input
  - show a loading state (spinner in the button is enough)
- When the run completes:
  - push a final AI message to `ai-chat`
  - reset loading + run state

3. Canvas update (realtime)

- Do not manually update nodes/edges
- Rely on Liveblocks (`useLiveblocksFlow`) to reflect changes in real time
- AI update to nodes, edges, and presence should appear automatically

4. Status display

- Read the latest message from `ai-status-feed`
- Show a compact status strip above the input only when a run is active

### UI Details

- Use existing design tokens from `globals.css` (do not introduce new colors)
- Follow `ui-context.md` for layout and visual consistency

Chat bubbles