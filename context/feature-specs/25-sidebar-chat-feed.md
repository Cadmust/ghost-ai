Add real-time room chat to the AI sidebar using a separate Liveblocks `ai-chat` feed.

This is only for chat messages. Keep it separate from `ai-status-feed`, which handles AI progress and presence updates.

## Implementation

1. Add the `ai-chat` feed.
	
	Before implementing, check the existing Liveblocks setup and follow the same feed patterns already used in the project.
	- create or reuse a Liveblocks feed named `ai-chat`
	- keep it room-scoped
	- do not mix it with `ai-status-feed`
	
2. Wire the chat feed into the sidebar.
	- subscribe to `ai-chat` in the sidebar chat area
	- render chat messages in order
	- show sender, timestamp, and message content
	- keep the styling consistent with the existing sidebar UI
	- use Tailwind utilities and existing shadcn components where they fit
	
3. Add message sending.
	- allow users in the room to send messages to `ai-chat`
	- use the existing sidebar input and send button
	- clear the input after a successful send
	- show a small error state if sending fails
	
4. Add message validation.
	- define or reuse a Zod schema in `types/tasks.ts`
	- message shape should include sender, role, content, and timestamp
	- validate feed messages before rendering them
	
## Scope Limits

- don't add actual AI generation logic
- don't trigger background tasks yet
- don't block or dim the whole sidebar
- don't show full feed history
- keep this focused on shared AI activity state only