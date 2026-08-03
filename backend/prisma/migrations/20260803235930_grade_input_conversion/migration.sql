CREATE TYPE "GradeInputType" AS ENUM ('PERCENT', 'NUMERICAL');

ALTER TABLE "grade"
ADD COLUMN "inputType" "GradeInputType",
ADD COLUMN "inputValue" DECIMAL(5,2),
ADD COLUMN "gradeScaleVersion" TEXT;

-- Existing rows retain NULL provenance because their original entry format is
-- unknowable. Their stored percentage and numerical values remain unchanged.
