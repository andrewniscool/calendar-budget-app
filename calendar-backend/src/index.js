import { createApp } from './app.js';
import { getConfig, loadEnv } from './config.js';
import { createPool, verifyDatabase } from './db.js';
import { cleanupExpiredAuthTokens } from './maintenance.js';

loadEnv();

const config = getConfig();
const db = createPool(config.DATABASE_URL);
let server;
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; shutting down`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await db.end();
}

async function start() {
  await verifyDatabase(db);
  const cleanup = await cleanupExpiredAuthTokens(db);
  console.log(`Cleaned up auth tokens: ${cleanup.refreshTokensDeleted} refresh, ${cleanup.accountTokensDeleted} account`);
  const app = createApp({ db, config });
  server = app.listen(config.PORT, () => {
    console.log(`Calendar API listening on http://localhost:${config.PORT}`);
  });
}

process.on('SIGINT', () => shutdown('SIGINT').finally(() => process.exit(0)));
process.on('SIGTERM', () => shutdown('SIGTERM').finally(() => process.exit(0)));

start().catch(async (error) => {
  console.error('Failed to start API:', error);
  await db.end();
  process.exit(1);
});
