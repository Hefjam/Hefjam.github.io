-- Run once to initialise:
--   npx wrangler d1 execute restaurant-bookings --file=schema.sql

-- ── Bookings ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookings (
  id         TEXT PRIMARY KEY,
  date       TEXT NOT NULL,
  time_slot  TEXT NOT NULL,
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

-- ── Settings ──────────────────────────────────────────────────────────────────

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
-- Default staff PIN is 1234 — change it immediately via /staff.html Settings panel.

-- ── Menu items ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS menu_items (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  price       REAL NOT NULL,
  tags        TEXT NOT NULL DEFAULT '[]',   -- JSON array: ["v"], ["ve"], []
  description TEXT NOT NULL DEFAULT '',
  epos_id     INTEGER,                      -- EposNow product ID (set via staff panel)
  category    TEXT NOT NULL DEFAULT 'pizza',
  active      INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO menu_items (id, name, price, tags, description, sort_order) VALUES
  ('garlic',      'Garlic Bread',         6.00,  '["v"]',  'Toasted with garlic butter',                         0),
  ('marinara',    'Marinara',             10.00, '["ve"]', 'Tomato, garlic, oregano',                            1),
  ('margherita',  'Margherita',           11.00, '["v"]',  'Tomato, fior di latte mozzarella, basil',            2),
  ('pepperoni',   'Pepperoni',            13.00, '[]',     'Tomato, mozzarella, pepperoni',                      3),
  ('diavola',     'Diavola',              13.00, '[]',     'Tomato, mozzarella, spicy salami, chilli',           4),
  ('beef',        'Beef & Nduja',         14.00, '[]',     'Tomato, mozzarella, beef, nduja',                    5),
  ('mushroom',    'Wild Mushroom',        13.00, '["v"]',  'Cream, mozzarella, wild mushroom, truffle oil',      6),
  ('potato',      'Potato & Rosemary',    12.00, '["v"]',  'Cream, mozzarella, new potato, rosemary',            7),
  ('tenderstem',  'Tenderstem & Pesto',   13.00, '["v"]',  'Cream, mozzarella, tenderstem broccoli, pesto',      8),
  ('prawn',       'Prawn & Anchovy',      14.00, '[]',     'Tomato, mozzarella, prawns, anchovy',                9);

-- ── Condiments ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS condiments (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  price      REAL NOT NULL DEFAULT 0,
  epos_id    INTEGER,
  active     INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO condiments (id, name, price, epos_id, sort_order) VALUES
  ('chilli-oil',    'House Italian Chilli Oil', 0.50, 7665572, 0),
  ('garlic-mayo',   'House Garlic Mayo',        0.50, 7665597, 1),
  ('chilli-flakes', 'Chilli Flakes',            0.00, 7665604, 2),
  ('parmesan',      'Parmesan',                 0.50, 7665609, 3);

-- ── Orders ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id               TEXT PRIMARY KEY,
  order_number     TEXT NOT NULL,
  table_number     INTEGER NOT NULL,
  items            TEXT NOT NULL,          -- JSON array of resolved line items
  subtotal         REAL NOT NULL,
  tip_amount       REAL NOT NULL DEFAULT 0,
  total            REAL NOT NULL,
  pay_method       TEXT NOT NULL DEFAULT 'card',
  customer_email   TEXT NOT NULL DEFAULT '',
  marketing_opt_in INTEGER NOT NULL DEFAULT 0,
  epos_ref         TEXT NOT NULL DEFAULT '', -- EposNow transaction ID once sent
  status           TEXT NOT NULL DEFAULT 'received', -- received | sent | epos_failed | serving | done
  created_at       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date(created_at));
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_number);
