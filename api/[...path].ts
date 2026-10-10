import type { VercelRequest, VercelResponse } from '@vercel/node';
import { vercelHandler } from '../server/src/vercelHandler.js';

export default function handler(request: VercelRequest, response: VercelResponse) {
    return vercelHandler(request, response);
}
