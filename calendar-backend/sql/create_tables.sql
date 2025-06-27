-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- Calendars Table (each user can have multiple)
CREATE TABLE calendars (
  calendar_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table (linked to a calendar)
CREATE TABLE categories (
  category_id SERIAL PRIMARY KEY,
  calendar_id INTEGER REFERENCES calendars(calendar_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  UNIQUE (calendar_id, name)  -- Unique per calendar
);

-- Events Table (linked to a calendar and optionally a category)
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  calendar_id INTEGER REFERENCES calendars(calendar_id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  budget NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
