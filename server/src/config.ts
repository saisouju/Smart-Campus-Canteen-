import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALLOWED_EMAIL_DOMAIN } from '@canteen/shared';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Load server/.env (if present) before anything reads process.env. Real env vars win.
const envFile = path.join(serverRoot, '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const env = process.env;
const publicUrl = (env.PUBLIC_URL ?? 'http://localhost:5173').replace(/\/$/, '');

export const config = {
  port: Number(env.PORT ?? 4000),
  dbPath: env.DB_PATH ?? path.join(serverRoot, 'data', 'canteen.db'),
  /** Origin the browser uses (Vite dev server in development). */
  publicUrl,
  corsOrigin: env.CORS_ORIGIN?.split(',') ?? [publicUrl],
  allowedDomain: ALLOWED_EMAIL_DOMAIN,
  /** Founding admin: always an admin, cannot be removed from the admin list. */
  permanentAdminEmail: 'nanna.saisoujanya@klh.edu.in',
  sessionTtlDays: 7,
  seedDemoData: env.SEED_DEMO_DATA !== 'false',
  hardwareApiKey: env.HARDWARE_API_KEY ?? '',
  google: {
    clientId: env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
    redirectUri: `${publicUrl}/api/auth/google/callback`,
  },
  /** Cookies get the Secure flag whenever the app is served over HTTPS. */
  secureCookies: publicUrl.startsWith('https://'),
} as const;

export const googleConfigured = Boolean(config.google.clientId && config.google.clientSecret);
