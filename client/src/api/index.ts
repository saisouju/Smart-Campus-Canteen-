import type {
  AdminEmail,
  AnalyticsSummary,
  AuthState,
  CanteenTemperature,
  MenuItem,
  NewMenuItem,
  Order,
  OrderStatus,
  PlaceOrderRequest,
  TimeSlot,
  TopCustomer,
} from '@canteen/shared';
import { apiUrl, request } from './http';

export { ApiRequestError, errorMessage, setUnauthorizedHandler } from './http';

/** Typed client for every backend route. */
export const api = {
  auth: {
    me: () => request<AuthState>('/auth/me'),
    /** Full-page navigation: Google needs a real redirect, not fetch. */
    signInUrl: apiUrl('/auth/google'),
    logout: () => request<void>('/auth/logout', { method: 'POST' }),
  },
  menu: {
    list: () => request<MenuItem[]>('/menu'),
    create: (item: NewMenuItem) => request<MenuItem>('/menu', { method: 'POST', body: item }),
    update: (id: string, patch: Partial<NewMenuItem>) =>
      request<MenuItem>(`/menu/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch }),
  },
  orders: {
    timeSlots: () => request<TimeSlot[]>('/orders/time-slots'),
    place: (order: PlaceOrderRequest) => request<Order>('/orders', { method: 'POST', body: order }),
    track: (id: string) => request<Order>(`/orders/track/${encodeURIComponent(id)}`),
    mine: () => request<Order[]>('/orders/mine'),
  },
  temperature: {
    current: () => request<CanteenTemperature>('/temperature'),
  },
  admin: {
    analytics: () => request<AnalyticsSummary>('/admin/analytics'),
    topCustomers: (limit: number) => request<TopCustomer[]>(`/admin/top-customers?limit=${limit}`),
    todaysOrders: () => request<Order[]>('/admin/orders'),
    setStatus: (id: string, status?: OrderStatus) =>
      request<Order>(`/admin/orders/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } }),
    verifyQr: (qrCode: string) =>
      request<{ valid: boolean; orderId: string; userName: string; status: OrderStatus; message: string }>(
        '/admin/orders/verify',
        { method: 'POST', body: { qrCode } },
      ),
    admins: () => request<AdminEmail[]>('/admin/admins'),
    addAdmin: (email: string) => request<AdminEmail[]>('/admin/admins', { method: 'POST', body: { email } }),
    removeAdmin: (email: string) =>
      request<AdminEmail[]>(`/admin/admins/${encodeURIComponent(email)}`, { method: 'DELETE' }),
  },
};
