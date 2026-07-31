import pg from 'pg';

const { Pool } = pg;
const maximumAmount = 999_999_999_999.99;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

async function main() {
  const db = new Pool({
    connectionString: databaseUrl,
    application_name: 'category-migration-preflight',
  });
  try {
  const [
    duplicateGroups,
    categoryCounts,
    projectedLimits,
    currencyConflicts,
    ownershipProblems,
  ] = await Promise.all([
    db.query(`
      SELECT
        cal.user_id,
        LOWER(BTRIM(c.name)) AS normalized_name,
        ARRAY_AGG(c.category_id ORDER BY c.category_id) AS category_ids,
        ARRAY_AGG(DISTINCT c.color ORDER BY c.color) AS colors,
        COUNT(*)::integer AS records
      FROM categories c
      JOIN calendars cal ON cal.calendar_id = c.calendar_id
      GROUP BY cal.user_id, LOWER(BTRIM(c.name))
      HAVING COUNT(*) > 1
      ORDER BY cal.user_id, normalized_name
    `),
    db.query(`
      SELECT
        cal.user_id,
        COUNT(DISTINCT LOWER(BTRIM(c.name)))::integer AS shared_category_count
      FROM categories c
      JOIN calendars cal ON cal.calendar_id = c.calendar_id
      GROUP BY cal.user_id
      HAVING COUNT(DISTINCT LOWER(BTRIM(c.name))) > 500
      ORDER BY cal.user_id
    `),
    db.query(`
      WITH normalized_limits AS (
        SELECT
          cal.user_id,
          bl.period_start,
          CASE WHEN bl.category_id IS NULL THEN NULL ELSE LOWER(BTRIM(c.name)) END
            AS normalized_name,
          SUM(bl.amount) AS amount
        FROM budget_limits bl
        JOIN calendars cal ON cal.calendar_id = bl.calendar_id
        LEFT JOIN categories c ON c.category_id = bl.category_id
        GROUP BY
          cal.user_id,
          bl.period_start,
          CASE WHEN bl.category_id IS NULL THEN NULL ELSE LOWER(BTRIM(c.name)) END
      )
      SELECT user_id, period_start, normalized_name, amount
      FROM normalized_limits
      WHERE amount > $1
      ORDER BY user_id, period_start, normalized_name NULLS FIRST
    `, [maximumAmount]),
    db.query(`
      SELECT
        cal.user_id,
        ARRAY_AGG(DISTINCT cs.currency ORDER BY cs.currency) AS currencies
      FROM calendar_settings cs
      JOIN calendars cal ON cal.calendar_id = cs.calendar_id
      GROUP BY cal.user_id
      HAVING COUNT(DISTINCT cs.currency) > 1
      ORDER BY cal.user_id
    `),
    db.query(`
      SELECT 'event-category' AS problem, e.id::bigint AS resource_id
      FROM events e
      JOIN calendars event_cal ON event_cal.calendar_id = e.calendar_id
      JOIN categories c ON c.category_id = e.category_id
      JOIN calendars category_cal ON category_cal.calendar_id = c.calendar_id
      WHERE event_cal.user_id <> category_cal.user_id
      UNION ALL
      SELECT 'recurring-category', re.id
      FROM recurring_events re
      JOIN calendars event_cal ON event_cal.calendar_id = re.calendar_id
      JOIN categories c ON c.category_id = re.category_id
      JOIN calendars category_cal ON category_cal.calendar_id = c.calendar_id
      WHERE event_cal.user_id <> category_cal.user_id
      UNION ALL
      SELECT 'budget-category', bl.id
      FROM budget_limits bl
      JOIN calendars budget_cal ON budget_cal.calendar_id = bl.calendar_id
      JOIN categories c ON c.category_id = bl.category_id
      JOIN calendars category_cal ON category_cal.calendar_id = c.calendar_id
      WHERE budget_cal.user_id <> category_cal.user_id
      ORDER BY problem, resource_id
    `),
  ]);

  const report = {
    duplicateGroups: duplicateGroups.rows,
    quotaBlockers: categoryCounts.rows,
    amountBlockers: projectedLimits.rows,
    currencyBlockers: currencyConflicts.rows,
    ownershipBlockers: ownershipProblems.rows,
  };
  const blockerCount = report.quotaBlockers.length
    + report.amountBlockers.length
    + report.currencyBlockers.length
    + report.ownershipBlockers.length;

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ safeToMigrate: blockerCount === 0, ...report }, null, 2));
    if (blockerCount > 0) process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
