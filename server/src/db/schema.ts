import { randomBytes } from 'node:crypto';
import type Database from 'better-sqlite3';

/** Idempotent DDL: safe to run on every boot. */
export function applySchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id    TEXT PRIMARY KEY,
      name  TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role  TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'admin'))
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      category     TEXT NOT NULL CHECK (category IN ('Breakfast', 'Lunch', 'Snacks', 'Drinks')),
      price        REAL NOT NULL CHECK (price >= 0),
      is_available INTEGER NOT NULL DEFAULT 1 CHECK (is_available IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL REFERENCES users(id),
      total_amount REAL NOT NULL,
      time_slot    TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'placed'
                   CHECK (status IN ('placed', 'preparing', 'ready', 'completed')),
      created_at   DATETIME NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id       TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id   TEXT NOT NULL REFERENCES menu_items(id),
      quantity       INTEGER NOT NULL CHECK (quantity > 0),
      price_at_order REAL NOT NULL
    );

    -- Login sessions. Only a SHA-256 of the cookie token is stored, so a leaked
    -- database cannot be replayed as live sessions.
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at DATETIME NOT NULL
    );

    -- Who is an admin. users.role is kept in sync with this list.
    CREATE TABLE IF NOT EXISTS admin_emails (
      email     TEXT PRIMARY KEY COLLATE NOCASE,
      added_by  TEXT,
      added_at  DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
      permanent INTEGER NOT NULL DEFAULT 0 CHECK (permanent IN (0, 1))
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  `);

  const orderColumns = db.prepare('PRAGMA table_info(orders)').all() as Array<{ name: string }>;
  if (!orderColumns.some((column) => column.name === 'verification_token')) {
    db.exec('ALTER TABLE orders ADD COLUMN verification_token TEXT');
    const rows = db.prepare('SELECT id FROM orders WHERE verification_token IS NULL OR verification_token = ?').all('') as Array<{ id: string }>;
    const update = db.prepare('UPDATE orders SET verification_token = ? WHERE id = ?');
    for (const row of rows) {
      update.run(randomBytes(18).toString('hex'), row.id);
    }
  }

  const verificationIndex = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_orders_verification_token'")
    .get() as { name: string } | undefined;

  if (!verificationIndex && orderColumns.some((column) => column.name === 'verification_token')) {
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_verification_token ON orders(verification_token)');
  }
}
