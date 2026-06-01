import { ApiError } from './apiError.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedCollections = new Set(['accounts', 'modules', 'assessments', 'students', 'grades', 'notices', 'supportTickets']);
const allowedStatuses = new Set(['draft', 'published', 'archived', 'active', 'pending', 'released', 'submitted', 'graded']);

function requireString(payload, field, label = field) {
  if (!String(payload[field] || '').trim()) {
    throw new ApiError(400, `${label} is required.`, { field }, 'VALIDATION_ERROR');
  }
}

function optionalNumber(payload, field, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (payload[field] === undefined || payload[field] === null || payload[field] === '') return;
  const value = Number(payload[field]);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new ApiError(400, `${field} must be a number between ${min} and ${max}.`, { field }, 'VALIDATION_ERROR');
  }
}

export function assertAllowedCollection(collection) {
  if (!allowedCollections.has(collection)) {
    throw new ApiError(404, 'Unknown collection.', { collection }, 'UNKNOWN_COLLECTION');
  }
}

export function validateCollectionPayload(collection, payload = {}) {
  assertAllowedCollection(collection);

  if (collection === 'accounts') {
    requireString(payload, 'email', 'Email');
    if (!emailPattern.test(String(payload.email))) {
      throw new ApiError(400, 'Enter a valid email address.', { field: 'email' }, 'VALIDATION_ERROR');
    }
    requireString(payload, 'name', 'Name');
  }

  if (collection === 'modules') {
    requireString(payload, 'title', 'Module title');
    optionalNumber(payload, 'hours', 0, 100);
  }

  if (collection === 'assessments') {
    requireString(payload, 'title', 'Assessment title');
    optionalNumber(payload, 'timeLimit', 1, 240);
    optionalNumber(payload, 'passingScore', 0, 100);
    if (payload.status && !allowedStatuses.has(String(payload.status).toLowerCase())) {
      throw new ApiError(400, 'Assessment status is invalid.', { field: 'status' }, 'VALIDATION_ERROR');
    }
  }

  if (collection === 'students') {
    requireString(payload, 'studentId', 'Student ID');
    requireString(payload, 'email', 'Email');
    if (!emailPattern.test(String(payload.email))) {
      throw new ApiError(400, 'Enter a valid student email address.', { field: 'email' }, 'VALIDATION_ERROR');
    }
  }

  if (collection === 'grades') {
    requireString(payload, 'studentId', 'Student ID');
    ['prelim', 'midterm', 'final', 'score'].forEach((field) => optionalNumber(payload, field, 0, 100));
  }

  if (collection === 'notices') {
    requireString(payload, 'title', 'Notice title');
    requireString(payload, 'message', 'Notice message');
  }

  if (collection === 'supportTickets') {
    requireString(payload, 'message', 'Support message');
  }
}

export function validateAssessmentSubmission(payload = {}) {
  requireString(payload, 'assessmentId', 'Assessment ID');
  requireString(payload, 'studentId', 'Student ID');
  if (payload.answers !== undefined && (typeof payload.answers !== 'object' || payload.answers === null)) {
    throw new ApiError(400, 'Assessment answers must be an object.', { field: 'answers' }, 'VALIDATION_ERROR');
  }
}
