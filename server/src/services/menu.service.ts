import { randomUUID } from 'node:crypto';
import type { MenuCategory, MenuItem, NewMenuItem } from '@canteen/shared';
import { db } from '../db/connection.js';
import { HttpError, notFound } from '../utils/httpError.js';

interface MenuRow {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  is_available: number;
}

const toMenuItem = (row: MenuRow): MenuItem => ({
  id: row.id,
  name: row.name,
  category: row.category,
  price: row.price,
  isAvailable: row.is_available === 1,
});

const CATEGORY_ORDER = `CASE category
  WHEN 'Breakfast' THEN 1 WHEN 'Lunch' THEN 2 WHEN 'Snacks' THEN 3 ELSE 4 END`;

export function listMenu(): MenuItem[] {
  const rows = db
    .prepare(`SELECT * FROM menu_items ORDER BY ${CATEGORY_ORDER}, name`)
    .all() as MenuRow[];
  return rows.map(toMenuItem);
}

export function getMenuItem(id: string): MenuItem {
  const row = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id) as MenuRow | undefined;
  if (!row) throw notFound('Menu item');
  return toMenuItem(row);
}

function assertUniqueName(name: string, exceptId?: string) {
  const clash = db
    .prepare('SELECT id FROM menu_items WHERE lower(name) = lower(?) AND id IS NOT ?')
    .get(name.trim(), exceptId ?? null);
  if (clash) throw new HttpError(409, `"${name.trim()}" is already on the menu`);
}

export function createMenuItem(input: NewMenuItem): MenuItem {
  assertUniqueName(input.name);
  const id = randomUUID();
  db.prepare(
    'INSERT INTO menu_items (id, name, category, price, is_available) VALUES (?, ?, ?, ?, ?)',
  ).run(id, input.name.trim(), input.category, input.price, input.isAvailable ? 1 : 0);
  return getMenuItem(id);
}

export function updateMenuItem(id: string, patch: Partial<NewMenuItem>): MenuItem {
  const next = { ...getMenuItem(id), ...patch };
  if (patch.name !== undefined) assertUniqueName(patch.name, id);
  db.prepare(
    'UPDATE menu_items SET name = ?, category = ?, price = ?, is_available = ? WHERE id = ?',
  ).run(next.name.trim(), next.category, next.price, next.isAvailable ? 1 : 0, id);
  return getMenuItem(id);
}
