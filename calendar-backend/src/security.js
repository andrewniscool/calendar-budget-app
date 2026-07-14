import crypto from 'node:crypto';

export const ACCESS_COOKIE = 'cb_access';
export const REFRESH_COOKIE = 'cb_refresh';
export const CSRF_COOKIE = 'cb_csrf';

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

export function createCsrfToken(secret) {
  const value = randomToken();
  return `${value}.${sign(value, secret)}`;
}

export function verifyCsrfToken(token, secret) {
  if (typeof token !== 'string') return false;
  const separator = token.lastIndexOf('.');
  if (separator < 1) return false;
  const value = token.slice(0, separator);
  const supplied = Buffer.from(token.slice(separator + 1));
  const expected = Buffer.from(sign(value, secret));
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

export function parseCookies(header = '') {
  return header.split(';').reduce((cookies, item) => {
    const separator = item.indexOf('=');
    if (separator < 0) return cookies;
    const name = item.slice(0, separator).trim();
    const value = item.slice(separator + 1).trim();
    if (name) {
      try {
        cookies[name] = decodeURIComponent(value);
      } catch {
        // Ignore malformed cookie values instead of failing the entire request.
      }
    }
    return cookies;
  }, {});
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  parts.push(`Path=${options.path ?? '/'}`);
  return parts.join('; ');
}

export function authCookies(config, accessToken, refreshToken) {
  return [
    serializeCookie(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: 'Lax',
      path: '/',
      maxAge: config.ACCESS_TOKEN_TTL_MINUTES * 60,
    }),
    serializeCookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: 'Lax',
      path: '/auth',
      maxAge: config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
    }),
  ];
}

export function csrfCookie(config, token) {
  return serializeCookie(CSRF_COOKIE, token, {
    secure: config.cookieSecure,
    sameSite: 'Lax',
    path: '/',
    maxAge: config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  });
}

export function clearedAuthCookies(config) {
  return [
    serializeCookie(ACCESS_COOKIE, '', {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: 'Lax',
      path: '/',
      maxAge: 0,
    }),
    serializeCookie(REFRESH_COOKIE, '', {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: 'Lax',
      path: '/auth',
      maxAge: 0,
    }),
  ];
}
