CREATE TABLE "module_progress" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "module_progress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "module_progress_studentId_moduleId_key" ON "module_progress"("studentId", "moduleId");
CREATE INDEX "module_progress_moduleId_idx" ON "module_progress"("moduleId");
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
