import { Router, type Response } from 'express';
import type { Order } from '@canteen/shared';
import { currentUser, requireAuth } from '../middleware/auth.js';
import { orderEvents } from '../services/orderEvents.js';
import { getOrder, getTimeSlots, listOrdersForUser, placeOrder } from '../services/order.service.js';
import { notFound } from '../utils/httpError.js';
import { openSse } from '../utils/sse.js';
import { placeOrderSchema } from './schemas.js';

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

/** Customers may only see their own orders; admins see all. Others get a 404, not a 403, to avoid leaking ids. */
function getVisibleOrder(res: Response, id: string): Order {
  const user = currentUser(res);
  const order = getOrder(id);
  if (user.role !== 'admin' && order.userId !== user.id) throw notFound('Order');
  return order;
}

/** GET /api/orders/time-slots — bookable pickup windows with remaining capacity. */
ordersRouter.get('/time-slots', (_req, res) => {
  res.json(getTimeSlots());
});

/** POST /api/orders — orders for the signed-in user; validates cart, maps slot id → label, prices from DB. */
ordersRouter.post('/', (req, res) => {
  res.status(201).json(placeOrder(currentUser(res).id, placeOrderSchema.parse(req.body)));
});

/** GET /api/orders/mine/stream — SSE for changes to the signed-in user's orders. */
ordersRouter.get('/mine/stream', (req, res) => {
  const userId = currentUser(res).id;
  const unsubscribe = orderEvents.subscribe(({ order }) => {
    if (order.userId === userId) send('change', { id: order.id, status: order.status });
  });
  const send = openSse(req, res, unsubscribe);
  send('ready', { ok: true });
});

/** GET /api/orders/mine — the signed-in user's recent orders. */
ordersRouter.get('/mine', (_req, res) => {
  res.json(listOrdersForUser(currentUser(res).id));
});

/** GET /api/orders/track/:id — current snapshot of one order. */
ordersRouter.get('/track/:id', (req, res) => {
  res.json(getVisibleOrder(res, req.params.id));
});

/** GET /api/orders/track/:id/stream — SSE: pushes the order whenever its status changes. */
ordersRouter.get('/track/:id/stream', (req, res) => {
  const order = getVisibleOrder(res, req.params.id); // 404s before the stream opens
  const unsubscribe = orderEvents.subscribe((event) => {
    if (event.order.id === order.id) send('status', event.order);
  });
  const send = openSse(req, res, unsubscribe);
  send('status', order);
});
