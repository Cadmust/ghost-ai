-- Switch collaborator tracking from clerkId back to email
-- This aligns with the spec: collaborators are stored by email

-- Drop old indexes on clerkId
DROP INDEX IF EXISTS "ProjectCollaborator_clerkId_idx";
DROP INDEX IF EXISTS "ProjectCollaborator_projectId_clerkId_key";

-- Drop old clerkId column, add email
ALTER TABLE "ProjectCollaborator" DROP COLUMN IF EXISTS "clerkId";
ALTER TABLE "ProjectCollaborator" ADD COLUMN "email" TEXT NOT NULL;

-- Create new indexes
CREATE INDEX "ProjectCollaborator_email_idx" ON "ProjectCollaborator"("email");
CREATE UNIQUE INDEX "ProjectCollaborator_projectId_email_key" ON "ProjectCollaborator"("projectId", "email");