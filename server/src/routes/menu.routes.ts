import { Router, type Request } from 'express';
import { requireRole } from '../middleware/auth.js';
import { createMenuItem, listMenu, updateMenuItem } from '../services/menu.service.js';
import { newMenuItemSchema, updateMenuItemSchema } from './schemas.js';

export const menuRouter = Router();

/** GET /api/menu — full menu; unavailable items are included and flagged. */
menuRouter.get('/', async (_req, res) => {
  res.json(await listMenu());
});

/** POST /api/menu — admin: add a dish. */
menuRouter.post('/', requireRole('admin'), async (req, res) => {
  const item = await createMenuItem(newMenuItemSchema.parse(req.body));
  res.status(201).json(item);
});

/** PATCH /api/menu/:id — admin: edit price/name or toggle availability. */
menuRouter.patch('/:id', requireRole('admin'), async (req: Request<{ id: string }>, res) => {
  res.json(await updateMenuItem(req.params.id, updateMenuItemSchema.parse(req.body)));
});
