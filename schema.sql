-- Run once: npx wrangler d1 execute restaurant-bookings --file=schema.sql

CREATE TABLE IF NOT EXISTS bookings (
  id         TEXT PRIMARY KEY,
  date       TEXT NOT NULL,       -- YYYY-MM-DD
  time_slot  TEXT NOT NULL,       -- HH:MM
  covers     INTEGER NOT NULL,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  email      TEXT NOT NULL DEFAULT '',
  notes      TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'confirmed', -- confirmed | arrived | no_show | cancelled
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_date_slot ON bookings(date, time_slot);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('restaurant_name',    'The Taproom'),
  ('opening_time',       '11:00'),
  ('closing_time',       '22:00'),
  ('slot_interval_mins', '30'),
  ('max_covers_per_slot','40'),
  ('booking_email',      '');
-- Default staff PIN is 1234 — change it immediately via the Settings panel in /staff.html
