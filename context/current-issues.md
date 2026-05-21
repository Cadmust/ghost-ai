1. There an issues where user fail to rename the project name from sidebar by clicking the rename icon, below show the error output:
## Error Type
Console Error

## Error Message
Failed to rename project


    at useProjectDialogs.useCallback[handleRenameSubmit] (hooks/use-project-dialogs.ts:179:15)

## Code Frame
  177 |
  178 |       if (!response.ok) {
> 179 |         throw new Error('Failed to rename project');
      |               ^
  180 |       }
  181 |
  182 |       // Reset dialog and refresh projects

Next.js version: 16.2.6 (Turbopack)

2. User unable to delete the available project from sidebard after clicking the delete button, below is the error output:
## Error Type
Console Error

## Error Message
Failed to delete project


    at useProjectDialogs.useCallback[handleDeleteConfirm] (hooks/use-project-dialogs.ts:221:15)

## Code Frame
  219 |
  220 |       if (!response.ok) {
> 221 |         throw new Error('Failed to delete project');
      |               ^
  222 |       }
  223 |
  224 |       // Reset dialog state

Next.js version: 16.2.6 (Turbopack)

3. Terminal error show:
PATCH /api/projects/b36e33d0-c0a6-4341-88d0-471bd1237d95 500 in 318ms (next.js: 13ms, proxy.ts: 22ms, application-code: 283ms)
[browser] [RENAME_PROJECT] Error: Failed to rename project
    at useProjectDialogs.useCallback[handleRenameSubmit] (hooks/use-project-dialogs.ts:179:15)
  177 |
  178 |       if (!response.ok) {
> 179 |         throw new Error('Failed to rename project');
      |               ^
  180 |       }
  181 |
  182 |       // Reset dialog and refresh projects (hooks/use-project-dialogs.ts:198:15)
Error: Route "/api/projects/[projectId]" used `params.projectId`. `params` is a Promise and must be unwrapped with `await` or `React.use()` before accessing its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
    at DELETE (app\api\projects\[projectId]\route.ts:44:11)
  42 | export async function DELETE(request: NextRequest, { params }: { params: { pr...
  43 |   const { userId } = await auth()
> 44 |   const { projectId } = params
     |           ^
  45 |
  46 |   if (!userId) {
  47 |     return new NextResponse('Unauthorized', { status: 401 })
[PROJECT_ID_DELETE] Error [PrismaClientValidationError]: 
Invalid `__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].project.findUnique()` invocation in
C:\laragon\www\ghost-ai\.next\dev\server\chunks\[root-of-the-server]__0yaj5dy._.js:407:162

  404     });
  405 }
  406 try {
→ 407     const project = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].project.findUnique({
            where: {
              id: undefined,
          ?   AND?: ProjectWhereInput | ProjectWhereInput[],
          ?   OR?: ProjectWhereInput[],
          ?   NOT?: ProjectWhereInput | ProjectWhereInput[],
          ?   ownerId?: StringFilter | String,
          ?   name?: StringFilter | String,
          ?   description?: StringNullableFilter | String | Null,
          ?   status?: EnumProjectStatusFilter | ProjectStatus,
          ?   canvasJsonPath?: StringNullableFilter | String | Null,
          ?   createdAt?: DateTimeFilter | DateTime,
          ?   updatedAt?: DateTimeFilter | DateTime,
          ?   collaborators?: ProjectCollaboratorListRelationFilter
            }
          })

Argument `where` of type ProjectWhereUniqueInput needs at least one of `id` arguments. Available options are marked with ?.
    at <unknown> (app\api\projects\[projectId]\route.ts:51:42)
    at async DELETE (app\api\projects\[projectId]\route.ts:51:21)
  49 |
  50 |   try {
> 51 |     const project = await prisma.project.findUnique({
     |                                          ^
  52 |       where: { id: projectId },
  53 |     })
  54 | {
  clientVersion: '7.8.0'
}
 DELETE /api/projects/b36e33d0-c0a6-4341-88d0-471bd1237d95 500 in 334ms (next.js: 13ms, proxy.ts: 10ms, application-code: 311ms)
[browser] [DELETE_PROJECT] Error: Failed to delete project
    at useProjectDialogs.useCallback[handleDeleteConfirm] (hooks/use-project-dialogs.ts:221:15)
  219 |
  220 |       if (!response.ok) {
> 221 |         throw new Error('Failed to delete project');
      |               ^
  222 |       }
  223 |
  224 |       // Reset dialog state (hooks/use-project-dialogs.ts:240:15)
