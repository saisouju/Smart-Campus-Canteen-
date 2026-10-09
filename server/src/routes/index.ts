import { Router } from 'express';
import { attachUser } from '../middleware/auth.js';
import { adminRouter } from './admin.routes.js';
import { authRouter } from './auth.routes.js';
import { hardwareRouter } from './hardware.routes.js';
import { menuRouter } from './menu.routes.js';
import { ordersRouter } from './orders.routes.js';
import { temperatureRouter } from './temperature.routes.js';

export const apiRouter = Router();

apiRouter.use(attachUser);

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/menu', menuRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/temperature', temperatureRouter);
apiRouter.use('/hardware', hardwareRouter);
apiRouter.use('/admin', adminRouter);
