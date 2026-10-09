import { randomBytes } from 'node:crypto';
import {
  nextOrderStatus,
  ORDER_STATUSES,
  type Order,
  type OrderLine,
  type OrderStatus,
  type PlaceOrderRequest,
  type TimeSlot,
} from '@canteen/shared';
import { db } from '../db/connection.js';
import { toLocalDate, toLocalDateTime } from '../utils/dates.js';
import { HttpError, notFound } from '../utils/httpError.js';
import { listTimeSlots, resolveTimeSlot, SLOT_CONFIG } from '../utils/timeSlots.js';
import { buildOrderVerificationPayload, verifyOrderVerificationPayload } from './orderVerification.js';
import { orderEvents } from './orderEvents.js';
import { findUser } from './user.service.js';

interface OrderRow {
  id: string;
  user_id: string;
  user_name: string;
  total_amount: number;
  time_slot: string;
  status: OrderStatus;
  verification_token: string;
  created_at: string;
}

interface OrderLineRow {
  order_id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  price_at_order: number;
}

interface PricedItemRow {
  id: string;
  name: string;
  price: number;
  is_available: number;
}

const ORDER_SELECT = `
  SELECT o.id, o.user_id, u.name AS user_name, o.total_amount, o.time_slot, o.status, o.verification_token, o.created_at
  FROM orders o JOIN users u ON u.id = o.user_id`;

const placeholders = (n: number) => Array(n).fill('?').join(',');

/** Attaches line items to order rows using a single extra query. */
function hydrate(rows: OrderRow[]): Order[] {
  if (rows.length === 0) return [];
  const lines = db
    .prepare(
      `SELECT oi.order_id, oi.menu_item_id, m.name, oi.quantity, oi.price_at_order
       FROM order_items oi JOIN menu_items m ON m.id = oi.menu_item_id
       WHERE oi.order_id IN (${placeholders(rows.length)}) ORDER BY oi.id`,
    )
    .all(...rows.map((r) => r.id)) as OrderLineRow[];

  const byOrder = new Map<string, OrderLine[]>();
  for (const line of lines) {
    const list = byOrder.get(line.order_id) ?? [];
    list.push({
      menuItemId: line.menu_item_id,
      name: line.name,
      quantity: line.quantity,
      priceAtOrder: line.price_at_order,
    });
    byOrder.set(line.order_id, list);
  }

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    totalAmount: r.total_amount,
    timeSlot: r.time_slot,
    status: r.status,
    verificationToken: r.verification_token,
    createdAt: r.created_at,
    items: byOrder.get(r.id) ?? [],
  }));
}

export function getOrder(id: string): Order {
  const row = db.prepare(`${ORDER_SELECT} WHERE o.id = ?`).get(id) as OrderRow | undefined;
  if (!row) throw notFound('Order');
  return hydrate([row])[0]!;
}

export function listOrdersForUser(userId: string, limit = 10): Order[] {
  const rows = db
    .prepare(`${ORDER_SELECT} WHERE o.user_id = ? ORDER BY o.created_at DESC LIMIT ?`)
    .all(userId, limit) as OrderRow[];
  return hydrate(rows);
}

export function listReadyOrdersForHardware(): Array<{ id: string; timeSlot: string; items: string }> {
  return db
    .prepare(
      `SELECT o.id, o.time_slot AS timeSlot,
              GROUP_CONCAT(oi.quantity || 'x ' || m.name, ', ') AS items
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN menu_items m ON m.id = oi.menu_item_id
       WHERE o.status = 'ready'
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT 5`,
    )
    .all() as Array<{ id: string; timeSlot: string; items: string }>;
}

/** Today's orders: active ones first, oldest first within each group so the queue is FIFO. */
export function listTodaysOrders(now = new Date()): Order[] {
  const rows = db
    .prepare(
      `${ORDER_SELECT} WHERE date(o.created_at) = ?
       ORDER BY CASE o.status WHEN 'completed' THEN 1 ELSE 0 END, o.created_at ASC`,
    )
    .all(toLocalDate(now)) as OrderRow[];
  return hydrate(rows);
}

function bookedCount(label: string, now: Date): number {
  const row = db
    .prepare('SELECT COUNT(*) AS n FROM orders WHERE time_slot = ? AND date(created_at) = ?')
    .get(label, toLocalDate(now)) as { n: number };
  return row.n;
}

export function getTimeSlots(now = new Date()): TimeSlot[] {
  return listTimeSlots(now, (label) => bookedCount(label, now));
}

/** Short, human-friendly order code, e.g. "ORD-7K2Q9F". */
function newOrderId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'ORD-' + Array.from(randomBytes(6), (b) => alphabet[b % alphabet.length]).join('');
}

function newVerificationToken(): string {
  return randomBytes(18).toString('hex');
}

export function verifyOrderQrCode(qrCode: string): Order {
  const trimmed = qrCode.trim();
  const match = /^canteen:\/\/verify\/(.+?)\/(.+)$/.exec(trimmed);
  if (!match) throw new HttpError(400, 'That QR code is invalid');

  const [, orderId, token] = match;
  const order = db
    .prepare(`${ORDER_SELECT} WHERE o.id = ? AND o.verification_token = ?`)
    .get(orderId, token) as OrderRow | undefined;

  if (!order) throw new HttpError(400, 'This QR code does not match this order');
  if (!verifyOrderVerificationPayload(orderId, buildOrderVerificationPayload(orderId, token))) {
    throw new HttpError(400, 'This QR code is invalid');
  }

  return hydrate([order])[0]!;
}

export function placeOrder(userId: string, request: PlaceOrderRequest, now = new Date()): Order {
  const user = findUser(userId);
  if (!user) throw new HttpError(400, 'Unknown user');

  const slot = resolveTimeSlot(request.timeSlotId, now);
  if (!slot) throw new HttpError(400, 'That pickup slot is no longer available');

  // Merge duplicate lines so each item is priced once.
  const quantities = new Map<string, number>();
  for (const line of request.items) {
    quantities.set(line.menuItemId, (quantities.get(line.menuItemId) ?? 0) + line.quantity);
  }

  const orderId = db.transaction((): string => {
    if (bookedCount(slot.label, now) >= SLOT_CONFIG.capacity) {
      throw new HttpError(409, 'That pickup slot is fully booked');
    }

    const ids = [...quantities.keys()];
    const items = db
      .prepare(`SELECT id, name, price, is_available FROM menu_items WHERE id IN (${placeholders(ids.length)})`)
      .all(...ids) as PricedItemRow[];
    const byId = new Map(items.map((i) => [i.id, i]));

    let total = 0;
    for (const [id, qty] of quantities) {
      const item = byId.get(id);
      if (!item) throw new HttpError(400, `Menu item ${id} does not exist`);
      if (!item.is_available) throw new HttpError(409, `${item.name} is sold out`);
      total += item.price * qty; // prices come from the DB, never from the client
    }

    const id = newOrderId();
    const verificationToken = newVerificationToken();
    db.prepare(
      `INSERT INTO orders (id, user_id, total_amount, time_slot, status, verification_token, created_at)
       VALUES (?, ?, ?, ?, 'placed', ?, ?)`,
    ).run(id, user.id, Math.round(total * 100) / 100, slot.label, verificationToken, toLocalDateTime(now));

    const insertLine = db.prepare(
      'INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order) VALUES (?, ?, ?, ?)',
    );
    for (const [itemId, qty] of quantities) insertLine.run(id, itemId, qty, byId.get(itemId)!.price);
    return id;
  })();

  const created = getOrder(orderId);
  orderEvents.publish({ type: 'created', order: created });
  return created;
}

/** Moves an order to `status`, or to the next lifecycle step when omitted. Only forward moves are allowed. */
export function updateOrderStatus(id: string, status?: OrderStatus): Order {
  const current = getOrder(id);
  const target = status ?? nextOrderStatus(current.status);
  if (!target) throw new HttpError(409, 'Order is already completed');
  if (ORDER_STATUSES.indexOf(target) <= ORDER_STATUSES.indexOf(current.status)) {
    throw new HttpError(409, `Cannot move order from ${current.status} to ${target}`);
  }

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(target, id);
  const updated = getOrder(id);
  orderEvents.publish({ type: 'updated', order: updated });
  return updated;
}
