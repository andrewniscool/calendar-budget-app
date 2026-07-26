export async function up(pgm) {
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM calendar_settings cs
        JOIN calendars cal ON cal.calendar_id = cs.calendar_id
        GROUP BY cal.user_id
        HAVING COUNT(DISTINCT cs.currency) > 1
      ) THEN
        RAISE EXCEPTION
          'Cannot migrate users with conflicting calendar currencies; resolve them before retrying';
      END IF;
    END
    $$;

    CREATE TABLE category_migration_legacy AS TABLE categories;
    CREATE TABLE event_category_migration_legacy AS
      SELECT id AS event_id, category_id FROM events;
    CREATE TABLE recurring_category_migration_legacy AS
      SELECT id AS recurring_event_id, category_id FROM recurring_events;
    CREATE TABLE budget_limit_migration_legacy AS TABLE budget_limits;
    CREATE TABLE calendar_currency_migration_legacy AS
      SELECT calendar_id, currency FROM calendar_settings;

    CREATE TABLE financial_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO financial_settings (user_id, currency)
    SELECT
      u.id,
      COALESCE(
        (
          SELECT MIN(cs.currency)
          FROM calendar_settings cs
          JOIN calendars cal ON cal.calendar_id = cs.calendar_id
          WHERE cal.user_id = u.id
        ),
        'USD'
      )
    FROM users u;

    ALTER TABLE categories ADD COLUMN user_id INTEGER;
    UPDATE categories c
    SET user_id = cal.user_id
    FROM calendars cal
    WHERE cal.calendar_id = c.calendar_id;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM categories
        GROUP BY user_id
        HAVING COUNT(DISTINCT LOWER(BTRIM(name))) > 500
      ) THEN
        RAISE EXCEPTION
          'Cannot migrate a user with more than 500 distinct shared categories';
      END IF;
    END
    $$;

    ALTER TABLE events ADD COLUMN user_id INTEGER;
    UPDATE events e
    SET user_id = cal.user_id
    FROM calendars cal
    WHERE cal.calendar_id = e.calendar_id;

    ALTER TABLE recurring_events ADD COLUMN user_id INTEGER;
    UPDATE recurring_events re
    SET user_id = cal.user_id
    FROM calendars cal
    WHERE cal.calendar_id = re.calendar_id;

    CREATE TEMPORARY TABLE category_survivors ON COMMIT DROP AS
    WITH reference_counts AS (
      SELECT
        c.category_id,
        (
          (SELECT COUNT(*) FROM events e WHERE e.category_id = c.category_id) +
          (SELECT COUNT(*) FROM recurring_events re WHERE re.category_id = c.category_id) +
          (SELECT COUNT(*) FROM budget_limits bl WHERE bl.category_id = c.category_id)
        ) AS reference_count
      FROM categories c
    ),
    ranked AS (
      SELECT
        c.category_id AS old_category_id,
        FIRST_VALUE(c.category_id) OVER (
          PARTITION BY c.user_id, LOWER(BTRIM(c.name))
          ORDER BY rc.reference_count DESC, c.category_id
        ) AS survivor_category_id
      FROM categories c
      JOIN reference_counts rc ON rc.category_id = c.category_id
    )
    SELECT old_category_id, survivor_category_id
    FROM ranked;

    ALTER TABLE events
      DROP CONSTRAINT events_category_calendar_fkey;
    ALTER TABLE recurring_events
      DROP CONSTRAINT recurring_events_category_calendar_fkey;

    CREATE TABLE budget_limits_shared (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id INTEGER,
      period_start DATE NOT NULL
        CHECK (period_start = DATE_TRUNC('month', period_start)::date),
      amount NUMERIC(14,2) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT budget_limits_shared_amount_range
        CHECK (amount >= 0 AND amount <= 999999999999.99)
    );

    INSERT INTO budget_limits_shared (
      user_id, category_id, period_start, amount, created_at, updated_at
    )
    SELECT
      cal.user_id,
      CASE
        WHEN bl.category_id IS NULL THEN NULL
        ELSE mapping.survivor_category_id
      END,
      bl.period_start,
      SUM(bl.amount),
      MIN(bl.created_at),
      MAX(bl.updated_at)
    FROM budget_limits bl
    JOIN calendars cal ON cal.calendar_id = bl.calendar_id
    LEFT JOIN category_survivors mapping
      ON mapping.old_category_id = bl.category_id
    GROUP BY
      cal.user_id,
      CASE
        WHEN bl.category_id IS NULL THEN NULL
        ELSE mapping.survivor_category_id
      END,
      bl.period_start;

    UPDATE events e
    SET category_id = mapping.survivor_category_id
    FROM category_survivors mapping
    WHERE mapping.old_category_id = e.category_id;

    UPDATE recurring_events re
    SET category_id = mapping.survivor_category_id
    FROM category_survivors mapping
    WHERE mapping.old_category_id = re.category_id;

    DELETE FROM categories c
    USING category_survivors mapping
    WHERE c.category_id = mapping.old_category_id
      AND mapping.old_category_id <> mapping.survivor_category_id;

    UPDATE categories SET name = BTRIM(name);

    DROP TABLE budget_limits;
    ALTER TABLE budget_limits_shared RENAME TO budget_limits;
    ALTER INDEX budget_limits_shared_pkey RENAME TO budget_limits_pkey;
    ALTER TABLE budget_limits
      RENAME CONSTRAINT budget_limits_shared_amount_range
      TO budget_limits_amount_range;

    DROP INDEX categories_calendar_id_idx;
    ALTER TABLE categories
      DROP CONSTRAINT categories_calendar_name_unique,
      DROP CONSTRAINT categories_category_calendar_unique,
      DROP CONSTRAINT categories_calendar_id_fkey,
      DROP COLUMN calendar_id,
      ALTER COLUMN user_id SET NOT NULL,
      ADD CONSTRAINT categories_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      ADD CONSTRAINT categories_category_user_unique UNIQUE (category_id, user_id);

    CREATE UNIQUE INDEX categories_user_name_unique
      ON categories (user_id, LOWER(BTRIM(name)));
    CREATE INDEX categories_user_id_idx ON categories(user_id);

    ALTER TABLE calendars
      ADD CONSTRAINT calendars_calendar_user_unique UNIQUE (calendar_id, user_id);

    ALTER TABLE events
      DROP CONSTRAINT events_calendar_id_fkey,
      ALTER COLUMN user_id SET NOT NULL,
      ADD CONSTRAINT events_calendar_user_fkey
        FOREIGN KEY (calendar_id, user_id)
        REFERENCES calendars(calendar_id, user_id)
        ON DELETE CASCADE,
      ADD CONSTRAINT events_category_user_fkey
        FOREIGN KEY (category_id, user_id)
        REFERENCES categories(category_id, user_id)
        ON DELETE SET NULL (category_id);

    ALTER TABLE recurring_events
      DROP CONSTRAINT recurring_events_calendar_id_fkey,
      ALTER COLUMN user_id SET NOT NULL,
      ADD CONSTRAINT recurring_events_calendar_user_fkey
        FOREIGN KEY (calendar_id, user_id)
        REFERENCES calendars(calendar_id, user_id)
        ON DELETE CASCADE,
      ADD CONSTRAINT recurring_events_category_user_fkey
        FOREIGN KEY (category_id, user_id)
        REFERENCES categories(category_id, user_id)
        ON DELETE SET NULL (category_id);

    ALTER TABLE budget_limits
      ADD CONSTRAINT budget_limits_category_user_fkey
        FOREIGN KEY (category_id, user_id)
        REFERENCES categories(category_id, user_id)
        ON DELETE CASCADE;

    CREATE UNIQUE INDEX budget_limits_overall_unique
      ON budget_limits(user_id, period_start) WHERE category_id IS NULL;
    CREATE UNIQUE INDEX budget_limits_category_unique
      ON budget_limits(user_id, category_id, period_start)
      WHERE category_id IS NOT NULL;
    CREATE INDEX budget_limits_user_period_idx
      ON budget_limits(user_id, period_start);

    ALTER TABLE calendar_settings DROP COLUMN currency;
  `);
}

export async function down() {
  throw new Error(
    'This migration merges category identities and budget limits and cannot be reversed losslessly'
  );
}
