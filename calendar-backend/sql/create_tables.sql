-- CREATE TABLE events(
--   id SERIAL PRIMARY KEY,
--   user_id INTEGER,
--   title TEXT NOT NULL,
--   time_start TIME NOT NULL,
--   time_end TIME NOT NULL,
--   date Date NOT NULL,
--   category TEXT,
--   budget NUMERIC DEFAULT 0,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE categories (
--   category_id SERIAL PRIMARY KEY,
--   name TEXT NOT NULL UNIQUE,
--   color TEXT NOT NULL
-- );
-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- Categories Table (linked to a user)
CREATE TABLE categories (
  category_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  UNIQUE (user_id, name) -- A user can't have duplicate category names
);

-- Events Table (linked to a user and optionally a category)
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  budget NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

