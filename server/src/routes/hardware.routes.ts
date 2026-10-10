import { Router } from 'express';
import { requireHardwareKey } from '../middleware/hardwareAuth.js';
import { listReadyOrdersForHardware } from '../services/order.service.js';
import { setTemperatureFromHardware } from '../services/canteenTemperature.js';
import { hardwareTemperatureSchema } from './schemas.js';

export const hardwareRouter = Router();
hardwareRouter.use(requireHardwareKey);

hardwareRouter.post('/temperature', async (req, res) => {
    const { celsius } = hardwareTemperatureSchema.parse(req.body);
    res.json(await setTemperatureFromHardware(celsius));
});

hardwareRouter.get('/orders', async (_req, res) => {
    res.json({ orders: await listReadyOrdersForHardware() });
});