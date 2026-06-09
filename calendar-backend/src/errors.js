export class AppError extends Error {
  constructor(status, code, message, options = {}) {
    super(message, options);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message) => new AppError(400, 'BAD_REQUEST', message);
export const unauthorized = (message = 'Unauthorized') => new AppError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'Forbidden') => new AppError(403, 'FORBIDDEN', message);
export const notFound = (message) => new AppError(404, 'NOT_FOUND', message);
export const conflict = (message) => new AppError(409, 'CONFLICT', message);

export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Route not found',
    message: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
  });
}

export function errorHandler(error, req, res, _next) {
  let status = error instanceof AppError ? error.status : 500;
  let message = error instanceof AppError ? error.message : 'Internal server error';
  let code = error instanceof AppError ? error.code : 'INTERNAL_ERROR';

  if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
    code = 'BAD_REQUEST';
  } else if (error.type === 'entity.too.large' || error.status === 413) {
    status = 413;
    message = 'Request body is too large';
    code = 'PAYLOAD_TOO_LARGE';
  }

  if (status >= 500) {
    console.error(`${req.method} ${req.path}`, error);
  }

  res.status(status).json({ error: message, message, code });
}
