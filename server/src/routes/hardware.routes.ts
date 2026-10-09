import { Router } from 'express';
import { requireHardwareKey } from '../middleware/hardwareAuth.js';
import { listReadyOrdersForHardware } from '../services/order.service.js';
import { setTemperatureFromHardware } from '../services/canteenTemperature.js';
import { hardwareTemperatureSchema } from './schemas.js';

export const hardwareRouter = Router();
hardwareRouter.use(requireHardwareKey);

hardwareRouter.post('/temperature', (req, res) => {
    const { celsius } = hardwareTemperatureSchema.parse(req.body);
    res.json(setTemperatureFromHardware(celsius));
});

hardwareRouter.get('/orders', (_req, res) => {
    res.json({ orders: listReadyOrdersForHardware() });
});