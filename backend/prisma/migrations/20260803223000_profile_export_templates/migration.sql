CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "profile_export_template" (
  "id" TEXT NOT NULL,
  "templateKey" TEXT NOT NULL DEFAULT 'student-profile',
  "name" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "configuration" JSONB NOT NULL,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "profile_export_template_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profile_export_template_templateKey_version_key"
ON "profile_export_template"("templateKey", "version");

CREATE INDEX "profile_export_template_templateKey_status_createdAt_idx"
ON "profile_export_template"("templateKey", "status", "createdAt");

CREATE INDEX "profile_export_template_templateKey_isActive_idx"
ON "profile_export_template"("templateKey", "isActive");

-- PostgreSQL enforces that only one published version can be active.
CREATE UNIQUE INDEX "profile_export_template_one_active_key"
ON "profile_export_template"("templateKey")
WHERE "isActive" = true;
