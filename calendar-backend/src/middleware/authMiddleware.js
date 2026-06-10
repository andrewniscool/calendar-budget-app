import jwt from 'jsonwebtoken';
import { forbidden, unauthorized } from '../errors.js';
import {
  ACCESS_COOKIE,
  CSRF_COOKIE,
  parseCookies,
  verifyCsrfToken,
} from '../security.js';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function createAuthenticate(userRepository, config) {
  return async (req, _res, next) => {
    const token = parseCookies(req.get('cookie'))[ACCESS_COOKIE];
    if (!token) return next(unauthorized());

    try {
      const payload = jwt.verify(token, config.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'calendar-budget-api',
        audience: 'calendar-budget-web',
      });
      const user = await userRepository.findAuthUser(Number(payload.sub));
      if (
        !user
        || !user.email_verified_at
        || user.auth_version !== payload.ver
      ) {
        return next(unauthorized('Invalid or expired session'));
      }
      req.user = { id: user.id, username: user.username, email: user.email };
      next();
    } catch {
      next(unauthorized('Invalid or expired session'));
    }
  };
}

export function createCsrfProtection(config) {
  return (req, _res, next) => {
    if (!unsafeMethods.has(req.method)) return next();
    const origin = req.get('origin');
    if (origin && !config.corsOrigins.includes(origin)) {
      return next(forbidden('Origin not allowed'));
    }
    const cookieToken = parseCookies(req.get('cookie'))[CSRF_COOKIE];
    const headerToken = req.get('x-csrf-token');
    if (
      !cookieToken
      || !headerToken
      || cookieToken !== headerToken
      || !verifyCsrfToken(cookieToken, config.CSRF_SECRET)
    ) {
      return next(forbidden('Invalid CSRF token'));
    }
    next();
  };
}
