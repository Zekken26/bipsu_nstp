import { getJob, getQueueStats } from '../../queue/requestQueue.js';
import { sendError } from '../../utils/apiResponse.js';

export async function getQueueStatus(req, res) {
  return res.json({
    success: true,
    data: {
      queues: getQueueStats(),
    },
  });
}

export async function getQueueJob(req, res) {
  const job = getJob(req.params.id);
  if (!job) return sendError(res, 'Queued job was not found.', 404);
  return res.json({
    success: true,
    data: job,
  });
}
