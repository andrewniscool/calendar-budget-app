import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createPool } from '../src/db.js';
import { getConfig } from '../src/config.js';
import { createMailOutboxRepository } from '../src/repositories/mailOutboxRepository.js';

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
  GLOBAL_RATE_LIMIT_MAX: 100000,
  SENSITIVE_RATE_LIMIT_MAX: 1000,
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
function createTestApp(overrides = {}) {
  return createApp({
    db,
    config: getConfig({ ...baseConfig, ...overrides }),
  });
}

async function latestMail(type, recipient) {
  const result = await db.query(
    `SELECT type, recipient, payload
     FROM mail_outbox
     WHERE type = $1 AND recipient = $2
     ORDER BY id DESC LIMIT 1`,
    [type, recipient]
  );
  return result.rows[0];
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
  const verification = await latestMail('email_verification', email);
  await post(agent, '/auth/verify-email', { token: verification.payload.token }, csrfToken).expect(200);
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
  await db.query(
    'TRUNCATE mail_outbox, account_tokens, refresh_tokens, recurring_events, budget_limits, calendar_settings, events, categories, calendars, users RESTART IDENTITY CASCADE'
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

  it('rejects malformed and oversized JSON and reports failed readiness', async () => {
    await request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{broken')
      .expect(400);
    await request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ padding: 'x'.repeat(110_000) }))
      .expect(413);

    const unavailable = createApp({
      db: { query: async () => { throw new Error('database unavailable'); } },
      config: getConfig(baseConfig),
      logger: { info() {}, warn() {}, error() {} },
    });
    await request(unavailable).get('/health/live').expect(200);
    await request(unavailable).get('/health/ready').expect(500);
  });

  it('applies the global limit with standard rate-limit headers', async () => {
    const limited = createTestApp({ GLOBAL_RATE_LIMIT_MAX: 1 });
    await request(limited).get('/health/live').expect(200);
    const response = await request(limited).get('/health/live').expect(429);
    expect(response.headers).toHaveProperty('ratelimit');
    expect(response.body.code).toBe('RATE_LIMITED');
  });
});

describe('registration and verification', () => {
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

    const verification = await latestMail('email_verification', 'new.user@example.com');
    await post(agent, '/auth/verify-email', { token: verification.payload.token }, token).expect(200);
    await post(agent, '/auth/verify-email', { token: verification.payload.token }, token).expect(401);

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
    const first = (await latestMail('email_verification', 'replace@example.com')).payload.token;
    await post(agent, '/auth/resend-verification', { email: 'replace@example.com' }, token).expect(202);
    const throttledCount = await db.query(
      `SELECT COUNT(*)::integer AS count FROM mail_outbox
       WHERE recipient = 'replace@example.com' AND type = 'email_verification'`
    );
    expect(throttledCount.rows[0].count).toBe(1);
    await db.query(
      `UPDATE account_tokens SET created_at = CURRENT_TIMESTAMP - INTERVAL '6 minutes'
       WHERE user_id = (SELECT id FROM users WHERE email = 'replace@example.com')`
    );
    await post(agent, '/auth/resend-verification', { email: 'replace@example.com' }, token).expect(202);
    const second = (await latestMail('email_verification', 'replace@example.com')).payload.token;
    await post(agent, '/auth/verify-email', { token: first }, token).expect(401);
    await post(agent, '/auth/verify-email', { token: second }, token).expect(200);
  });

  it('creates the account, verification token, and mail job atomically', async () => {
    const agent = request.agent(app);
    const token = await csrf(agent);
    const payload = { username: 'atomic-user', email: 'atomic@example.com', password: testPassword };
    await post(agent, '/auth/register', payload, token).expect(202);
    await post(agent, '/auth/register', payload, token).expect(409);
    const result = await db.query(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE email = 'atomic@example.com')::integer AS users,
         (SELECT COUNT(*) FROM account_tokens)::integer AS tokens,
         (SELECT COUNT(*) FROM mail_outbox)::integer AS jobs`
    );
    expect(result.rows[0]).toEqual({ users: 1, tokens: 1, jobs: 1 });
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
    const resetToken = (await latestMail('password_reset', 'reset@example.com')).payload.token;
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

  it('filters events by date range while preserving all-events fallback', async () => {
    const session = await registerVerifyLogin('range-user', 'range@example.com');
    const calendar = await createCalendar(session);

    for (const event of [
      ['Before', '2026-06-01'],
      ['Inside', '2026-06-08'],
      ['After', '2026-06-30'],
    ]) {
      await post(session.agent, '/events', {
        calendarId: calendar.calendar_id,
        title: event[0],
        date: event[1],
        timeStart: '09:00',
        timeEnd: '10:00',
        budget: 10,
      }, session.csrfToken).expect(201);
    }

    const allEvents = await session.agent
      .get(`/events?calendarId=${calendar.calendar_id}`)
      .expect(200);
    expect(allEvents.body.map((event) => event.title)).toEqual(['Before', 'Inside', 'After']);

    const filtered = await session.agent
      .get(`/events?calendarId=${calendar.calendar_id}&startDate=2026-06-05&endDate=2026-06-15`)
      .expect(200);
    expect(filtered.body).toHaveLength(1);
    expect(filtered.body[0].title).toBe('Inside');
  });

  it('requires a bounded query after one thousand events and rejects oversized ranges', async () => {
    const session = await registerVerifyLogin('large-user', 'large@example.com');
    const calendar = await createCalendar(session);
    await db.query(
      `INSERT INTO events (calendar_id, title, date, time_start, time_end, budget)
       SELECT $1, 'Generated ' || value, DATE '2026-01-01', TIME '09:00', TIME '10:00', 0
       FROM GENERATE_SERIES(1, 1001) AS value`,
      [calendar.calendar_id]
    );

    const unbounded = await session.agent
      .get(`/events?calendarId=${calendar.calendar_id}`)
      .expect(400);
    expect(unbounded.body.code).toBe('DATE_RANGE_REQUIRED');
    await session.agent
      .get(`/events?calendarId=${calendar.calendar_id}&startDate=2025-01-01&endDate=2026-01-03`)
      .expect(400);
  });

  it('stores budget limits for an overall month and category-specific limits', async () => {
    const session = await registerVerifyLogin('budget-user', 'budget@example.com');
    const calendar = await createCalendar(session);
    const category = await post(session.agent, '/categories', {
      calendarId: calendar.calendar_id,
      name: 'Food',
      color: '#123456',
    }, session.csrfToken).expect(201);

    const saved = await session.agent
      .put('/budget-limits')
      .set('X-CSRF-Token', session.csrfToken)
      .send({
        calendarId: calendar.calendar_id,
        period: '2026-06',
        overall: 1000,
        categories: [{ categoryId: category.body.category_id, amount: 250.5 }],
      })
      .expect(200);

    expect(saved.body).toEqual({
      calendarId: calendar.calendar_id,
      period: '2026-06',
      overall: 1000,
      categories: [{ categoryId: category.body.category_id, amount: 250.5 }],
    });

    const listed = await session.agent
      .get(`/budget-limits?calendarId=${calendar.calendar_id}&period=2026-06`)
      .expect(200);
    expect(listed.body).toEqual(saved.body);
  });

  it('keeps budget limits tenant-scoped and rejects categories from another calendar', async () => {
    const session = await registerVerifyLogin('budget-scope-user', 'budget-scope@example.com');
    const first = await createCalendar(session, 'First');
    const second = await createCalendar(session, 'Second');
    const category = await post(session.agent, '/categories', {
      calendarId: second.calendar_id,
      name: 'Other',
      color: '#123456',
    }, session.csrfToken).expect(201);

    await session.agent
      .put('/budget-limits')
      .set('X-CSRF-Token', session.csrfToken)
      .send({
        calendarId: first.calendar_id,
        period: '2026-06',
        categories: [{ categoryId: category.body.category_id, amount: 50 }],
      })
      .expect(400);
  });

  it('rolls back the full budget batch when any category is invalid', async () => {
    const session = await registerVerifyLogin('rollback-user', 'rollback@example.com');
    const calendar = await createCalendar(session);
    const category = await post(session.agent, '/categories', {
      calendarId: calendar.calendar_id,
      name: 'Valid',
      color: '#123456',
    }, session.csrfToken).expect(201);

    await session.agent.put('/budget-limits')
      .set('X-CSRF-Token', session.csrfToken)
      .send({
        calendarId: calendar.calendar_id,
        period: '2026-07',
        overall: 1000,
        categories: [
          { categoryId: category.body.category_id, amount: 100 },
          { categoryId: 999999, amount: 50 },
        ],
      })
      .expect(400);
    const stored = await db.query('SELECT COUNT(*)::integer AS count FROM budget_limits');
    expect(stored.rows[0].count).toBe(0);
  });

  it('rejects duplicate budget categories and unknown request fields', async () => {
    const session = await registerVerifyLogin('validation-user', 'validation@example.com');
    const calendar = await createCalendar(session);
    await post(session.agent, '/calendars', { name: 'Extra', unknown: true }, session.csrfToken)
      .expect(400);
    await session.agent.put('/budget-limits')
      .set('X-CSRF-Token', session.csrfToken)
      .send({
        calendarId: calendar.calendar_id,
        period: '2026-07',
        categories: [{ categoryId: 1, amount: 10 }, { categoryId: 1, amount: 20 }],
      })
      .expect(400);
  });

  it('returns default calendar settings and updates timezone/currency', async () => {
    const session = await registerVerifyLogin('settings-user', 'settings@example.com');
    const calendar = await createCalendar(session);

    const defaults = await session.agent
      .get(`/calendars/${calendar.calendar_id}/settings`)
      .expect(200);
    expect(defaults.body).toEqual({
      calendar_id: calendar.calendar_id,
      timezone: 'America/New_York',
      currency: 'USD',
    });

    const updated = await session.agent
      .put(`/calendars/${calendar.calendar_id}/settings`)
      .set('X-CSRF-Token', session.csrfToken)
      .send({ timezone: 'America/Los_Angeles', currency: 'cad' })
      .expect(200);
    expect(updated.body).toEqual({
      calendar_id: calendar.calendar_id,
      timezone: 'America/Los_Angeles',
      currency: 'CAD',
    });
  });

  it('stores recurring event definitions without expanding occurrences', async () => {
    const session = await registerVerifyLogin('recurring-user', 'recurring@example.com');
    const calendar = await createCalendar(session);
    const category = await post(session.agent, '/categories', {
      calendarId: calendar.calendar_id,
      name: 'Bills',
      color: '#654321',
    }, session.csrfToken).expect(201);

    const created = await post(session.agent, '/recurring-events', {
      calendarId: calendar.calendar_id,
      categoryId: category.body.category_id,
      title: 'Rent',
      startDate: '2026-06-01',
      endDate: '2026-12-01',
      timeStart: '08:00',
      timeEnd: '09:00',
      budget: 1200,
      frequency: 'monthly',
      interval: 1,
    }, session.csrfToken).expect(201);

    expect(created.body).toMatchObject({
      calendar_id: calendar.calendar_id,
      category_id: category.body.category_id,
      title: 'Rent',
      frequency: 'monthly',
      interval_count: 1,
    });

    const listed = await session.agent
      .get(`/recurring-events?calendarId=${calendar.calendar_id}`)
      .expect(200);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].title).toBe('Rent');

    const updated = await session.agent
      .put(`/recurring-events/${created.body.id}`)
      .set('X-CSRF-Token', session.csrfToken)
      .send({
        calendarId: calendar.calendar_id,
        categoryId: category.body.category_id,
        title: 'Rent adjusted',
        startDate: '2026-06-01',
        endDate: '2026-12-01',
        timeStart: '08:00',
        timeEnd: '09:00',
        budget: 1250,
        frequency: 'monthly',
        interval: 1,
      })
      .expect(200);
    expect(updated.body.title).toBe('Rent adjusted');

    await session.agent
      .delete(`/recurring-events/${created.body.id}`)
      .set('X-CSRF-Token', session.csrfToken)
      .expect(200);
    await session.agent
      .get(`/recurring-events?calendarId=${calendar.calendar_id}`)
      .expect(200, []);
  });

  it('enforces calendar, category, and recurring-definition quotas', async () => {
    const session = await registerVerifyLogin('quota-user', 'quota@example.com');
    const calendar = await createCalendar(session);
    const userId = session.login.body.user.id;

    await db.query(
      `INSERT INTO calendars (user_id, name)
       SELECT $1, 'Calendar ' || value FROM GENERATE_SERIES(1, 49) AS value`,
      [userId]
    );
    let response = await post(session.agent, '/calendars', { name: 'Too many' }, session.csrfToken)
      .expect(409);
    expect(response.body.code).toBe('LIMIT_REACHED');

    await db.query(
      `INSERT INTO categories (calendar_id, name, color)
       SELECT $1, 'Category ' || value, '#123456' FROM GENERATE_SERIES(1, 500) AS value`,
      [calendar.calendar_id]
    );
    response = await post(session.agent, '/categories', {
      calendarId: calendar.calendar_id,
      name: 'Too many',
      color: '#654321',
    }, session.csrfToken).expect(409);
    expect(response.body.code).toBe('LIMIT_REACHED');

    await db.query(
      `INSERT INTO recurring_events (
         calendar_id, title, start_date, time_start, time_end, budget, frequency, interval_count
       )
       SELECT $1, 'Recurring ' || value, DATE '2026-01-01', TIME '09:00', TIME '10:00', 0, 'daily', 1
       FROM GENERATE_SERIES(1, 500) AS value`,
      [calendar.calendar_id]
    );
    response = await post(session.agent, '/recurring-events', {
      calendarId: calendar.calendar_id,
      title: 'Too many',
      startDate: '2026-01-01',
      timeStart: '09:00',
      timeEnd: '10:00',
      frequency: 'daily',
      interval: 1,
    }, session.csrfToken).expect(409);
    expect(response.body.code).toBe('LIMIT_REACHED');
  });
});

describe('mail outbox coordination', () => {
  it('allows only one worker to claim a queued job', async () => {
    const agent = request.agent(app);
    const token = await csrf(agent);
    await post(agent, '/auth/register', {
      username: 'worker-user',
      email: 'worker@example.com',
      password: testPassword,
    }, token).expect(202);

    const first = createMailOutboxRepository(db);
    const second = createMailOutboxRepository(db);
    const claims = await Promise.all([first.claimBatch(10), second.claimBatch(10)]);
    expect(claims.flat()).toHaveLength(1);
  });

  it('redacts token payloads after successful delivery and terminal failure', async () => {
    const agent = request.agent(app);
    const token = await csrf(agent);
    await post(agent, '/auth/register', {
      username: 'redact-user',
      email: 'redact@example.com',
      password: testPassword,
    }, token).expect(202);
    const repository = createMailOutboxRepository(db);
    const [job] = await repository.claimBatch(1);
    await repository.markSent(job.id);
    let stored = await db.query('SELECT payload, sent_at FROM mail_outbox WHERE id = $1', [job.id]);
    expect(stored.rows[0].payload).toEqual({});
    expect(stored.rows[0].sent_at).not.toBeNull();

    await db.query(
      `INSERT INTO mail_outbox (type, recipient, payload, attempts, max_attempts)
       VALUES ('password_reset', 'terminal@example.com', '{"token":"secret"}', 7, 8)`
    );
    const [terminal] = await repository.claimBatch(1);
    await repository.markFailed(terminal, 'permanent failure', 3600);
    stored = await db.query('SELECT payload, failed_at FROM mail_outbox WHERE id = $1', [terminal.id]);
    expect(stored.rows[0].payload).toEqual({});
    expect(stored.rows[0].failed_at).not.toBeNull();
  });
});
