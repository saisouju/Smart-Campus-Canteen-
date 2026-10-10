import { Router } from 'express';
import { getCurrentTemperature } from '../services/canteenTemperature.js';

export const temperatureRouter = Router();

temperatureRouter.get('/', async (_req, res) => {
    res.json(await getCurrentTemperature());
});
