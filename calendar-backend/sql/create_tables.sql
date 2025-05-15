CREATE TABLE events IF NOT EXISTS(
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  title TEXT NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  date Date NOT NULL,
  category TEXT,
  budget NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_user_id ON events (user_id);
CREATE INDEX idx_events_date ON events (date);