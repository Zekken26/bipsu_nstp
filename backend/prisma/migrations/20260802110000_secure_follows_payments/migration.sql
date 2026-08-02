CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED');
CREATE TYPE "PaymentPurpose" AS ENUM ('ENROLLMENT_FEE');

CREATE TABLE "follow" (
  "id" TEXT NOT NULL,
  "followerId" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "follow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "follow_followerId_targetUserId_key" ON "follow"("followerId", "targetUserId");
CREATE INDEX "follow_targetUserId_idx" ON "follow"("targetUserId");

CREATE TABLE "payment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "targetEnrollmentId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "purpose" "PaymentPurpose" NOT NULL,
  "idempotencyKey" VARCHAR(128) NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "providerReference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_userId_idempotencyKey_key" ON "payment"("userId", "idempotencyKey");
CREATE INDEX "payment_targetEnrollmentId_idx" ON "payment"("targetEnrollmentId");
CREATE INDEX "payment_status_idx" ON "payment"("status");
