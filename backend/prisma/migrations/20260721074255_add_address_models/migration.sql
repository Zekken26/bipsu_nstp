-- AlterTable
ALTER TABLE "pending_registration" ADD COLUMN     "assignedMunicipality" TEXT;

-- CreateTable
CREATE TABLE "province" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "province_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "municipality" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provinceCode" TEXT NOT NULL,

    CONSTRAINT "municipality_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "barangay" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "municipalityCode" TEXT NOT NULL,

    CONSTRAINT "barangay_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "municipality_provinceCode_idx" ON "municipality"("provinceCode");

-- CreateIndex
CREATE INDEX "barangay_municipalityCode_idx" ON "barangay"("municipalityCode");
