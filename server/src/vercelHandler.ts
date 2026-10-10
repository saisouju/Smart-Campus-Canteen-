import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Request, Response } from 'express';
import { createApp } from './app.js';

const app = createApp();

export function vercelHandler(request: VercelRequest, response: VercelResponse) {
    return app(request as unknown as Request, response as unknown as Response);
}