-- DropForeignKey
ALTER TABLE "assignment" DROP CONSTRAINT "assignment_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "enrollment" DROP CONSTRAINT "enrollment_componentId_fkey";

-- DropForeignKey
ALTER TABLE "enrollment" DROP CONSTRAINT "enrollment_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "enrollment" DROP CONSTRAINT "enrollment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "exam" DROP CONSTRAINT "exam_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "grade" DROP CONSTRAINT "grade_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "grade" DROP CONSTRAINT "grade_examId_fkey";

-- DropForeignKey
ALTER TABLE "grade" DROP CONSTRAINT "grade_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "grade" DROP CONSTRAINT "grade_quizId_fkey";

-- DropForeignKey
ALTER TABLE "grade" DROP CONSTRAINT "grade_studentId_fkey";

-- DropForeignKey
ALTER TABLE "instructor_profile" DROP CONSTRAINT "instructor_profile_userId_fkey";

-- DropForeignKey
ALTER TABLE "lesson" DROP CONSTRAINT "lesson_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "module" DROP CONSTRAINT "module_componentId_fkey";

-- DropForeignKey
ALTER TABLE "module" DROP CONSTRAINT "module_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "question" DROP CONSTRAINT "question_examId_fkey";

-- DropForeignKey
ALTER TABLE "question" DROP CONSTRAINT "question_quizId_fkey";

-- DropForeignKey
ALTER TABLE "quiz" DROP CONSTRAINT "quiz_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "section" DROP CONSTRAINT "section_componentId_fkey";

-- DropForeignKey
ALTER TABLE "section" DROP CONSTRAINT "section_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "student_profile" DROP CONSTRAINT "student_profile_componentId_fkey";

-- DropForeignKey
ALTER TABLE "student_profile" DROP CONSTRAINT "student_profile_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "student_profile" DROP CONSTRAINT "student_profile_userId_fkey";

-- DropForeignKey
ALTER TABLE "submission" DROP CONSTRAINT "submission_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "submission" DROP CONSTRAINT "submission_examId_fkey";

-- DropForeignKey
ALTER TABLE "submission" DROP CONSTRAINT "submission_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "submission" DROP CONSTRAINT "submission_quizId_fkey";

-- DropForeignKey
ALTER TABLE "submission" DROP CONSTRAINT "submission_studentId_fkey";

-- CreateTable
CREATE TABLE "pending_registration" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "surname" TEXT,
    "firstName" TEXT,
    "middleName" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "school" TEXT,
    "department" TEXT,
    "degreeProgram" TEXT,
    "yearLevel" TEXT,
    "major" TEXT,
    "gender" TEXT,
    "birthdate" TEXT,
    "houseStreetPurok" TEXT,
    "barangay" TEXT,
    "province" TEXT,
    "currentAddress" TEXT,
    "cityAddress" TEXT,
    "provincialAddress" TEXT,
    "contactNumber" TEXT,
    "municipality" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_group" (
    "id" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "facilitatorName" TEXT NOT NULL,
    "facilitatorId" TEXT,
    "programHandles" JSONB,
    "municipality" TEXT,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "maxRecommendedLoad" INTEGER NOT NULL DEFAULT 50,
    "sourceDocument" TEXT,

    CONSTRAINT "training_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_record" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "facilitatorId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_session" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "facilitatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qualifying_exam_result" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "preferredComponent" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "timestamp" TEXT NOT NULL,
    "assignedComponent" TEXT,
    "rank" INTEGER,
    "status" TEXT,
    "adminOverride" BOOLEAN,

    CONSTRAINT "qualifying_exam_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_application_state" (
    "id" TEXT NOT NULL,
    "slotLimits" JSONB NOT NULL,
    "qualifyingScore" INTEGER NOT NULL DEFAULT 70,
    "applicationClosed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_application_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log_entry" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_entry_pkey" PRIMARY KEY ("id")
);
