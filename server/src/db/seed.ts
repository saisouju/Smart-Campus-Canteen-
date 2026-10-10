import { pathToFileURL } from 'node:url';
import type { MenuCategory, OrderStatus, User } from '@canteen/shared';
import { config } from '../config.js';
import { ensureFoundingAdmin } from '../services/adminAccess.service.js';
import { addDays, toLocalDateTime } from '../utils/dates.js';
import { SLOT_CONFIG, slotLabelAt } from '../utils/timeSlots.js';
import { db, initializeDatabase, type AsyncDatabase } from './connection.js';

/**
 * Fictional customers that give the charts and leaderboard some history.
 * The .invalid TLD (RFC 2606) guarantees they can never match a real
 * @klh.edu.in Google account, so nobody can sign in as them.
 * Disable with SEED_DEMO_DATA=false.
 */
const DEMO_USERS: (User & { appetite: number })[] = [
  { id: 'demo-aarav', name: 'Aarav Sharma', email: 'aarav.sharma@demo.invalid', role: 'student', appetite: 9 },
  { id: 'demo-diya', name: 'Diya Patel', email: 'diya.patel@demo.invalid', role: 'student', appetite: 7 },
  { id: 'demo-meera', name: 'Meera Iyer', email: 'meera.iyer@demo.invalid', role: 'faculty', appetite: 5 },
  { id: 'demo-kiran', name: 'Kiran Reddy', email: 'kiran.reddy@demo.invalid', role: 'student', appetite: 8 },
  { id: 'demo-sneha', name: 'Sneha Rao', email: 'sneha.rao@demo.invalid', role: 'student', appetite: 6 },
  { id: 'demo-arjun', name: 'Arjun Varma', email: 'arjun.varma@demo.invalid', role: 'student', appetite: 4 },
  { id: 'demo-lakshmi', name: 'Lakshmi Naidu', email: 'lakshmi.naidu@demo.invalid', role: 'faculty', appetite: 3 },
  { id: 'demo-rahul', name: 'Rahul Menon', email: 'rahul.menon@demo.invalid', role: 'student', appetite: 5 },
  { id: 'demo-priya', name: 'Priya Gupta', email: 'priya.gupta@demo.invalid', role: 'student', appetite: 3 },
  { id: 'demo-vikram', name: 'Vikram Singh', email: 'vikram.singh@demo.invalid', role: 'student', appetite: 2 },
  { id: 'demo-anjali', name: 'Anjali Das', email: 'anjali.das@demo.invalid', role: 'faculty', appetite: 2 },
  { id: 'demo-rohit', name: 'Rohit Jain', email: 'rohit.jain@demo.invalid', role: 'student', appetite: 1 },
];

/** [id, name, category, price, available, popularity weight] */
const MENU: [string, string, MenuCategory, number, boolean, number][] = [
  ['idli-sambar', 'Idli Sambar', 'Breakfast', 40, true, 6],
  ['masala-dosa', 'Masala Dosa', 'Breakfast', 60, true, 9],
  ['poha', 'Poha', 'Breakfast', 35, true, 4],
  ['aloo-paratha', 'Aloo Paratha', 'Breakfast', 50, true, 5],
  ['upma', 'Upma', 'Breakfast', 35, false, 2],
  ['veg-thali', 'Veg Thali', 'Lunch', 110, true, 8],
  ['chicken-biryani', 'Chicken Biryani', 'Lunch', 150, true, 10],
  ['paneer-butter-masala', 'Paneer Butter Masala & Roti', 'Lunch', 120, true, 6],
  ['curd-rice', 'Curd Rice', 'Lunch', 60, true, 3],
  ['rajma-chawal', 'Rajma Chawal', 'Lunch', 90, true, 5],
  ['samosa', 'Samosa (2 pcs)', 'Snacks', 30, true, 9],
  ['veg-puff', 'Veg Puff', 'Snacks', 25, true, 4],
  ['pav-bhaji', 'Pav Bhaji', 'Snacks', 70, true, 6],
  ['vada-pav', 'Vada Pav', 'Snacks', 25, true, 7],
  ['french-fries', 'French Fries', 'Snacks', 60, false, 3],
  ['masala-chai', 'Masala Chai', 'Drinks', 15, true, 12],
  ['filter-coffee', 'Filter Coffee', 'Drinks', 20, true, 8],
  ['lime-soda', 'Fresh Lime Soda', 'Drinks', 35, true, 4],
  ['mango-lassi', 'Mango Lassi', 'Drinks', 50, true, 5],
  ['cold-coffee', 'Cold Coffee', 'Drinks', 55, true, 5],
];

/** Small deterministic PRNG so every reseed produces the same demo data. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function seed(transaction: AsyncDatabase, now = new Date(), withDemoData = config.seedDemoData): Promise<void> {
  const rand = mulberry32(20261007);
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  const totalWeight = MENU.reduce((s, m) => s + m[5], 0);
  const pickItem = () => {
    let r = rand() * totalWeight;
    for (const m of MENU) if ((r -= m[5]) <= 0) return m;
    return MENU[0]!;
  };
  const totalAppetite = DEMO_USERS.reduce((s, u) => s + u.appetite, 0);
  const pickCustomer = () => {
    let r = rand() * totalAppetite;
    for (const u of DEMO_USERS) if ((r -= u.appetite) <= 0) return u;
    return DEMO_USERS[0]!;
  };
  const slotStarts: number[] = [];
  for (let m = SLOT_CONFIG.openMinutes; m < SLOT_CONFIG.closeMinutes; m += SLOT_CONFIG.slotMinutes) slotStarts.push(m);

  let seq = 1;
  const insertUser = transaction.prepare('INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)');
  const insertOrder = transaction.prepare(
    'INSERT INTO orders (id, user_id, total_amount, time_slot, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const insertLine = transaction.prepare(
    'INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order) VALUES (?, ?, ?, ?)',
  );

  const createOrder = async (createdAt: Date, status: OrderStatus) => {
    const id = `ORD-S${String(seq++).padStart(5, '0')}`;
    const lines = new Map<string, { qty: number; price: number }>();
    for (let i = int(1, 3); i > 0; i--) {
      const [itemId, , , price] = pickItem();
      const line = lines.get(itemId) ?? { qty: 0, price };
      line.qty += int(1, 2);
      lines.set(itemId, line);
    }
    const total = [...lines.values()].reduce((s, l) => s + l.qty * l.price, 0);
    const user = pickCustomer();
    await insertOrder.run(id, user.id, total, slotLabelAt(slotStarts[int(0, slotStarts.length - 1)]!), status, toLocalDateTime(createdAt));
    for (const [itemId, l] of lines) await insertLine.run(id, itemId, l.qty, l.price);
  };

  const menuPlaceholders = MENU.map(() => '(?, ?, ?, ?, ?)').join(', ');
  await transaction.prepare(
    `INSERT INTO menu_items (id, name, category, price, is_available) VALUES ${menuPlaceholders}`,
  ).run(...MENU.flatMap(([id, name, category, price, available]) => [id, name, category, price, available ? 1 : 0]));
  if (!withDemoData) return;
  for (const u of DEMO_USERS) await insertUser.run(u.id, u.name, u.email, u.role);

  // Two weeks of completed history, so "this week" always has earlier days to chart.
  for (let back = 14; back >= 1; back--) {
    const day = addDays(now, -back);
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    for (let n = weekend ? int(8, 15) : int(22, 40); n > 0; n--) {
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), int(8, 19), int(0, 59), int(0, 59));
      await createOrder(at, 'completed');
    }
  }

  // Today's live queue: a mix of statuses placed during the last few hours.
  const todayStatuses: OrderStatus[] = ['completed', 'completed', 'completed', 'ready', 'preparing', 'preparing', 'placed', 'placed', 'placed'];
  for (const [i, status] of todayStatuses.entries()) {
    const minutesAgo = (todayStatuses.length - i) * 12;
    const at = new Date(now.getTime() - minutesAgo * 60_000);
    // Keep the timestamp on today's date even right after midnight.
    if (at.getDate() !== now.getDate()) at.setTime(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, i).getTime());
    await createOrder(at, status);
  }
}

/** Seeds only when the menu is empty (fresh database). Returns true if it seeded. */
export async function seedIfEmpty(): Promise<boolean> {
  return db.transaction(async (transaction) => {
    const { n } = await transaction.prepare('SELECT COUNT(*) AS n FROM menu_items').get() as { n: number };
    if (n > 0) return false;
    await seed(transaction);
    return true;
  });
}

/** Wipes menu, orders, users and sessions. The admin email list is kept. */
async function reset(): Promise<void> {
  await db.exec(`
    DELETE FROM order_items; DELETE FROM orders; DELETE FROM sessions;
    DELETE FROM menu_items; DELETE FROM users;
    DELETE FROM sqlite_sequence WHERE name = 'order_items';
  `);
}

// CLI: `npm run seed` wipes and reseeds.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await initializeDatabase();
  if (process.argv.includes('--reset')) await reset();
  console.log(await seedIfEmpty() ? 'Database seeded.' : 'Database already has data; pass --reset to reseed.');
  await ensureFoundingAdmin();
}
