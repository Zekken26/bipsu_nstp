CREATE TYPE "ModuleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

ALTER TABLE "module"
ADD COLUMN "status" "ModuleStatus" NOT NULL DEFAULT 'DRAFT';

UPDATE "module"
SET "status" = CASE
  WHEN "isPublished" = TRUE THEN 'PUBLISHED'::"ModuleStatus"
  ELSE 'DRAFT'::"ModuleStatus"
END;

CREATE INDEX "module_status_idx" ON "module"("status");
