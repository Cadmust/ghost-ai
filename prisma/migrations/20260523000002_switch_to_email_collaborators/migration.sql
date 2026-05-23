-- Switch collaborator tracking from clerkId back to email
-- This aligns with the spec: collaborators are stored by email

BEGIN;

-- Step 1: Add email as nullable first (existing rows get NULL)
ALTER TABLE "ProjectCollaborator" ADD COLUMN "email" TEXT;

-- Step 2: Backfill email from clerkId for existing rows
-- Use a placeholder since we can't derive email from clerkId in SQL
-- These placeholders signal that the collaborator record needs re-invitation
UPDATE "ProjectCollaborator" SET "email" = CONCAT('pending-', "clerkId", '@migrate.local') WHERE "email" IS NULL;

-- Step 3: Set NOT NULL after backfill
ALTER TABLE "ProjectCollaborator" ALTER COLUMN "email" SET NOT NULL;

-- Step 4: Drop old indexes on clerkId
DROP INDEX IF EXISTS "ProjectCollaborator_clerkId_idx";
DROP INDEX IF EXISTS "ProjectCollaborator_projectId_clerkId_key";

-- Step 5: Drop old clerkId column
ALTER TABLE "ProjectCollaborator" DROP COLUMN IF EXISTS "clerkId";

-- Step 6: Create new indexes on email
CREATE INDEX "ProjectCollaborator_email_idx" ON "ProjectCollaborator"("email");
CREATE UNIQUE INDEX "ProjectCollaborator_projectId_email_key" ON "ProjectCollaborator"("projectId", "email");

COMMIT;