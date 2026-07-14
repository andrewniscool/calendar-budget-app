import crypto from 'node:crypto';

export function requestContext({ logger, logRequests = true } = {}) {
  return (req, res, next) => {
    const requestId = crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    if (!logRequests) return next();

    const started = Date.now();
    res.on('finish', () => {
      logger.info('http.request', {
        requestId,
        method: req.method,
        route: req.route?.path ?? 'unmatched',
        status: res.statusCode,
        durationMs: Date.now() - started,
      });
    });
    next();
  };
}
