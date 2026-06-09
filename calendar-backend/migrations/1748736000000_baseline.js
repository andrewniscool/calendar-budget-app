export async function up(pgm) {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calendars (
      calendar_id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      category_id SERIAL PRIMARY KEY,
      calendar_id INTEGER REFERENCES calendars(calendar_id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      UNIQUE (calendar_id, name)
    );

    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      calendar_id INTEGER REFERENCES calendars(calendar_id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      date DATE NOT NULL,
      time_start TIME NOT NULL,
      time_end TIME NOT NULL,
      budget NUMERIC NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    DELETE FROM events
    WHERE calendar_id IS NULL
       OR NOT EXISTS (
         SELECT 1 FROM calendars WHERE calendars.calendar_id = events.calendar_id
       );

    DELETE FROM categories
    WHERE calendar_id IS NULL
       OR NOT EXISTS (
         SELECT 1 FROM calendars WHERE calendars.calendar_id = categories.calendar_id
       );

    DELETE FROM calendars
    WHERE user_id IS NULL
       OR NOT EXISTS (
         SELECT 1 FROM users WHERE users.id = calendars.user_id
       );

    UPDATE events e
    SET category_id = NULL
    WHERE category_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM categories c
        WHERE c.category_id = e.category_id
          AND c.calendar_id = e.calendar_id
      );

    UPDATE calendars SET name = 'Untitled calendar' WHERE BTRIM(name) = '';
    UPDATE categories SET name = 'Untitled category' WHERE BTRIM(name) = '';
    UPDATE events SET title = 'New Event' WHERE BTRIM(title) = '';
    UPDATE events SET budget = 0 WHERE budget IS NULL OR budget < 0;
    UPDATE events
    SET time_end = CASE
      WHEN time_start < TIME '23:00' THEN (time_start + INTERVAL '1 hour')::time
      ELSE TIME '23:59:59'
    END
    WHERE time_end <= time_start;

    ALTER TABLE calendars ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE calendars ALTER COLUMN created_at SET NOT NULL;
    ALTER TABLE categories ALTER COLUMN calendar_id SET NOT NULL;
    ALTER TABLE events ALTER COLUMN calendar_id SET NOT NULL;
    ALTER TABLE events ALTER COLUMN budget SET NOT NULL;
    ALTER TABLE events ALTER COLUMN created_at SET NOT NULL;

    ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_id_fkey;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'categories_category_calendar_unique'
      ) THEN
        ALTER TABLE categories
          ADD CONSTRAINT categories_category_calendar_unique
          UNIQUE (category_id, calendar_id);
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'events_category_calendar_fkey'
      ) THEN
        ALTER TABLE events
          ADD CONSTRAINT events_category_calendar_fkey
          FOREIGN KEY (category_id, calendar_id)
          REFERENCES categories(category_id, calendar_id)
          ON DELETE SET NULL (category_id);
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendars_name_not_blank') THEN
        ALTER TABLE calendars ADD CONSTRAINT calendars_name_not_blank CHECK (BTRIM(name) <> '');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_name_not_blank') THEN
        ALTER TABLE categories ADD CONSTRAINT categories_name_not_blank CHECK (BTRIM(name) <> '');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_color_hex') THEN
        ALTER TABLE categories ADD CONSTRAINT categories_color_hex CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_title_not_blank') THEN
        ALTER TABLE events ADD CONSTRAINT events_title_not_blank CHECK (BTRIM(title) <> '');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_budget_nonnegative') THEN
        ALTER TABLE events ADD CONSTRAINT events_budget_nonnegative CHECK (budget >= 0);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_time_order') THEN
        ALTER TABLE events ADD CONSTRAINT events_time_order CHECK (time_end > time_start);
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS calendars_user_id_idx ON calendars(user_id);
    CREATE INDEX IF NOT EXISTS categories_calendar_id_idx ON categories(calendar_id);
    CREATE INDEX IF NOT EXISTS events_calendar_date_time_idx
      ON events(calendar_id, date, time_start);
  `);
}

export async function down(pgm) {
  pgm.sql(`
    DROP TABLE IF EXISTS events CASCADE;
    DROP TABLE IF EXISTS categories CASCADE;
    DROP TABLE IF EXISTS calendars CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
}
