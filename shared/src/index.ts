/**
 * Domain types and constants shared between the Express API and the React client.
 * Keeping them in one place guarantees the wire format stays in sync.
 */

export const USER_ROLES = ['student', 'faculty', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MENU_CATEGORIES = ['Breakfast', 'Lunch', 'Snacks', 'Drinks'] as const;
export type MenuCategory = (typeof MENU_CATEGORIES)[number];

/** Order lifecycle, in the order it advances. */
export const ORDER_STATUSES = ['placed', 'preparing', 'ready', 'completed'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Placed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  completed: 'Completed',
};

/** Returns the status that follows `status`, or null when the order is already completed. */
export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUSES.indexOf(status);
  return ORDER_STATUSES[index + 1] ?? null;
}

export function buildOrderVerificationPayload(orderId: string, verificationToken: string): string {
  const safeOrderId = orderId.trim();
  const safeToken = verificationToken.trim();

  if (!safeOrderId || !safeToken) {
    throw new Error('Order id and verification token are required');
  }

  return `canteen://verify/${safeOrderId}/${safeToken}`;
}

export function verifyOrderVerificationPayload(orderId: string, payload: string): boolean {
  const trimmed = payload?.trim();
  if (!trimmed || !trimmed.startsWith('canteen://verify/')) return false;

  const rest = trimmed.slice('canteen://verify/'.length);
  const [actualOrderId, actualToken] = rest.split('/');

  if (!actualOrderId || !actualToken) return false;
  return actualOrderId === orderId && actualToken.length >= 6;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  isAvailable: boolean;
}

export interface NewMenuItem {
  name: string;
  category: MenuCategory;
  price: number;
  isAvailable: boolean;
}

export interface TimeSlot {
  /** Stable machine id, e.g. "12:00-12:30" (24h clock). */
  id: string;
  /** Human label, e.g. "12:00 PM - 12:30 PM". */
  label: string;
  /** Orders still accepted in this slot. */
  remaining: number;
  /** False once the slot has started or is fully booked. */
  available: boolean;
}

export interface OrderLineInput {
  menuItemId: string;
  quantity: number;
}

/** The ordering user comes from the session cookie, never from the request body. */
export interface PlaceOrderRequest {
  timeSlotId: string;
  items: OrderLineInput[];
}

/** Only Google accounts on this domain may sign in. */
export const ALLOWED_EMAIL_DOMAIN = 'klh.edu.in';

export interface AuthState {
  user: User | null;
  /** False when the server has no Google OAuth credentials configured. */
  googleConfigured: boolean;
}

export interface AdminEmail {
  email: string;
  addedBy: string | null;
  addedAt: string;
  /** The founding admin can never be removed. */
  permanent: boolean;
  /** Whether this person has signed in at least once. */
  hasSignedIn: boolean;
}

export interface TopCustomer {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  orders: number;
  items: number;
  spent: number;
  lastOrderAt: string;
}

export interface OrderLine {
  menuItemId: string;
  name: string;
  quantity: number;
  priceAtOrder: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  totalAmount: number;
  timeSlot: string;
  status: OrderStatus;
  createdAt: string;
  verificationToken: string;
  items: OrderLine[];
}

export interface CanteenTemperature {
  celsius: number;
  updatedAt: string;
  source: 'simulated' | 'hardware';
}

export function getTemperatureStatusLabel(celsius: number): 'Cool' | 'Comfortable' | 'Warm' | 'Hot' {
  if (celsius < 20) return 'Cool';
  if (celsius < 27) return 'Comfortable';
  if (celsius < 31) return 'Warm';
  return 'Hot';
}

export interface DailyEarning {
  /** ISO date, e.g. "2026-10-05". */
  date: string;
  /** Short weekday, e.g. "Mon". */
  day: string;
  earnings: number;
  orders: number;
}

export interface PopularItem {
  menuItemId: string;
  name: string;
  category: MenuCategory;
  quantity: number;
  revenue: number;
}

export interface AnalyticsSummary {
  weekStart: string;
  weekEnd: string;
  weeklyEarnings: DailyEarning[];
  popularItems: PopularItem[];
  totals: {
    weekRevenue: number;
    weekOrders: number;
    averageOrderValue: number;
    activeOrders: number;
  };
}

export interface ApiError {
  error: string;
  details?: unknown;
}
