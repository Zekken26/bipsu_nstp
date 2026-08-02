-- This migration intentionally performs no cleanup. Run `npm run report:orphans`
-- against a backup/copy first; PostgreSQL will reject this migration if any
-- relationship is orphaned, leaving the deployment stopped for operator review.
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "nstp_component"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "instructor_profile" ADD CONSTRAINT "instructor_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coordinator_profile" ADD CONSTRAINT "coordinator_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coordinator_profile" ADD CONSTRAINT "coordinator_profile_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "nstp_component"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "section" ADD CONSTRAINT "section_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "nstp_component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "section" ADD CONSTRAINT "section_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructor_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "module" ADD CONSTRAINT "module_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "nstp_component"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "module" ADD CONSTRAINT "module_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructor_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question" ADD CONSTRAINT "question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question" ADD CONSTRAINT "question_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam" ADD CONSTRAINT "exam_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "module"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "submission" ADD CONSTRAINT "submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "submission" ADD CONSTRAINT "submission_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "submission" ADD CONSTRAINT "submission_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "submission" ADD CONSTRAINT "submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "submission" ADD CONSTRAINT "submission_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "nstp_component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grade" ADD CONSTRAINT "grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grade" ADD CONSTRAINT "grade_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "module"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grade" ADD CONSTRAINT "grade_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grade" ADD CONSTRAINT "grade_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grade" ADD CONSTRAINT "grade_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "follow" ADD CONSTRAINT "follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "follow" ADD CONSTRAINT "follow_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment" ADD CONSTRAINT "payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment" ADD CONSTRAINT "payment_targetEnrollmentId_fkey" FOREIGN KEY ("targetEnrollmentId") REFERENCES "enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
