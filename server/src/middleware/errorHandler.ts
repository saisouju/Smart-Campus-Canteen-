import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ApiError } from '@canteen/shared';
import { HttpError } from '../utils/httpError.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` } satisfies ApiError);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Invalid request', details: err.issues } satisfies ApiError);
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details } satisfies ApiError);
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' } satisfies ApiError);
};
