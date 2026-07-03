import { asyncHandler } from './errors.js';
import { schemas, validate } from './validation.js';

export function registerRoutes(app, {
  db,
  authenticate,
  authLimiter,
  userController,
  calendarController,
  categoryController,
  eventController,
}) {
  app.get('/', (_req, res) => res.json({ message: 'Calendar API is running' }));
  app.get('/health/live', (_req, res) => res.json({ status: 'ok' }));
  app.get('/health/ready', asyncHandler(async (_req, res) => {
    await db.query('SELECT 1');
    res.json({ status: 'ready' });
  }));

  app.get('/auth/csrf', userController.csrf);
  app.post('/auth/register', authLimiter, validate(schemas.register), asyncHandler(userController.register));
  app.post('/auth/verify-email', authLimiter, validate(schemas.verifyEmail), asyncHandler(userController.verifyEmail));
  app.post('/auth/resend-verification', authLimiter, validate(schemas.emailOnly), asyncHandler(userController.resendVerification));
  app.post('/auth/login', authLimiter, validate(schemas.login), asyncHandler(userController.login));
  app.post('/auth/refresh', authLimiter, asyncHandler(userController.refresh));
  app.post('/auth/logout', asyncHandler(userController.logout));
  app.get('/auth/session', authenticate, userController.session);
  app.post('/auth/forgot-password', authLimiter, validate(schemas.emailOnly), asyncHandler(userController.forgotPassword));
  app.post('/auth/reset-password', authLimiter, validate(schemas.resetPassword), asyncHandler(userController.resetPassword));
  app.post('/auth/legacy-email', authLimiter, validate(schemas.legacyEmail), asyncHandler(userController.legacyEmail));

  app.get('/calendars', authenticate, asyncHandler(calendarController.list));
  app.post('/calendars', authenticate, validate(schemas.calendarCreate), asyncHandler(calendarController.create));
  app.delete('/calendars/:id', authenticate, validate(schemas.idParams, 'params'), asyncHandler(calendarController.remove));

  app.get('/categories', authenticate, validate(schemas.categoryQuery, 'query'), asyncHandler(categoryController.list));
  app.post('/categories', authenticate, validate(schemas.categoryCreate), asyncHandler(categoryController.create));
  app.put('/categories/:id', authenticate, validate(schemas.idParams, 'params'), validate(schemas.categoryUpdate), asyncHandler(categoryController.update));
  app.delete('/categories/all', authenticate, validate(schemas.categoryQuery, 'query'), asyncHandler(categoryController.removeAll));
  app.delete('/categories/:id', authenticate, validate(schemas.idParams, 'params'), asyncHandler(categoryController.remove));

  app.get('/events', authenticate, validate(schemas.eventQuery, 'query'), asyncHandler(eventController.list));
  app.post('/events', authenticate, validate(schemas.eventCreate), asyncHandler(eventController.create));
  app.put('/events/:id', authenticate, validate(schemas.idParams, 'params'), validate(schemas.eventUpdate), asyncHandler(eventController.update));
  app.delete('/events/:id', authenticate, validate(schemas.idParams, 'params'), asyncHandler(eventController.remove));
}
