import crypto from 'node:crypto';

export function requestContext({ logRequests = true } = {}) {
  return (req, res, next) => {
    const requestId = req.get('x-request-id') || crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    if (!logRequests) return next();

    const started = Date.now();
    res.on('finish', () => {
      console.log(JSON.stringify({
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - started,
      }));
    });
    next();
  };
}
