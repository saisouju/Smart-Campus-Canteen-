import { Router } from 'express';
import { getCurrentTemperature, subscribeToTemperature } from '../services/canteenTemperature.js';
import { openSse } from '../utils/sse.js';

export const temperatureRouter = Router();

temperatureRouter.get('/', (_req, res) => {
    res.json(getCurrentTemperature());
});

temperatureRouter.get('/stream', (req, res) => {
    const unsubscribe = subscribeToTemperature(() => send('temperature', getCurrentTemperature()));
    const send = openSse(req, res, unsubscribe);
    send('temperature', getCurrentTemperature());
});
