import { describe, expect, it, vi } from 'vitest';
import { getConfig } from '../src/config.js';
import { createCsrfToken, parseCookies, verifyCsrfToken } from '../src/security.js';
import { schemas } from '../src/validation.js';
import { createOutboxWorker } from '../src/services/outboxWorker.js';

const requiredConfig = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://user:password@localhost:5432/database',
  JWT_SECRET: 'a-secure-jwt-secret-that-is-long-enough',
  CSRF_SECRET: 'a-secure-csrf-secret-that-is-long-enough',
};

describe('configuration', () => {
  it('applies safe operational defaults', () => {
    const config = getConfig(requiredConfig);
    expect(config.DB_POOL_MAX).toBe(10);
    expect(config.DB_STATEMENT_TIMEOUT_MS).toBe(10_000);
    expect(config.GLOBAL_RATE_LIMIT_MAX).toBe(120);
    expect(config.TRUST_PROXY_HOPS).toBe(0);
  });

  it('requires secure cookies and SMTP in production', () => {
    expect(() => getConfig({ ...requiredConfig, NODE_ENV: 'production' }))
      .toThrow('COOKIE_SECURE must be true');
  });
});

describe('security helpers', () => {
  it('signs CSRF tokens and rejects tampering', () => {
    const token = createCsrfToken(requiredConfig.CSRF_SECRET);
    expect(verifyCsrfToken(token, requiredConfig.CSRF_SECRET)).toBe(true);
    expect(verifyCsrfToken(`${token}x`, requiredConfig.CSRF_SECRET)).toBe(false);
  });

  it('parses encoded cookie values', () => {
    expect(parseCookies('one=hello%20world; two=value')).toEqual({
      one: 'hello world',
      two: 'value',
    });
  });
});

describe('request schemas', () => {
  const validEvent = {
    title: 'Lunch',
    date: '2026-07-12',
    timeStart: '12:00',
    timeEnd: '13:00',
    budget: 12.34,
    calendarId: 1,
  };

  it('rejects unknown fields and fractional cents', () => {
    expect(schemas.eventCreate.safeParse({ ...validEvent, unexpected: true }).success).toBe(false);
    expect(schemas.eventCreate.safeParse({ ...validEvent, budget: 1.001 }).success).toBe(false);
    expect(schemas.eventCreate.safeParse(validEvent).success).toBe(true);
  });

  it('validates timezone, date windows, recurrence bounds, and duplicate categories', () => {
    expect(schemas.calendarSettings.safeParse({ timezone: 'Not/A_Timezone', currency: 'USD' }).success)
      .toBe(false);
    expect(schemas.calendarSettings.safeParse({ timezone: 'America/New_York', currency: 'usd' }).success)
      .toBe(true);
    expect(schemas.eventQuery.safeParse({
      calendarId: 1,
      startDate: '2025-01-01',
      endDate: '2026-01-03',
    }).success).toBe(false);
    expect(schemas.recurringCreate.safeParse({
      calendarId: 1,
      title: 'Rent',
      startDate: '2026-01-01',
      timeStart: '09:00',
      timeEnd: '10:00',
      frequency: 'monthly',
      interval: 366,
    }).success).toBe(false);
    expect(schemas.budgetLimitUpsert.safeParse({
      calendarId: 1,
      period: '2026-07',
      categories: [{ categoryId: 2, amount: 10 }, { categoryId: 2, amount: 20 }],
    }).success).toBe(false);
  });
});

describe('outbox worker', () => {
  it('marks successful jobs sent and redacts logging data', async () => {
    const repository = {
      claimBatch: vi.fn().mockResolvedValue([{ id: 1, type: 'password_reset', attempts: 1, max_attempts: 8 }]),
      markSent: vi.fn().mockResolvedValue(),
      markFailed: vi.fn().mockResolvedValue(),
    };
    const mailService = { sendJob: vi.fn().mockResolvedValue() };
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const worker = createOutboxWorker({ repository, mailService, logger });

    expect(await worker.processOnce()).toBe(1);
    expect(repository.markSent).toHaveBeenCalledWith(1);
    expect(logger.info).toHaveBeenCalledWith('mail.sent', {
      jobId: 1,
      type: 'password_reset',
      attempt: 1,
    });
  });

  it('uses exponential retry delays and marks terminal attempts', async () => {
    const job = { id: 2, type: 'email_verification', attempts: 8, max_attempts: 8 };
    const repository = {
      claimBatch: vi.fn().mockResolvedValue([job]),
      markSent: vi.fn(),
      markFailed: vi.fn().mockResolvedValue(),
    };
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const worker = createOutboxWorker({
      repository,
      mailService: { sendJob: vi.fn().mockRejectedValue(new Error('SMTP unavailable')) },
      logger,
    });

    await worker.processOnce();
    expect(repository.markFailed).toHaveBeenCalledWith(job, 'SMTP unavailable', 3_600);
    expect(logger.warn.mock.calls[0][1].terminal).toBe(true);
  });
});
