CREATE TYPE "AcademicSemester" AS ENUM ('FIRST', 'SECOND');
CREATE TYPE "GradeClassification" AS ENUM (
  'EXCELLENT', 'OUTSTANDING', 'VERY_GOOD', 'GOOD',
  'FAIR', 'POOR', 'CONDITIONAL', 'FAILED'
);

-- Existing prelim/midterm/final data is intentionally retained. These nullable
-- fields allow administrators to review and classify legacy records instead of
-- silently converting them into semester grades.
ALTER TABLE "grade"
ADD COLUMN "componentId" TEXT,
ADD COLUMN "schoolYear" TEXT,
ADD COLUMN "semester" "AcademicSemester",
ADD COLUMN "percentGrade" DOUBLE PRECISION,
ADD COLUMN "numericalGrade" DECIMAL(2,1),
ADD COLUMN "classification" "GradeClassification",
ADD COLUMN "releasedAt" TIMESTAMP(3),
ADD COLUMN "releasedById" TEXT,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT;

CREATE INDEX "grade_componentId_idx" ON "grade"("componentId");
CREATE INDEX "grade_schoolYear_semester_isReleased_idx" ON "grade"("schoolYear", "semester", "isReleased");
CREATE UNIQUE INDEX "grade_studentId_componentId_schoolYear_semester_key"
ON "grade"("studentId", "componentId", "schoolYear", "semester");

ALTER TABLE "grade"
ADD CONSTRAINT "grade_componentId_fkey"
FOREIGN KEY ("componentId") REFERENCES "nstp_component"("id") ON DELETE SET NULL ON UPDATE CASCADE;
