import { Router, type Response } from 'express';
import type { Order } from '@canteen/shared';
import { currentUser, requireAuth } from '../middleware/auth.js';
import { getOrder, getTimeSlots, listOrdersForUser, placeOrder } from '../services/order.service.js';
import { notFound } from '../utils/httpError.js';
import { placeOrderSchema } from './schemas.js';

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

/** Customers may only see their own orders; admins see all. Others get a 404, not a 403, to avoid leaking ids. */
async function getVisibleOrder(res: Response, id: string): Promise<Order> {
  const user = currentUser(res);
  const order = await getOrder(id);
  if (user.role !== 'admin' && order.userId !== user.id) throw notFound('Order');
  return order;
}

/** GET /api/orders/time-slots — bookable pickup windows with remaining capacity. */
ordersRouter.get('/time-slots', async (_req, res) => {
  res.json(await getTimeSlots());
});

/** POST /api/orders — orders for the signed-in user; validates cart, maps slot id → label, prices from DB. */
ordersRouter.post('/', async (req, res) => {
  res.status(201).json(await placeOrder(currentUser(res).id, placeOrderSchema.parse(req.body)));
});

/** GET /api/orders/mine — the signed-in user's recent orders. */
ordersRouter.get('/mine', async (_req, res) => {
  res.json(await listOrdersForUser(currentUser(res).id));
});

/** GET /api/orders/track/:id — current snapshot of one order. */
ordersRouter.get('/track/:id', async (req, res) => {
  res.json(await getVisibleOrder(res, req.params.id));
});
