Create the backend flow for AI-powered spec generation: API route, Trigger.dev task, token route, and run ownership tracking.

### Implementation

1. Spec trigger route

Create or update `POST /api/ai/spec`.

It should:

- accept `roomId`, `chatHistory`, `nodes`, and `edges`
- authenticate the current user
- resolve project access from `roomId`
- trigger the `generate-spec` task
- save a `TaskRun` record for ownership/access control
- return the Trigger.dev `runId`

Do not trust a client-supplied `projectId`.

2. Spec token route

Create or update `POST /api/ai/spec/token`.

It should:

- accept `runId`
- authenticate the current user
- verify the `TaskRun` belongs to the user
- issue a Trigger.dev public access tokens scoped to that run
- set token expiration to 1 hour
- return the token to the client

3. Spec generation task

Creat or update `trigger/generate-spec.ts`.
Define a `generateSpec` task that:

- accepts `projectId`, `roomId`, `chatHistory`, `nodes`, and `edges`
- validates input with Zod
- uses nemotron through `@openrouter/sdk`
- generates a Markdown technical spec from the canvas and chat context
- updates run metadata/status for realtime tracking
- returns the generated spec content as task output

Follow the existing Trigger.dev task patterns in the codebase for retries, logging, and error handling.

### Scope Limits

- Do not add frontend logic 
- Do not create spec editor UI