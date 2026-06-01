export class ApiError extends Error {
  constructor(statusCode, message, details = undefined, code = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
  }
}

export function isOperationalError(error) {
  return error instanceof ApiError || Number.isInteger(error?.statusCode);
}
