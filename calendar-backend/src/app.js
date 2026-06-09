import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createUserRepository } from './repositories/userRepository.js';
import { createCalendarRepository } from './repositories/calendarRepository.js';
import { createCategoryRepository } from './repositories/categoryRepository.js';
import { createEventRepository } from './repositories/eventRepository.js';
import { createAuthService } from './services/authService.js';
import { createCalendarService } from './services/calendarService.js';
import { createCategoryService } from './services/categoryService.js';
import { createEventService } from './services/eventService.js';
import { createUserController } from './controllers/userController.js';
import { createCalendarController } from './controllers/calendarController.js';
import { createCategoryController } from './controllers/categoryController.js';
import { createEventController } from './controllers/eventController.js';
import { createAuthenticate } from './middleware/authMiddleware.js';
import { asyncHandler, errorHandler, forbidden, notFoundHandler } from './errors.js';
import { schemas, validate } from './validation.js';

export function createApp({ db, config }) {
  const app = express();
  const authenticate = createAuthenticate(config);

  const userController = createUserController(
    createAuthService(createUserRepository(db), config)
  );
  const calendarController = createCalendarController(
    createCalendarService(createCalendarRepository(db))
  );
  const categoryController = createCategoryController(
    createCategoryService(createCategoryRepository(db))
  );
  const eventController = createEventController(
    createEventService(createEventRepository(db))
  );

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.AUTH_RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      error: 'Too many authentication attempts',
      message: 'Too many authentication attempts',
      code: 'RATE_LIMITED',
    },
  });

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      callback(forbidden('Origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/', (_req, res) => res.json({ message: 'Calendar API is running' }));
  app.get('/health/live', (_req, res) => res.json({ status: 'ok' }));
  app.get('/health/ready', asyncHandler(async (_req, res) => {
    await db.query('SELECT 1');
    res.json({ status: 'ready' });
  }));

  app.post('/register', authLimiter, validate(schemas.register), asyncHandler(userController.register));
  app.post('/login', authLimiter, validate(schemas.login), asyncHandler(userController.login));

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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
