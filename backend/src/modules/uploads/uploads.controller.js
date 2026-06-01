import { env } from '../../config/env.js';
import { enqueueJob } from '../../queue/requestQueue.js';
import { addAuditEntry } from '../../audit/auditLog.js';

export async function getUploadPolicy(req, res) {
  return res.json({
    success: true,
    data: {
      maxSizeBytes: env.upload.maxSizeBytes,
      allowedMimeTypes: env.upload.allowedMimeTypes,
      linkSubmissions: ['googleDrive', 'youtube', 'externalLink'],
      message: 'File metadata is validated before storage. Google Drive and YouTube links are handled as link submissions.',
    },
  });
}

export async function createUploadIntent(req, res) {
  const metadata = req.uploadMetadata;
  const job = enqueueJob('fileUploads', async () => ({
    accepted: true,
    metadata,
    storedExternally: metadata.submissionMode === 'link',
  }));
  addAuditEntry(req, 'upload.intent.queued', 'upload', job.id, metadata.submissionMode === 'link' ? metadata.linkType : metadata.fileName);

  return res.status(202).json({
    success: true,
    data: {
      uploadId: job.id,
      status: job.status,
      submissionMode: metadata.submissionMode,
      linkType: metadata.linkType,
      message: metadata.submissionMode === 'link'
        ? 'Link submission accepted for validation.'
        : 'Upload metadata accepted. The file can be stored by the configured storage worker.',
    },
  });
}
