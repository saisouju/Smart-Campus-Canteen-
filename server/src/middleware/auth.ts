import type { Request, RequestHandler, Response } from 'express';
import type { User, UserRole } from '@canteen/shared';
import { config } from '../config.js';
import { getSessionUser } from '../services/auth.service.js';
import { HttpError } from '../utils/httpError.js';

export const SESSION_COOKIE = 'canteen_session';

/** Minimal cookie reader (avoids a dependency for one header). */
export function readCookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

export const cookieOptions = (maxAgeMs: number) =>
  ({ httpOnly: true, sameSite: 'lax', secure: config.secureCookies, path: '/', maxAge: maxAgeMs }) as const;

/** Resolves the session cookie to a user on every request (role is read fresh from the DB). */
export const attachUser: RequestHandler = async (req, res, next) => {
  try {
    const token = readCookie(req, SESSION_COOKIE);
    if (token) res.locals.user = await getSessionUser(token);
    next();
  } catch (error) {
    next(error);
  }
};

export function currentUser(res: Response): User {
  const user = res.locals.user as User | undefined;
  if (!user) throw new HttpError(401, 'Please sign in');
  return user;
}

export const requireAuth: RequestHandler = (_req, res, next) => {
  currentUser(res);
  next();
};

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (_req, res, next) => {
    const user = currentUser(res);
    if (!roles.includes(user.role)) throw new HttpError(403, `Requires role: ${roles.join(' or ')}`);
    next();
  };
}
