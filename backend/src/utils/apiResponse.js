export function sendSuccess(res, data, statusCode = 200, meta = undefined) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendCreated(res, data, meta = undefined) {
  return sendSuccess(res, data, 201, meta);
}

export function sendError(res, message, statusCode = 400, details = undefined) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(details ? { details } : {}),
  });
}
