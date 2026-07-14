export async function up(pgm) {
  pgm.sql(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL CHECK (BTRIM(username) <> ''),
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      email_verified_at TIMESTAMPTZ,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_login_attempts >= 0),
      locked_until TIMESTAMPTZ,
      auth_version INTEGER NOT NULL DEFAULT 0 CHECK (auth_version >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX users_email_lower_unique ON users (LOWER(email));

    CREATE TABLE calendars (
      calendar_id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL CHECK (BTRIM(name) <> ''),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE categories (
      category_id SERIAL PRIMARY KEY,
      calendar_id INTEGER NOT NULL REFERENCES calendars(calendar_id) ON DELETE CASCADE,
      name TEXT NOT NULL CHECK (BTRIM(name) <> ''),
      color TEXT NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT categories_calendar_name_unique UNIQUE (calendar_id, name),
      CONSTRAINT categories_category_calendar_unique UNIQUE (category_id, calendar_id)
    );

    CREATE TABLE events (
      id SERIAL PRIMARY KEY,
      calendar_id INTEGER NOT NULL REFERENCES calendars(calendar_id) ON DELETE CASCADE,
      category_id INTEGER,
      title TEXT NOT NULL CHECK (BTRIM(title) <> ''),
      date DATE NOT NULL,
      time_start TIME NOT NULL,
      time_end TIME NOT NULL,
      budget NUMERIC(14,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT events_category_calendar_fkey
        FOREIGN KEY (category_id, calendar_id)
        REFERENCES categories(category_id, calendar_id)
        ON DELETE SET NULL (category_id),
      CONSTRAINT events_budget_range CHECK (budget >= 0 AND budget <= 999999999999.99),
      CONSTRAINT events_time_order CHECK (time_end > time_start)
    );

    CREATE TABLE calendar_settings (
      calendar_id INTEGER PRIMARY KEY REFERENCES calendars(calendar_id) ON DELETE CASCADE,
      timezone TEXT NOT NULL DEFAULT 'America/New_York' CHECK (BTRIM(timezone) <> ''),
      currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE budget_limits (
      id BIGSERIAL PRIMARY KEY,
      calendar_id INTEGER NOT NULL REFERENCES calendars(calendar_id) ON DELETE CASCADE,
      category_id INTEGER,
      period_start DATE NOT NULL CHECK (period_start = DATE_TRUNC('month', period_start)::date),
      amount NUMERIC(14,2) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT budget_limits_category_calendar_fkey
        FOREIGN KEY (category_id, calendar_id)
        REFERENCES categories(category_id, calendar_id)
        ON DELETE CASCADE,
      CONSTRAINT budget_limits_amount_range CHECK (amount >= 0 AND amount <= 999999999999.99)
    );

    CREATE UNIQUE INDEX budget_limits_overall_unique
      ON budget_limits(calendar_id, period_start) WHERE category_id IS NULL;
    CREATE UNIQUE INDEX budget_limits_category_unique
      ON budget_limits(calendar_id, category_id, period_start) WHERE category_id IS NOT NULL;

    CREATE TABLE recurring_events (
      id BIGSERIAL PRIMARY KEY,
      calendar_id INTEGER NOT NULL REFERENCES calendars(calendar_id) ON DELETE CASCADE,
      category_id INTEGER,
      title TEXT NOT NULL CHECK (BTRIM(title) <> ''),
      start_date DATE NOT NULL,
      end_date DATE,
      time_start TIME NOT NULL,
      time_end TIME NOT NULL,
      budget NUMERIC(14,2) NOT NULL DEFAULT 0,
      frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
      interval_count INTEGER NOT NULL DEFAULT 1 CHECK (interval_count BETWEEN 1 AND 365),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT recurring_events_category_calendar_fkey
        FOREIGN KEY (category_id, calendar_id)
        REFERENCES categories(category_id, calendar_id)
        ON DELETE SET NULL (category_id),
      CONSTRAINT recurring_events_budget_range CHECK (budget >= 0 AND budget <= 999999999999.99),
      CONSTRAINT recurring_events_time_order CHECK (time_end > time_start),
      CONSTRAINT recurring_events_date_order CHECK (end_date IS NULL OR end_date >= start_date)
    );

    CREATE TABLE refresh_tokens (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      family_id UUID NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      replaced_by_id BIGINT REFERENCES refresh_tokens(id) ON DELETE SET NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_used_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ
    );

    CREATE TABLE account_tokens (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      consumed_at TIMESTAMPTZ
    );

    CREATE TABLE mail_outbox (
      id BIGSERIAL PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
      recipient TEXT NOT NULL,
      payload JSONB NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
      max_attempts INTEGER NOT NULL DEFAULT 8 CHECK (max_attempts > 0),
      next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      locked_at TIMESTAMPTZ,
      sent_at TIMESTAMPTZ,
      failed_at TIMESTAMPTZ,
      last_error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX calendars_user_id_idx ON calendars(user_id);
    CREATE INDEX categories_calendar_id_idx ON categories(calendar_id);
    CREATE INDEX events_calendar_date_time_idx ON events(calendar_id, date, time_start);
    CREATE INDEX budget_limits_calendar_period_idx ON budget_limits(calendar_id, period_start);
    CREATE INDEX recurring_events_calendar_idx ON recurring_events(calendar_id);
    CREATE INDEX refresh_tokens_user_idx ON refresh_tokens(user_id);
    CREATE INDEX refresh_tokens_family_idx ON refresh_tokens(family_id);
    CREATE INDEX refresh_tokens_expires_idx ON refresh_tokens(expires_at);
    CREATE INDEX account_tokens_user_type_created_idx ON account_tokens(user_id, type, created_at DESC);
    CREATE INDEX account_tokens_expires_idx ON account_tokens(expires_at);
    CREATE INDEX mail_outbox_available_idx
      ON mail_outbox(next_attempt_at, id) WHERE sent_at IS NULL AND failed_at IS NULL;
  `);
}

export async function down(pgm) {
  pgm.sql(`
    DROP TABLE IF EXISTS mail_outbox;
    DROP TABLE IF EXISTS account_tokens;
    DROP TABLE IF EXISTS refresh_tokens;
    DROP TABLE IF EXISTS recurring_events;
    DROP TABLE IF EXISTS budget_limits;
    DROP TABLE IF EXISTS calendar_settings;
    DROP TABLE IF EXISTS events;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS calendars;
    DROP TABLE IF EXISTS users;
  `);
}
