import pg from 'pg';

const { Pool } = pg;

export function createPool(connectionString, options = {}) {
  return new Pool({
    connectionString,
    max: options.DB_POOL_MAX ?? 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: options.DB_STATEMENT_TIMEOUT_MS ?? 10_000,
    application_name: options.applicationName ?? 'calendar-budget-api',
    ssl: options.databaseSsl ? { rejectUnauthorized: true } : undefined,
  });
}

export async function verifyDatabase(pool) {
  await pool.query('SELECT 1');
}

export async function withTransaction(db, work) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
