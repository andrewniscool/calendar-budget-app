import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createUserRepository } from './repositories/userRepository.js';
import { createCalendarRepository } from './repositories/calendarRepository.js';
import { createCategoryRepository } from './repositories/categoryRepository.js';
import { createEventRepository } from './repositories/eventRepository.js';
import { createBudgetLimitRepository } from './repositories/budgetLimitRepository.js';
import { createCalendarSettingsRepository } from './repositories/calendarSettingsRepository.js';
import { createRecurringEventRepository } from './repositories/recurringEventRepository.js';
import { createAuthService } from './services/authService.js';
import { createCalendarService } from './services/calendarService.js';
import { createCategoryService } from './services/categoryService.js';
import { createEventService } from './services/eventService.js';
import { createBudgetLimitService } from './services/budgetLimitService.js';
import { createCalendarSettingsService } from './services/calendarSettingsService.js';
import { createRecurringEventService } from './services/recurringEventService.js';
import { createUserController } from './controllers/userController.js';
import { createCalendarController } from './controllers/calendarController.js';
import { createCategoryController } from './controllers/categoryController.js';
import { createEventController } from './controllers/eventController.js';
import { createBudgetLimitController } from './controllers/budgetLimitController.js';
import { createCalendarSettingsController } from './controllers/calendarSettingsController.js';
import { createRecurringEventController } from './controllers/recurringEventController.js';
import { createAuthenticate } from './middleware/authMiddleware.js';
import { createCsrfProtection } from './middleware/authMiddleware.js';
import { requestContext } from './middleware/requestContext.js';
import { createMailService } from './services/mailService.js';
import { errorHandler, forbidden, notFoundHandler } from './errors.js';
import { registerRoutes } from './routes.js';

export function createApp({ db, config, mailService = createMailService(config) }) {
  const app = express();
  const userRepository = createUserRepository(db);
  const authenticate = createAuthenticate(userRepository, config);
  const csrfProtection = createCsrfProtection(config);

  const userController = createUserController(
    createAuthService(userRepository, mailService, config),
    config
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
  const budgetLimitController = createBudgetLimitController(
    createBudgetLimitService(createBudgetLimitRepository(db))
  );
  const calendarSettingsController = createCalendarSettingsController(
    createCalendarSettingsService(createCalendarSettingsRepository(db))
  );
  const recurringEventController = createRecurringEventController(
    createRecurringEventService(createRecurringEventRepository(db))
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
  app.use(requestContext({ logRequests: config.NODE_ENV !== 'test' }));
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      callback(forbidden('Origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  }));
  app.use(express.json({ limit: '100kb' }));
  app.use(csrfProtection);

  registerRoutes(app, {
    db,
    authenticate,
    authLimiter,
    userController,
    calendarController,
    calendarSettingsController,
    categoryController,
    eventController,
    budgetLimitController,
    recurringEventController,
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
