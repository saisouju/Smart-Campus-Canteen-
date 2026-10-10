// config must be imported first: it loads server/.env before other modules read process.env.
import { config, googleConfigured } from './config.js';
import { createApp } from './app.js';
import { DB_PATH } from './db/connection.js';
import { pruneExpiredSessions } from './services/auth.service.js';
import { initializeServerData } from './db/initialize.js';

await initializeServerData();
setInterval(() => void pruneExpiredSessions(), 60 * 60_000).unref();

if (!googleConfigured) {
  console.warn('⚠ GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing: sign-in is disabled. See server/.env.example');
}

createApp().listen(config.port, () => {
  console.log(`Canteen API listening on http://localhost:${config.port}/api  (db: ${DB_PATH})`);
  console.log(`Google redirect URI: ${config.google.redirectUri}`);
});
