import jwt from 'jsonwebtoken';
import { unauthorized } from '../errors.js';

export function createAuthenticate(config) {
  return (req, _res, next) => {
    const match = req.get('authorization')?.match(/^Bearer ([^\s]+)$/);
    if (!match) return next(unauthorized());

    try {
      const payload = jwt.verify(match[1], config.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'calendar-budget-api',
        audience: 'calendar-budget-web',
      });
      req.user = { id: payload.id, username: payload.username };
      next();
    } catch {
      next(unauthorized('Invalid or expired token'));
    }
  };
}
