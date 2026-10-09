import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import type { AuthState } from '@canteen/shared';
import { config, googleConfigured } from '../config.js';
import { cookieOptions, readCookie, SESSION_COOKIE } from '../middleware/auth.js';
import {
  createSession,
  deleteSession,
  isAllowedEmail,
  upsertSignedInUser,
} from '../services/auth.service.js';

export const authRouter = Router();

const OAUTH_COOKIE = 'canteen_oauth';
const OAUTH_TTL_MS = 10 * 60_000;

const oauthClient = () =>
  new OAuth2Client({
    clientId: config.google.clientId,
    clientSecret: config.google.clientSecret,
    redirectUri: config.google.redirectUri,
  });

/** Sends the browser back to the app, optionally with an error code the login page explains. */
const backToApp = (error?: string) => `${config.publicUrl}/${error ? `?authError=${error}` : ''}`;

/** GET /api/auth/me — current user (or null) and whether Google sign-in is available. */
authRouter.get('/me', (_req, res) => {
  res.json({ user: res.locals.user ?? null, googleConfigured } satisfies AuthState);
});

/** GET /api/auth/google — starts the OAuth flow (state + PKCE, restricted to the domain). */
authRouter.get('/google', async (_req, res) => {
  if (!googleConfigured) return res.redirect(backToApp('not_configured'));

  const client = oauthClient();
  const state = randomBytes(16).toString('base64url');
  const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();

  // State and PKCE verifier ride in a short-lived httpOnly cookie, checked on callback.
  res.cookie(OAUTH_COOKIE, `${state}.${codeVerifier}`, cookieOptions(OAUTH_TTL_MS));
  res.redirect(
    client.generateAuthUrl({
      scope: ['openid', 'email', 'profile'],
      state,
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
      hd: config.allowedDomain, // UI hint only; enforced below
      prompt: 'select_account',
    }),
  );
});

/** GET /api/auth/google/callback — verifies the ID token and enforces the email domain. */
authRouter.get('/google/callback', async (req, res) => {
  // State is base64url (no dots); the PKCE verifier may contain dots, so split once.
  const stored = readCookie(req, OAUTH_COOKIE) ?? '';
  const dot = stored.indexOf('.');
  const expectedState = dot > 0 ? stored.slice(0, dot) : '';
  const codeVerifier = dot > 0 ? stored.slice(dot + 1) : '';
  res.clearCookie(OAUTH_COOKIE, { path: '/' });

  const { code, state, error } = req.query;
  if (error) return res.redirect(backToApp('cancelled'));
  if (typeof code !== 'string' || !expectedState || state !== expectedState || !codeVerifier) {
    return res.redirect(backToApp('state'));
  }

  try {
    const client = oauthClient();
    const { tokens } = await client.getToken({ code, codeVerifier });
    if (!tokens.id_token) return res.redirect(backToApp('google'));

    // Checks signature, issuer, audience and expiry.
    const payload = (await client.verifyIdToken({ idToken: tokens.id_token, audience: config.google.clientId })).getPayload();
    const email = payload?.email;

    const domainOk =
      email !== undefined &&
      payload?.email_verified === true &&
      isAllowedEmail(email) &&
      // Workspace accounts carry `hd`; when present it must match too.
      (payload.hd === undefined || payload.hd === config.allowedDomain);
    if (!domainOk) return res.redirect(backToApp('domain'));

    const user = upsertSignedInUser(email, payload?.name);
    const token = createSession(user.id);
    res.cookie(SESSION_COOKIE, token, cookieOptions(config.sessionTtlDays * 86_400_000));
    res.redirect(backToApp());
  } catch (e) {
    console.error('Google sign-in failed:', e instanceof Error ? e.message : e);
    res.redirect(backToApp('google'));
  }
});

/** POST /api/auth/logout */
authRouter.post('/logout', (req, res) => {
  const token = readCookie(req, SESSION_COOKIE);
  if (token) deleteSession(token);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.status(204).end();
});
