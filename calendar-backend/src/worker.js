import { getConfig, loadEnv } from './config.js';
import { createPool, verifyDatabase } from './db.js';
import { createLogger } from './logger.js';
import { cleanupExpiredAuthTokens } from './maintenance.js';
import { createMailOutboxRepository } from './repositories/mailOutboxRepository.js';
import { createMailService } from './services/mailService.js';
import { createOutboxWorker } from './services/outboxWorker.js';

loadEnv();

const config = getConfig();
const logger = createLogger();
const db = createPool(config.DATABASE_URL, { ...config, applicationName: 'calendar-budget-worker' });
const worker = createOutboxWorker({
  repository: createMailOutboxRepository(db),
  mailService: createMailService(config),
  logger,
  cleanup: () => cleanupExpiredAuthTokens(db),
  pollIntervalMs: config.WORKER_POLL_INTERVAL_MS,
});
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('worker.shutdown_started', { signal });
  await worker.stop();
  await db.end();
}

process.on('SIGINT', () => shutdown('SIGINT').finally(() => process.exit(0)));
process.on('SIGTERM', () => shutdown('SIGTERM').finally(() => process.exit(0)));

verifyDatabase(db)
  .then(() => {
    worker.start();
    logger.info('worker.started');
  })
  .catch(async (error) => {
    logger.error('worker.start_failed', { errorName: error.name, errorMessage: error.message });
    await db.end();
    process.exit(1);
  });
