import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { config } from '../config.js';
import { HttpError } from '../utils/httpError.js';

export const requireHardwareKey: RequestHandler = (req, _res, next) => {
    const suppliedKey = req.header('x-hardware-key');
    const configuredKey = config.hardwareApiKey;

    if (!configuredKey) {
        next(new HttpError(503, 'Hardware API is not configured'));
        return;
    }

    if (!suppliedKey) {
        next(new HttpError(401, 'Hardware API key required'));
        return;
    }

    const supplied = Buffer.from(suppliedKey);
    const expected = Buffer.from(configuredKey);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
        next(new HttpError(401, 'Invalid hardware API key'));
        return;
    }

    next();
};