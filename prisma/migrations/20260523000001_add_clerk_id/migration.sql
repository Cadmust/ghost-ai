-- Replace email-based collaborator tracking with clerkId
-- This mirrors the change in prisma/models/project.prisma

-- Drop old indexes on email
DROP INDEX IF EXISTS "ProjectCollaborator_email_idx";
DROP INDEX IF EXISTS "ProjectCollaborator_projectId_email_key";

-- Drop old email column, add clerkId
ALTER TABLE "ProjectCollaborator" DROP COLUMN IF EXISTS "email";
ALTER TABLE "ProjectCollaborator" ADD COLUMN "clerkId" TEXT NOT NULL;

-- Create new indexes
CREATE INDEX "ProjectCollaborator_clerkId_idx" ON "ProjectCollaborator"("clerkId");
CREATE UNIQUE INDEX "ProjectCollaborator_projectId_clerkId_key" ON "ProjectCollaborator"("projectId", "clerkId");