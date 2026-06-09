import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createPool } from '../src/db.js';
import { getConfig } from '../src/config.js';

const databaseUrl = 'postgres://calendar_test_user:calendar_test_password@127.0.0.1:5433/calendar_test_db';
const testUsername = 'test-user';
const testPassword = 'test-password';
const baseConfig = {
  NODE_ENV: 'test',
  PORT: 3001,
  DATABASE_URL: databaseUrl,
  JWT_SECRET: 'test-secret-that-is-at-least-thirty-two-characters',
  CORS_ORIGINS: 'http://localhost:5173',
  AUTH_RATE_LIMIT_MAX: 1000,
};

let db;
let app;

async function registerAndLogin(username) {
  await request(app).post('/register').send({ username, password: testPassword }).expect(201);
  const response = await request(app)
    .post('/login')
    .send({ username, password: testPassword })
    .expect(200);
  return response.body.token;
}

async function createCalendar(token, name = 'Primary') {
  const response = await request(app)
    .post('/calendars')
    .set('Authorization', `Bearer ${token}`)
    .send({ name })
    .expect(201);
  return response.body;
}

beforeAll(() => {
  db = createPool(databaseUrl);
  app = createApp({ db, config: getConfig(baseConfig) });
});

beforeEach(async () => {
  await db.query('TRUNCATE events, categories, calendars, users RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await db.end();
});

describe('health and configuration', () => {
  it('reports liveness and database readiness', async () => {
    await request(app).get('/health/live').expect(200, { status: 'ok' });
    await request(app).get('/health/ready').expect(200, { status: 'ready' });
  });

  it('rejects missing required configuration', () => {
    expect(() => getConfig({ NODE_ENV: 'test' })).toThrow('Invalid environment configuration');
  });

  it('returns useful client errors for malformed JSON and disallowed origins', async () => {
    const malformed = await request(app)
      .post('/login')
      .set('Content-Type', 'application/json')
      .send('{"username":')
      .expect(400);
    expect(malformed.body.code).toBe('BAD_REQUEST');

    const cors = await request(app)
      .get('/health/live')
      .set('Origin', 'https://example.com')
      .expect(403);
    expect(cors.body.code).toBe('FORBIDDEN');
  });
});

describe('authentication', () => {
  it('registers, hashes passwords, and returns a valid login token', async () => {
    const token = await registerAndLogin(testUsername);
    expect(token).toEqual(expect.any(String));

    const stored = await db.query('SELECT password FROM users WHERE username = $1', [testUsername]);
    expect(stored.rows[0].password).not.toBe(testPassword);
  });

  it('rejects invalid credentials and malformed bearer headers', async () => {
    await request(app).post('/register').send({
      username: testUsername,
      password: testPassword,
    }).expect(201);

    await request(app).post('/login').send({
      username: testUsername,
      password: 'incorrect-password',
    }).expect(401);

    await request(app).get('/calendars').set('Authorization', 'Token nope').expect(401);
  });

  it('rate limits repeated authentication attempts', async () => {
    const limitedApp = createApp({
      db,
      config: getConfig({ ...baseConfig, AUTH_RATE_LIMIT_MAX: 2 }),
    });

    await request(limitedApp).post('/login').send({ username: 'missing-user', password: testPassword }).expect(401);
    await request(limitedApp).post('/login').send({ username: 'missing-user', password: testPassword }).expect(401);
    const response = await request(limitedApp).post('/login').send({ username: 'missing-user', password: testPassword }).expect(429);
    expect(response.body.code).toBe('RATE_LIMITED');
  });
});

describe('tenant isolation and resource behavior', () => {
  it('isolates calendars between users and returns 404 for unauthorized resources', async () => {
    const firstToken = await registerAndLogin('first-user');
    const secondToken = await registerAndLogin('second-user');
    const calendar = await createCalendar(firstToken);

    await request(app)
      .delete(`/calendars/${calendar.calendar_id}`)
      .set('Authorization', `Bearer ${secondToken}`)
      .expect(404);

    const response = await request(app)
      .get('/calendars')
      .set('Authorization', `Bearer ${secondToken}`)
      .expect(200);
    expect(response.body).toEqual([]);
  });

  it('rejects categories from another calendar during event create and update', async () => {
    const token = await registerAndLogin('calendar-owner');
    const first = await createCalendar(token, 'First');
    const second = await createCalendar(token, 'Second');

    const category = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ calendarId: second.calendar_id, name: 'Other', color: '#123456' })
      .expect(201);

    const invalidEvent = {
      calendarId: first.calendar_id,
      categoryId: category.body.category_id,
      title: 'Invalid category',
      date: '2026-06-08',
      timeStart: '09:00',
      timeEnd: '10:00',
      budget: 10,
    };

    await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidEvent)
      .expect(400);

    const event = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...invalidEvent, categoryId: null })
      .expect(201);

    await request(app)
      .put(`/events/${event.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...invalidEvent, calendarId: undefined })
      .expect(400);
  });

  it('returns consistent event category metadata and nulls category on deletion', async () => {
    const token = await registerAndLogin('event-owner');
    const calendar = await createCalendar(token);
    const category = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ calendarId: calendar.calendar_id, name: 'Work', color: '#abcdef' })
      .expect(201);

    const event = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        calendarId: calendar.calendar_id,
        categoryId: category.body.category_id,
        title: 'Meeting',
        date: '2026-06-08',
        timeStart: '09:00',
        timeEnd: '10:00',
        budget: 5,
      })
      .expect(201);

    expect(event.body).toMatchObject({
      category_name: 'Work',
      category_color: '#abcdef',
    });

    await request(app)
      .delete(`/categories/${category.body.category_id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const events = await request(app)
      .get(`/events?calendarId=${calendar.calendar_id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(events.body[0].category_id).toBeNull();
  });

  it('validates event values and accurately reports missing bulk-delete calendars', async () => {
    const token = await registerAndLogin('validation-user');
    const calendar = await createCalendar(token);

    await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        calendarId: calendar.calendar_id,
        title: 'Backwards',
        date: '2026-06-08',
        timeStart: '10:00',
        timeEnd: '09:00',
        budget: -1,
      })
      .expect(400);

    await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        calendarId: calendar.calendar_id,
        title: 'Invalid date',
        date: '2026-99-99',
        timeStart: '09:00',
        timeEnd: '10:00',
        budget: 0,
      })
      .expect(400);

    await request(app)
      .delete('/categories/all?calendarId=99999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
