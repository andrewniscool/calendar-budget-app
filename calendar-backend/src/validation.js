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

export const schemas = {
  register: z.object({
    username: nonEmptyText('Username', 50).min(3, 'Username must be at least 3 characters'),
    email,
    password,
  }),
  login: z.object({
    email,
    password: z.string().min(1).max(72),
  }),
  verifyEmail: z.object({ token: accountToken }),
  emailOnly: z.object({ email }),
  resetPassword: z.object({ token: accountToken, password }),
  legacyEmail: z.object({
    username: nonEmptyText('Username', 50),
    password: z.string().min(1).max(72),
    email,
  }),
  calendarCreate: z.object({
    name: nonEmptyText('Calendar name', 100),
  }),
  categoryQuery: z.object({ calendarId: positiveId }),
  categoryCreate: z.object({
    name: nonEmptyText('Category name', 100),
    color,
    calendarId: positiveId,
  }),
  categoryUpdate: z.object({
    name: nonEmptyText('Category name', 100),
    color,
    calendarId: positiveId,
  }),
  eventQuery: z.object({ calendarId: positiveId }),
  eventCreate: z.object({
    title: nonEmptyText('Title', 200),
    date,
    timeStart: time,
    timeEnd: time,
    categoryId: positiveId.nullish(),
    budget: z.coerce.number().nonnegative().default(0),
    calendarId: positiveId,
  }).refine((value) => value.timeEnd > value.timeStart, {
    message: 'timeEnd must be after timeStart',
    path: ['timeEnd'],
  }),
  eventUpdate: z.object({
    title: nonEmptyText('Title', 200),
    date,
    timeStart: time,
    timeEnd: time,
    categoryId: positiveId.nullish(),
    budget: z.coerce.number().nonnegative().default(0),
    calendarId: positiveId.optional(),
  }).refine((value) => value.timeEnd > value.timeStart, {
    message: 'timeEnd must be after timeStart',
    path: ['timeEnd'],
  }),
  idParams: z.object({ id: positiveId }),
};

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(', ');
      return next(badRequest(message));
    }
    Object.assign(req[source], result.data);
    next();
  };
}
