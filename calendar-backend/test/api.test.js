import bcrypt from 'bcrypt';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createPool } from '../src/db.js';
import { getConfig } from '../src/config.js';

const databaseUrl = 'postgres://calendar_test_user:calendar_test_password@127.0.0.1:5433/calendar_test_db';
const testPassword = 'test-password';
const baseConfig = {
  NODE_ENV: 'test',
  PORT: 3001,
  DATABASE_URL: databaseUrl,
  JWT_SECRET: 'test-jwt-secret-that-is-at-least-thirty-two-characters',
  CSRF_SECRET: 'test-csrf-secret-that-is-at-least-thirty-two-characters',
  CORS_ORIGINS: 'http://localhost:5173',
  APP_ORIGIN: 'http://localhost:5173',
  AUTH_RATE_LIMIT_MAX: 1000,
  ACCESS_TOKEN_TTL_MINUTES: 15,
  REFRESH_TOKEN_TTL_DAYS: 30,
  VERIFICATION_TOKEN_TTL_HOURS: 24,
  RESET_TOKEN_TTL_MINUTES: 60,
  LOCKOUT_ATTEMPTS: 5,
  LOCKOUT_MINUTES: 15,
  COOKIE_SECURE: 'false',
  MAIL_MODE: 'log',
};

let db;
let app;
let sentMail;

function createTestApp(overrides = {}) {
  return createApp({
    db,
    config: getConfig({ ...baseConfig, ...overrides }),
    mailService: {
      async sendVerification(email, token) {
        sentMail.push({ type: 'verification', email, token });
      },
      async sendPasswordReset(email, token) {
        sentMail.push({ type: 'reset', email, token });
      },
    },
  });
}

async function csrf(agent) {
  const response = await agent.get('/auth/csrf').expect(200);
  return response.body.csrfToken;
}

function post(agent, url, body, csrfToken) {
  return agent.post(url).set('X-CSRF-Token', csrfToken).send(body);
}

async function registerVerifyLogin(username = 'test-user', email = `${username}@example.com`) {
  const agent = request.agent(app);
  let csrfToken = await csrf(agent);
  await post(agent, '/auth/register', { username, email, password: testPassword }, csrfToken)
    .expect(202);
  const verification = sentMail.find((mail) => mail.type === 'verification' && mail.email === email);
  await post(agent, '/auth/verify-email', { token: verification.token }, csrfToken).expect(200);
  const login = await post(agent, '/auth/login', { email, password: testPassword }, csrfToken)
    .expect(200);
  csrfToken = login.headers['set-cookie']
    .find((cookie) => cookie.startsWith('cb_csrf='))
    .match(/^cb_csrf=([^;]+)/)[1];
  return { agent, csrfToken: decodeURIComponent(csrfToken), login };
}

async function createCalendar(session, name = 'Primary') {
  const response = await post(
    session.agent,
    '/calendars',
    { name },
    session.csrfToken
  ).expect(201);
  return response.body;
}

beforeAll(() => {
  db = createPool(databaseUrl);
  app = createTestApp();
});

beforeEach(async () => {
  sentMail = [];
  await db.query(
    'TRUNCATE account_tokens, refresh_tokens, events, categories, calendars, users RESTART IDENTITY CASCADE'
  );
});

afterAll(async () => {
  await db.end();
});

describe('security middleware and configuration', () => {
  it('reports health and rejects missing security configuration', async () => {
    await request(app).get('/health/live').expect(200, { status: 'ok' });
    await request(app).get('/health/ready').expect(200, { status: 'ready' });
    expect(() => getConfig({ NODE_ENV: 'test' })).toThrow('Invalid environment configuration');
  });

  it('requires a valid matching CSRF token and rejects disallowed origins', async () => {
    const agent = request.agent(app);
    const token = await csrf(agent);
    await agent.post('/auth/login').send({ email: 'x@example.com', password: testPassword }).expect(403);
    await agent.post('/auth/login')
      .set('X-CSRF-Token', `${token}forged`)
      .send({ email: 'x@example.com', password: testPassword })
      .expect(403);
    await agent.post('/auth/login')
      .set('Origin', 'https://example.com')
      .set('X-CSRF-Token', token)
      .send({ email: 'x@example.com', password: testPassword })
      .expect(403);
  });
});

describe('registration, verification, and legacy enrollment', () => {
  it('requires verification before login and consumes verification tokens once', async () => {
    const agent = request.agent(app);
    const token = await csrf(agent);
    await post(agent, '/auth/register', {
      username: 'new-user',
      email: 'New.User@example.com',
      password: testPassword,
    }, token).expect(202);

    await post(agent, '/auth/login', {
      email: 'new.user@example.com',
      password: testPassword,
    }, token).expect(401);

    const verification = sentMail[0];
    await post(agent, '/auth/verify-email', { token: verification.token }, token).expect(200);
    await post(agent, '/auth/verify-email', { token: verification.token }, token).expect(401);

    const stored = await db.query(
      'SELECT email, email_verified_at, password FROM users WHERE username = $1',
      ['new-user']
    );
    expect(stored.rows[0].email).toBe('new.user@example.com');
    expect(stored.rows[0].email_verified_at).not.toBeNull();
    expect(stored.rows[0].password).not.toBe(testPassword);
  });

  it('returns generic resend/reset-request responses and replaces older account tokens', async () => {
    const agent = request.agent(app);
    const token = await csrf(agent);
    await post(agent, '/auth/resend-verification', { email: 'missing@example.com' }, token).expect(202);
    await post(agent, '/auth/forgot-password', { email: 'missing@example.com' }, token).expect(202);

    await post(agent, '/auth/register', {
      username: 'replace-user',
      email: 'replace@example.com',
      password: testPassword,
    }, token).expect(202);
    const first = sentMail.at(-1).token;
    await post(agent, '/auth/resend-verification', { email: 'replace@example.com' }, token).expect(202);
    const second = sentMail.at(-1).token;
    await post(agent, '/auth/verify-email', { token: first }, token).expect(401);
    await post(agent, '/auth/verify-email', { token: second }, token).expect(200);
  });

  it('enrolls and verifies an email for a preserved username-only account', async () => {
    const passwordHash = await bcrypt.hash(testPassword, 12);
    await db.query('INSERT INTO users (username, password) VALUES ($1, $2)', [
      'legacy-user',
      passwordHash,
    ]);
    const agent = request.agent(app);
    const token = await csrf(agent);
    await post(agent, '/auth/legacy-email', {
      username: 'legacy-user',
      password: testPassword,
      email: 'legacy@example.com',
    }, token).expect(202);
    expect(sentMail[0]).toMatchObject({ type: 'verification', email: 'legacy@example.com' });
  });
});

describe('sessions, lockout, and recovery', () => {
  it('sets secure cookie attributes without returning tokens and authenticates resources', async () => {
    const session = await registerVerifyLogin();
    expect(session.login.body).toEqual({
      user: {
        id: 1,
        username: 'test-user',
        email: 'test-user@example.com',
        emailVerified: true,
      },
    });
    const cookies = session.login.headers['set-cookie'].join('\n');
    expect(cookies).toContain('cb_access=');
    expect(cookies).toContain('cb_refresh=');
    expect(cookies).toContain('HttpOnly');
    expect(cookies).toContain('SameSite=Lax');
    expect(cookies).not.toContain('Secure');
    await session.agent.get('/calendars').expect(200, []);
  });

  it('locks after five failures, uses generic errors, and allows login after expiry', async () => {
    const setup = await registerVerifyLogin('lock-user', 'lock@example.com');
    await post(setup.agent, '/auth/logout', null, setup.csrfToken).expect(200);
    const agent = request.agent(app);
    const token = await csrf(agent);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await post(agent, '/auth/login', {
        email: 'lock@example.com',
        password: 'wrong-password',
      }, token).expect(401);
      expect(response.body.message).toBe('Invalid credentials');
    }
    await post(agent, '/auth/login', {
      email: 'lock@example.com',
      password: testPassword,
    }, token).expect(401);

    await db.query(
      `UPDATE users SET locked_until = CURRENT_TIMESTAMP - INTERVAL '1 second'
       WHERE email = 'lock@example.com'`
    );
    await post(agent, '/auth/login', {
      email: 'lock@example.com',
      password: testPassword,
    }, token).expect(200);
  });

  it('rotates refresh tokens and revokes the family when an old token is replayed', async () => {
    const session = await registerVerifyLogin('rotate-user', 'rotate@example.com');
    const loginCookies = session.login.headers['set-cookie'];
    const oldRefresh = loginCookies.find((cookie) => cookie.startsWith('cb_refresh=')).split(';')[0];
    const csrfPair = loginCookies.find((cookie) => cookie.startsWith('cb_csrf=')).split(';')[0];

    const rotated = await request(app).post('/auth/refresh')
      .set('Cookie', `${oldRefresh}; ${csrfPair}`)
      .set('X-CSRF-Token', session.csrfToken)
      .expect(200);
    const newRefresh = rotated.headers['set-cookie']
      .find((cookie) => cookie.startsWith('cb_refresh='))
      .split(';')[0];
    const newCsrf = rotated.headers['set-cookie']
      .find((cookie) => cookie.startsWith('cb_csrf='))
      .split(';')[0];
    const newCsrfValue = decodeURIComponent(newCsrf.split('=')[1]);

    await request(app).post('/auth/refresh')
      .set('Cookie', `${oldRefresh}; ${csrfPair}`)
      .set('X-CSRF-Token', session.csrfToken)
      .expect(401);
    await request(app).post('/auth/refresh')
      .set('Cookie', `${newRefresh}; ${newCsrf}`)
      .set('X-CSRF-Token', newCsrfValue)
      .expect(401);
  });

  it('resets passwords once and revokes every existing session', async () => {
    const first = await registerVerifyLogin('reset-user', 'reset@example.com');
    const secondAgent = request.agent(app);
    let secondCsrf = await csrf(secondAgent);
    const secondLogin = await post(secondAgent, '/auth/login', {
      email: 'reset@example.com',
      password: testPassword,
    }, secondCsrf).expect(200);
    secondCsrf = decodeURIComponent(
      secondLogin.headers['set-cookie']
        .find((cookie) => cookie.startsWith('cb_csrf='))
        .match(/^cb_csrf=([^;]+)/)[1]
    );

    await post(first.agent, '/auth/forgot-password', { email: 'reset@example.com' }, first.csrfToken)
      .expect(202);
    const resetToken = sentMail.find((mail) => mail.type === 'reset').token;
    await post(first.agent, '/auth/reset-password', {
      token: resetToken,
      password: 'new-test-password',
    }, first.csrfToken).expect(200);
    await post(first.agent, '/auth/reset-password', {
      token: resetToken,
      password: 'another-password',
    }, first.csrfToken).expect(401);

    await post(secondAgent, '/auth/refresh', null, secondCsrf).expect(401);
    await first.agent.get('/auth/session').expect(401);
  });
});

describe('tenant resources with cookie authentication', () => {
  it('isolates calendars and supports authenticated create/delete behavior', async () => {
    const first = await registerVerifyLogin('first-user', 'first@example.com');
    const second = await registerVerifyLogin('second-user', 'second@example.com');
    const calendar = await createCalendar(first);

    await second.agent.delete(`/calendars/${calendar.calendar_id}`)
      .set('X-CSRF-Token', second.csrfToken)
      .expect(404);
    await second.agent.get('/calendars').expect(200, []);
  });

  it('retains category/calendar constraints for authenticated event writes', async () => {
    const session = await registerVerifyLogin('event-user', 'event@example.com');
    const first = await createCalendar(session, 'First');
    const second = await createCalendar(session, 'Second');
    const category = await post(session.agent, '/categories', {
      calendarId: second.calendar_id,
      name: 'Other',
      color: '#123456',
    }, session.csrfToken).expect(201);

    await post(session.agent, '/events', {
      calendarId: first.calendar_id,
      categoryId: category.body.category_id,
      title: 'Invalid category',
      date: '2026-06-08',
      timeStart: '09:00',
      timeEnd: '10:00',
      budget: 10,
    }, session.csrfToken).expect(400);
  });
});
