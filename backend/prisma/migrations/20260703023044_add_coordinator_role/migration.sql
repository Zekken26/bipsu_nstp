-- AlterEnum
ALTER TYPE "NSTPComponentType" ADD VALUE 'CWTS_COAST_GUARD';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'COORDINATOR';

-- AlterTable
ALTER TABLE "grade" ADD COLUMN     "final" DOUBLE PRECISION,
ADD COLUMN     "midterm" DOUBLE PRECISION,
ADD COLUMN     "prelim" DOUBLE PRECISION,
ALTER COLUMN "score" DROP NOT NULL;

-- AlterTable
ALTER TABLE "module" ADD COLUMN     "data" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "student_profile" ADD COLUMN     "data" JSONB DEFAULT '{}';

-- CreateTable
CREATE TABLE "coordinator_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeNumber" TEXT,
    "componentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordinator_profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coordinator_profile_userId_key" ON "coordinator_profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "coordinator_profile_employeeNumber_key" ON "coordinator_profile"("employeeNumber");

-- CreateIndex
CREATE INDEX "coordinator_profile_componentId_idx" ON "coordinator_profile"("componentId");
