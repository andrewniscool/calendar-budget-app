import { z } from 'zod';
import { badRequest } from './errors.js';

const positiveId = z.coerce.number().int().positive();
const nonEmptyText = (label, max) => z.string().trim().min(1, `${label} is required`).max(max);
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, 'Time must use HH:mm format');
const date = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Date must be valid');
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a six-digit hex value');
const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z.string().min(8).max(72);
const accountToken = z.string().min(32).max(200);
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Period must use YYYY-MM format');
const amount = z.coerce.number()
  .nonnegative()
  .max(999_999_999_999.99)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6,
    'Amount must use at most two decimal places'
  );
const timezone = z.string().trim().min(1).max(64).refine((value) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}, 'Timezone must be a valid IANA timezone');
const currency = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, 'Currency must be a three-letter ISO code');
const recurrenceFrequency = z.enum(['daily', 'weekly', 'monthly']);
const strictObject = (shape) => z.object(shape).strict();

function daysBetween(start, end) {
  return (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000;
}

export const schemas = {
  register: strictObject({
    username: nonEmptyText('Username', 50).min(3, 'Username must be at least 3 characters'),
    email,
    password,
  }),
  login: strictObject({
    email,
    password: z.string().min(1).max(72),
  }),
  verifyEmail: strictObject({ token: accountToken }),
  emailOnly: strictObject({ email }),
  resetPassword: strictObject({ token: accountToken, password }),
  calendarCreate: strictObject({
    name: nonEmptyText('Calendar name', 100),
  }),
  categoryQuery: strictObject({ calendarId: positiveId }),
  categoryCreate: strictObject({
    name: nonEmptyText('Category name', 100),
    color,
    calendarId: positiveId,
  }),
  categoryUpdate: strictObject({
    name: nonEmptyText('Category name', 100),
    color,
    calendarId: positiveId,
  }),
  eventQuery: strictObject({
    calendarId: positiveId,
    startDate: date.optional(),
    endDate: date.optional(),
  }).refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  }).refine((value) => !value.startDate || !value.endDate || daysBetween(value.startDate, value.endDate) <= 366, {
    message: 'Event date range cannot exceed 366 days',
    path: ['endDate'],
  }),
  eventCreate: strictObject({
    title: nonEmptyText('Title', 200),
    date,
    timeStart: time,
    timeEnd: time,
    categoryId: positiveId.nullish(),
    budget: amount.default(0),
    calendarId: positiveId,
  }).refine((value) => value.timeEnd > value.timeStart, {
    message: 'timeEnd must be after timeStart',
    path: ['timeEnd'],
  }),
  eventUpdate: strictObject({
    title: nonEmptyText('Title', 200),
    date,
    timeStart: time,
    timeEnd: time,
    categoryId: positiveId.nullish(),
    budget: amount.default(0),
    calendarId: positiveId.optional(),
  }).refine((value) => value.timeEnd > value.timeStart, {
    message: 'timeEnd must be after timeStart',
    path: ['timeEnd'],
  }),
  idParams: strictObject({ id: positiveId }),
  budgetLimitQuery: strictObject({
    calendarId: positiveId,
    period: month,
  }),
  budgetLimitUpsert: strictObject({
    calendarId: positiveId,
    period: month,
    overall: amount.nullish(),
    categories: z.array(strictObject({
      categoryId: positiveId,
      amount,
    })).max(500).default([]),
  }).refine((value) => new Set(value.categories.map((item) => item.categoryId)).size === value.categories.length, {
    message: 'Budget category IDs must be unique',
    path: ['categories'],
  }),
  calendarSettings: strictObject({
    timezone,
    currency,
  }),
  recurringQuery: strictObject({ calendarId: positiveId }),
  recurringCreate: strictObject({
    calendarId: positiveId,
    categoryId: positiveId.nullish(),
    title: nonEmptyText('Title', 200),
    startDate: date,
    endDate: date.nullish(),
    timeStart: time,
    timeEnd: time,
    budget: amount.default(0),
    frequency: recurrenceFrequency,
    interval: z.coerce.number().int().positive().max(365).default(1),
  }).refine((value) => value.timeEnd > value.timeStart, {
    message: 'timeEnd must be after timeStart',
    path: ['timeEnd'],
  }).refine((value) => !value.endDate || value.endDate >= value.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  }),
  recurringUpdate: strictObject({
    calendarId: positiveId,
    categoryId: positiveId.nullish(),
    title: nonEmptyText('Title', 200),
    startDate: date,
    endDate: date.nullish(),
    timeStart: time,
    timeEnd: time,
    budget: amount.default(0),
    frequency: recurrenceFrequency,
    interval: z.coerce.number().int().positive().max(365).default(1),
  }).refine((value) => value.timeEnd > value.timeStart, {
    message: 'timeEnd must be after timeStart',
    path: ['timeEnd'],
  }).refine((value) => !value.endDate || value.endDate >= value.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  }),
};

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(', ');
      return next(badRequest(message));
    }
    if (source === 'query') {
      Object.defineProperty(req, 'query', {
        configurable: true,
        enumerable: true,
        value: result.data,
      });
    } else {
      req[source] = result.data;
    }
    next();
  };
}
