import type { AdminEmail, AnalyticsSummary, MenuItem, Order, TimeSlot, TopCustomer, User } from '@canteen/shared';

/** Deterministic sample data shared by every Storybook story. */

export const users: User[] = [
  { id: 'u-student-aarav', name: 'Aarav Sharma', email: 'aarav.sharma@demo.invalid', role: 'student' },
  { id: 'u-student-diya', name: 'Diya Patel', email: 'diya.patel@demo.invalid', role: 'student' },
  { id: 'u-faculty-meera', name: 'Meera Iyer', email: 'meera.iyer@demo.invalid', role: 'faculty' },
  { id: 'u-admin-nanna', name: 'Nanna Saisoujanya', email: 'nanna.saisoujanya@klh.edu.in', role: 'admin' },
];

export const menu: MenuItem[] = [
  { id: 'masala-dosa', name: 'Masala Dosa', category: 'Breakfast', price: 60, isAvailable: true },
  { id: 'idli-sambar', name: 'Idli Sambar', category: 'Breakfast', price: 40, isAvailable: true },
  { id: 'upma', name: 'Upma', category: 'Breakfast', price: 35, isAvailable: false },
  { id: 'chicken-biryani', name: 'Chicken Biryani', category: 'Lunch', price: 150, isAvailable: true },
  { id: 'veg-thali', name: 'Veg Thali', category: 'Lunch', price: 110, isAvailable: true },
  { id: 'samosa', name: 'Samosa (2 pcs)', category: 'Snacks', price: 30, isAvailable: true },
  { id: 'pav-bhaji', name: 'Pav Bhaji', category: 'Snacks', price: 70, isAvailable: true },
  { id: 'masala-chai', name: 'Masala Chai', category: 'Drinks', price: 15, isAvailable: true },
  { id: 'cold-coffee', name: 'Cold Coffee', category: 'Drinks', price: 55, isAvailable: true },
];

export const menuById = Object.fromEntries(menu.map((m) => [m.id, m])) as Record<string, MenuItem>;

export const timeSlots: TimeSlot[] = [
  { id: '2026-10-07@12:00-12:30', label: '12:00 PM - 12:30 PM', remaining: 0, available: false },
  { id: '2026-10-07@12:30-13:00', label: '12:30 PM - 1:00 PM', remaining: 3, available: true },
  { id: '2026-10-07@13:00-13:30', label: '1:00 PM - 1:30 PM', remaining: 12, available: true },
  { id: '2026-10-07@13:30-14:00', label: '1:30 PM - 2:00 PM', remaining: 15, available: true },
];

export const sampleOrder: Order = {
  id: 'ORD-7K2Q9F',
  userId: 'u-student-aarav',
  userName: 'Aarav Sharma',
  totalAmount: 285,
  timeSlot: '12:30 PM - 1:00 PM',
  status: 'preparing',
  verificationToken: 'a1b2c3d4e5f67890abcdef1234567890',
  createdAt: '2026-10-07 12:04:31',
  items: [
    { menuItemId: 'chicken-biryani', name: 'Chicken Biryani', quantity: 1, priceAtOrder: 150 },
    { menuItemId: 'samosa', name: 'Samosa (2 pcs)', quantity: 2, priceAtOrder: 30 },
    { menuItemId: 'masala-chai', name: 'Masala Chai', quantity: 5, priceAtOrder: 15 },
  ],
};

export const queue: Order[] = [
  { ...sampleOrder, id: 'ORD-A1', status: 'ready', createdAt: '2026-10-07 11:41:02' },
  { ...sampleOrder, id: 'ORD-B2', status: 'preparing', userName: 'Diya Patel', createdAt: '2026-10-07 11:52:40', totalAmount: 110, items: [{ menuItemId: 'veg-thali', name: 'Veg Thali', quantity: 1, priceAtOrder: 110 }] },
  { ...sampleOrder, id: 'ORD-C3', status: 'placed', userName: 'Dr. Meera Iyer', timeSlot: '1:00 PM - 1:30 PM', createdAt: '2026-10-07 12:10:15', totalAmount: 75, items: [{ menuItemId: 'cold-coffee', name: 'Cold Coffee', quantity: 1, priceAtOrder: 55 }, { menuItemId: 'filter-coffee', name: 'Filter Coffee', quantity: 1, priceAtOrder: 20 }] },
  { ...sampleOrder, id: 'ORD-D4', status: 'completed', createdAt: '2026-10-07 10:05:00' },
];

export const analytics: AnalyticsSummary = {
  weekStart: '2026-10-05',
  weekEnd: '2026-10-11',
  weeklyEarnings: [
    { date: '2026-10-05', day: 'Mon', earnings: 6130, orders: 35 },
    { date: '2026-10-06', day: 'Tue', earnings: 5660, orders: 29 },
    { date: '2026-10-07', day: 'Wed', earnings: 1840, orders: 10 },
    { date: '2026-10-08', day: 'Thu', earnings: 0, orders: 0 },
    { date: '2026-10-09', day: 'Fri', earnings: 0, orders: 0 },
    { date: '2026-10-10', day: 'Sat', earnings: 0, orders: 0 },
    { date: '2026-10-11', day: 'Sun', earnings: 0, orders: 0 },
  ],
  popularItems: [
    { menuItemId: 'masala-dosa', name: 'Masala Dosa', category: 'Breakfast', quantity: 29, revenue: 1740 },
    { menuItemId: 'masala-chai', name: 'Masala Chai', category: 'Drinks', quantity: 26, revenue: 390 },
    { menuItemId: 'filter-coffee', name: 'Filter Coffee', category: 'Drinks', quantity: 23, revenue: 460 },
    { menuItemId: 'veg-thali', name: 'Veg Thali', category: 'Lunch', quantity: 17, revenue: 1870 },
    { menuItemId: 'samosa', name: 'Samosa (2 pcs)', category: 'Snacks', quantity: 17, revenue: 510 },
  ],
  totals: { weekRevenue: 13630, weekOrders: 74, averageOrderValue: 184.19, activeOrders: 7 },
};

export const adminEmails: AdminEmail[] = [
  { email: 'nanna.saisoujanya@klh.edu.in', addedBy: 'system', addedAt: '2026-10-01 09:00:00', permanent: true, hasSignedIn: true },
  { email: 'canteen.manager@klh.edu.in', addedBy: 'nanna.saisoujanya@klh.edu.in', addedAt: '2026-10-03 11:20:00', permanent: false, hasSignedIn: true },
  { email: 'night.shift@klh.edu.in', addedBy: 'nanna.saisoujanya@klh.edu.in', addedAt: '2026-10-06 18:05:00', permanent: false, hasSignedIn: false },
];

const leaderboard: [string, TopCustomer['role'], number, number, number][] = [
  ['Aarav Sharma', 'student', 214, 96, 15890],
  ['Kiran Reddy', 'student', 188, 81, 13420],
  ['Diya Patel', 'student', 161, 70, 12110],
  ['Sneha Rao', 'student', 133, 58, 9870],
  ['Meera Iyer', 'faculty', 117, 49, 10240],
  ['Rahul Menon', 'student', 104, 45, 7310],
  ['Arjun Varma', 'student', 91, 40, 6550],
  ['Lakshmi Naidu', 'faculty', 72, 31, 6120],
  ['Priya Gupta', 'student', 66, 29, 4480],
  ['Vikram Singh', 'student', 43, 19, 3010],
];

export const topCustomers: TopCustomer[] = leaderboard.map(([name, role, items, orders, spent], i) => ({
  userId: `demo-${i}`,
  name,
  email: name.toLowerCase().replace(' ', '.') + '@demo.invalid',
  role,
  orders,
  items,
  spent,
  lastOrderAt: '2026-10-07 12:30:00',
}));
