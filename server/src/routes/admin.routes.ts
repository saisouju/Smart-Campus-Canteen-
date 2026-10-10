import { Router, type Request } from 'express';
import { currentUser, requireRole } from '../middleware/auth.js';
import { addAdminEmail, listAdminEmails, removeAdminEmail } from '../services/adminAccess.service.js';
import { getTopCustomers, getWeeklyAnalytics } from '../services/analytics.service.js';
import { listTodaysOrders, updateOrderStatus, verifyOrderQrCode } from '../services/order.service.js';
import { adminEmailSchema, topCustomersQuerySchema, updateStatusSchema, verifyOrderQrSchema } from './schemas.js';

export const adminRouter = Router();
adminRouter.use(requireRole('admin'));

/** GET /api/admin/analytics — weekly earnings (GROUP BY day) + popular items. */
adminRouter.get('/analytics', async (_req, res) => {
  res.json(await getWeeklyAnalytics());
});

/** GET /api/admin/top-customers?limit=5..10 — all-time leaderboard by items ordered. */
adminRouter.get('/top-customers', async (req, res) => {
  const { limit } = topCustomersQuerySchema.parse(req.query);
  res.json(await getTopCustomers(limit));
});

/** GET /api/admin/orders — today's order queue. */
adminRouter.get('/orders', async (_req, res) => {
  res.json(await listTodaysOrders());
});

/** PATCH /api/admin/orders/:id/status — body `{ status? }`; omitting status advances one step. */
adminRouter.patch('/orders/:id/status', async (req: Request<{ id: string }>, res) => {
  const { status } = updateStatusSchema.parse(req.body ?? {});
  res.json(await updateOrderStatus(req.params.id, status));
});

/** POST /api/admin/orders/verify — confirms that a QR code belongs to the same order and user. */
adminRouter.post('/orders/verify', async (req, res) => {
  const { qrCode } = verifyOrderQrSchema.parse(req.body ?? {});
  const order = await verifyOrderQrCode(qrCode);
  res.json({
    valid: true,
    orderId: order.id,
    userName: order.userName,
    status: order.status,
    message: `QR verified for ${order.userName} (${order.id})`,
  });
});

/** GET /api/admin/admins — who has admin access. */
adminRouter.get('/admins', async (_req, res) => {
  res.json(await listAdminEmails());
});

/** POST /api/admin/admins — grant admin to a @klh.edu.in address. */
adminRouter.post('/admins', async (req, res) => {
  const { email } = adminEmailSchema.parse(req.body);
  res.status(201).json(await addAdminEmail(email, currentUser(res).email));
});

/** DELETE /api/admin/admins/:email — revoke (the founding admin is protected). */
adminRouter.delete('/admins/:email', async (req: Request<{ email: string }>, res) => {
  res.json(await removeAdminEmail(req.params.email));
});
