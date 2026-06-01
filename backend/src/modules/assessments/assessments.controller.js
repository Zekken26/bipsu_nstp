import { listAssessments } from './assessments.service.js';
import { enqueueJob } from '../../queue/requestQueue.js';
import { addAuditEntry } from '../../audit/auditLog.js';
import { validateAssessmentSubmission } from '../../utils/nstpValidation.js';

export async function listAssessmentsController(req, res) {
  return res.json(await listAssessments(req));
}

export async function submitAssessmentController(req, res) {
  const payload = req.body || {};
  validateAssessmentSubmission(payload);
  const job = enqueueJob('assessmentSubmissions', async () => ({
    assessmentId: payload.assessmentId,
    studentId: payload.studentId || req.headers['x-user-id'],
    submittedAt: new Date().toISOString(),
  }));

  return res.status(202).json({
    success: true,
    data: {
      jobId: job.id,
      status: job.status,
      message: 'Assessment submission has been accepted for processing.',
    },
  });
  addAuditEntry(req, 'assessment.submission.queued', 'assessment', payload.assessmentId, `Submission queued for ${payload.studentId || req.headers['x-user-id']}.`);
}
