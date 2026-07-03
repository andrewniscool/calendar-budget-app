export async function up(pgm) {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS calendar_settings (
      calendar_id INTEGER PRIMARY KEY REFERENCES calendars(calendar_id) ON DELETE CASCADE,
      timezone TEXT NOT NULL DEFAULT 'America/New_York',
      currency TEXT NOT NULL DEFAULT 'USD',
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (BTRIM(timezone) <> ''),
      CHECK (currency ~ '^[A-Z]{3}$')
    );

    CREATE TABLE IF NOT EXISTS budget_limits (
      id BIGSERIAL PRIMARY KEY,
      calendar_id INTEGER NOT NULL REFERENCES calendars(calendar_id) ON DELETE CASCADE,
      category_id INTEGER,
      period_start DATE NOT NULL,
      amount NUMERIC NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (amount >= 0),
      CHECK (period_start = DATE_TRUNC('month', period_start)::date)
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'budget_limits_category_calendar_fkey'
      ) THEN
        ALTER TABLE budget_limits
          ADD CONSTRAINT budget_limits_category_calendar_fkey
          FOREIGN KEY (category_id, calendar_id)
          REFERENCES categories(category_id, calendar_id)
          ON DELETE CASCADE;
      END IF;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS budget_limits_overall_unique
      ON budget_limits(calendar_id, period_start)
      WHERE category_id IS NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS budget_limits_category_unique
      ON budget_limits(calendar_id, category_id, period_start)
      WHERE category_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS budget_limits_calendar_period_idx
      ON budget_limits(calendar_id, period_start);

    CREATE TABLE IF NOT EXISTS recurring_events (
      id BIGSERIAL PRIMARY KEY,
      calendar_id INTEGER NOT NULL REFERENCES calendars(calendar_id) ON DELETE CASCADE,
      category_id INTEGER,
      title TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      time_start TIME NOT NULL,
      time_end TIME NOT NULL,
      budget NUMERIC NOT NULL DEFAULT 0,
      frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
      interval_count INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (BTRIM(title) <> ''),
      CHECK (time_end > time_start),
      CHECK (budget >= 0),
      CHECK (interval_count > 0),
      CHECK (end_date IS NULL OR end_date >= start_date)
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'recurring_events_category_calendar_fkey'
      ) THEN
        ALTER TABLE recurring_events
          ADD CONSTRAINT recurring_events_category_calendar_fkey
          FOREIGN KEY (category_id, calendar_id)
          REFERENCES categories(category_id, calendar_id)
          ON DELETE SET NULL (category_id);
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS recurring_events_calendar_idx
      ON recurring_events(calendar_id);
  `);
}

export async function down(pgm) {
  pgm.sql(`
    DROP TABLE IF EXISTS recurring_events;
    DROP TABLE IF EXISTS budget_limits;
    DROP TABLE IF EXISTS calendar_settings;
  `);
}
