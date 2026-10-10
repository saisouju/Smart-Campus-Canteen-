import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Request, Response } from 'express';
import { createApp } from '../server/src/app.js';

const app = createApp();

export default function handler(request: VercelRequest, response: VercelResponse) {
    return app(request as unknown as Request, response as unknown as Response);
}
