import crypto from 'node:crypto';
import path from 'node:path';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const duplicateUploads = new Map();
const linkHosts = {
  youtube: ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'],
  googleDrive: ['drive.google.com', 'docs.google.com'],
};

function cleanupDuplicates() {
  const now = Date.now();
  for (const [key, expiresAt] of duplicateUploads.entries()) {
    if (expiresAt <= now) duplicateUploads.delete(key);
  }
}

setInterval(cleanupDuplicates, 60_000).unref();

function uploadFingerprint(metadata) {
  return crypto
    .createHash('sha256')
    .update([
      metadata.ownerId || '',
      metadata.assessmentId || '',
      metadata.fileName || '',
      metadata.sizeBytes || '',
      metadata.checksum || '',
      metadata.lastModified || '',
    ].join(':'))
    .digest('hex');
}

function classifyLink(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (linkHosts.youtube.includes(host)) return 'youtube';
    if (linkHosts.googleDrive.includes(host)) return 'googleDrive';
    return 'externalLink';
  } catch {
    return null;
  }
}

export function validateUploadMetadata(req, res, next) {
  const body = req.body || {};
  const submissionMode = body.submissionMode || (body.link ? 'link' : 'file');

  if (submissionMode === 'link') {
    const linkType = classifyLink(body.link);
    if (!linkType) {
      return next(new ApiError(400, 'Enter a valid Google Drive, YouTube, or resource URL.', undefined, 'INVALID_UPLOAD_LINK'));
    }
    req.uploadMetadata = {
      submissionMode,
      linkType,
      link: body.link,
      title: body.title,
    };
    return next();
  }

  const fileName = String(body.fileName || '').trim();
  const mimeType = String(body.mimeType || '').trim().toLowerCase();
  const sizeBytes = Number(body.sizeBytes || 0);
  const extension = path.extname(fileName).toLowerCase();

  if (!fileName) {
    return next(new ApiError(400, 'File name is required before upload.', undefined, 'UPLOAD_FILE_NAME_REQUIRED'));
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return next(new ApiError(400, 'File size metadata is missing or invalid.', undefined, 'UPLOAD_SIZE_REQUIRED'));
  }
  if (sizeBytes > env.upload.maxSizeBytes) {
    return next(new ApiError(413, `File is too large. Maximum upload size is ${Math.round(env.upload.maxSizeBytes / 1024 / 1024)} MB.`, undefined, 'UPLOAD_TOO_LARGE'));
  }
  if (!env.upload.allowedMimeTypes.includes(mimeType)) {
    return next(new ApiError(415, 'This file type is not allowed for NSTP submissions.', { allowedMimeTypes: env.upload.allowedMimeTypes }, 'UPLOAD_TYPE_BLOCKED'));
  }
  if (!extension || ['.exe', '.bat', '.cmd', '.msi', '.js', '.vbs', '.ps1', '.sh'].includes(extension)) {
    return next(new ApiError(415, 'Executable or script files are not allowed.', undefined, 'UPLOAD_EXTENSION_BLOCKED'));
  }

  const fingerprint = uploadFingerprint({
    ...body,
    fileName,
    mimeType,
    sizeBytes,
    ownerId: body.ownerId || req.headers['x-user-id'],
  });
  const duplicateKey = `upload:${fingerprint}`;
  const now = Date.now();
  const existing = duplicateUploads.get(duplicateKey);

  if (existing && existing > now) {
    return next(new ApiError(409, 'This file was already submitted recently. Please wait before uploading it again.', undefined, 'DUPLICATE_UPLOAD'));
  }

  duplicateUploads.set(duplicateKey, now + 10 * 60_000);
  req.uploadMetadata = {
    ...body,
    submissionMode,
    fileName,
    mimeType,
    sizeBytes,
    extension,
    fingerprint,
  };

  return next();
}
