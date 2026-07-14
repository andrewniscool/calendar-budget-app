import { createApp } from './app.js';
import { getConfig, loadEnv } from './config.js';
import { createPool, verifyDatabase } from './db.js';
import { createLogger } from './logger.js';

loadEnv();

const config = getConfig();
const logger = createLogger();
const db = createPool(config.DATABASE_URL, config);
let server;
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('api.shutdown_started', { signal });

  if (server) {
    server.close();
    server.closeIdleConnections?.();
    await Promise.race([
      new Promise((resolve) => server.once('close', resolve)),
      new Promise((resolve) => setTimeout(() => {
        logger.warn('api.shutdown_forced', { timeoutMs: config.SHUTDOWN_TIMEOUT_MS });
        server.closeAllConnections?.();
        resolve();
      }, config.SHUTDOWN_TIMEOUT_MS)),
    ]);
  }
  await db.end();
}

async function start() {
  await verifyDatabase(db);
  const app = createApp({ db, config, logger });
  server = app.listen(config.PORT, () => {
    logger.info('api.started', { port: config.PORT });
  });
  server.requestTimeout = config.REQUEST_TIMEOUT_MS;
  server.headersTimeout = config.HEADERS_TIMEOUT_MS;
  server.keepAliveTimeout = config.KEEP_ALIVE_TIMEOUT_MS;
}

process.on('SIGINT', () => shutdown('SIGINT').finally(() => process.exit(0)));
process.on('SIGTERM', () => shutdown('SIGTERM').finally(() => process.exit(0)));

start().catch(async (error) => {
  logger.error('api.start_failed', { errorName: error.name, errorMessage: error.message });
  await db.end();
  process.exit(1);
});
