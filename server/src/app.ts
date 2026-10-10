import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { initializeServerData } from './db/initialize.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(
    // Session cookies need an explicit origin allow-list (never "*") with credentials.
    cors({ origin: [...config.corsOrigin], credentials: true, allowedHeaders: ['Content-Type'] }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', async (_req, _res, next) => {
    await initializeServerData();
    next();
  }, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
