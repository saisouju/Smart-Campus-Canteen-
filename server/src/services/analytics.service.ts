import type { AnalyticsSummary, DailyEarning, MenuCategory, PopularItem, TopCustomer } from '@canteen/shared';
import { db } from '../db/connection.js';
import { addDays, startOfWeek, toLocalDate, WEEKDAY_SHORT } from '../utils/dates.js';

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Current ISO week (Mon–Sun) earnings per day, top items and headline totals. */
export function getWeeklyAnalytics(now = new Date(), topN = 5): AnalyticsSummary {
  const monday = startOfWeek(now);
  const weekStart = toLocalDate(monday);
  const weekEnd = toLocalDate(addDays(monday, 6));

  const dailyRows = db
    .prepare(
      `SELECT date(created_at) AS day, SUM(total_amount) AS earnings, COUNT(*) AS orders
       FROM orders
       WHERE date(created_at) BETWEEN ? AND ?
       GROUP BY date(created_at)
       ORDER BY day`,
    )
    .all(weekStart, weekEnd) as { day: string; earnings: number; orders: number }[];

  // GROUP BY only yields days that have orders; fill the gaps so the chart always spans Mon–Sun.
  const byDay = new Map(dailyRows.map((r) => [r.day, r]));
  const weeklyEarnings: DailyEarning[] = WEEKDAY_SHORT.map((label, i) => {
    const date = toLocalDate(addDays(monday, i));
    const row = byDay.get(date);
    return { date, day: label, earnings: round2(row?.earnings ?? 0), orders: row?.orders ?? 0 };
  });

  const popularRows = db
    .prepare(
      `SELECT m.id, m.name, m.category,
              SUM(oi.quantity) AS quantity,
              SUM(oi.quantity * oi.price_at_order) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN menu_items m ON m.id = oi.menu_item_id
       WHERE date(o.created_at) BETWEEN ? AND ?
       GROUP BY m.id
       ORDER BY quantity DESC, revenue DESC
       LIMIT ?`,
    )
    .all(weekStart, weekEnd, topN) as {
    id: string;
    name: string;
    category: MenuCategory;
    quantity: number;
    revenue: number;
  }[];

  const popularItems: PopularItem[] = popularRows.map((r) => ({
    menuItemId: r.id,
    name: r.name,
    category: r.category,
    quantity: r.quantity,
    revenue: round2(r.revenue),
  }));

  const { active } = db
    .prepare(`SELECT COUNT(*) AS active FROM orders WHERE status != 'completed' AND date(created_at) = ?`)
    .get(toLocalDate(now)) as { active: number };

  const weekRevenue = round2(weeklyEarnings.reduce((sum, d) => sum + d.earnings, 0));
  const weekOrders = weeklyEarnings.reduce((sum, d) => sum + d.orders, 0);

  return {
    weekStart,
    weekEnd,
    weeklyEarnings,
    popularItems,
    totals: {
      weekRevenue,
      weekOrders,
      averageOrderValue: weekOrders ? round2(weekRevenue / weekOrders) : 0,
      activeOrders: active,
    },
  };
}

/** All-time leaderboard: who has ordered the most items so far. */
export function getTopCustomers(limit = 10): TopCustomer[] {
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role,
              COUNT(DISTINCT o.id)                    AS orders,
              SUM(oi.quantity)                        AS items,
              SUM(oi.quantity * oi.price_at_order)    AS spent,
              MAX(o.created_at)                       AS last_order_at
       FROM orders o
       JOIN users u        ON u.id = o.user_id
       JOIN order_items oi ON oi.order_id = o.id
       GROUP BY u.id
       ORDER BY items DESC, spent DESC, u.name ASC
       LIMIT ?`,
    )
    .all(limit) as {
    id: string;
    name: string;
    email: string;
    role: TopCustomer['role'];
    orders: number;
    items: number;
    spent: number;
    last_order_at: string;
  }[];

  return rows.map((r) => ({
    userId: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    orders: r.orders,
    items: r.items,
    spent: round2(r.spent),
    lastOrderAt: r.last_order_at,
  }));
}
