import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { User } from '@canteen/shared';
import { config } from '../config.js';
import { db } from '../db/connection.js';
import { addDays, toLocalDateTime } from '../utils/dates.js';
import { isAdminEmail } from './adminAccess.service.js';

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** True only for addresses whose domain is exactly the allowed one (not "evil-klh.edu.in"). */
export function isAllowedEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf('@');
  return at > 0 && normalized.slice(at + 1) === config.allowedDomain;
}

const titleCase = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * Display name from the mailbox name:
 *   "nanna.saisoujanya@klh.edu.in" → "Nanna Saisoujanya"
 *   "ravi_kumar23@klh.edu.in"      → "Ravi Kumar"
 * Roll-number-only mailboxes ("2210030145@…") have no name in them, so the
 * Google profile name (or the mailbox itself) is used instead.
 */
export function nameFromEmail(email: string, fallback?: string): string {
  const local = normalizeEmail(email).split('@')[0] ?? '';
  const words = local
    .replace(/[0-9]+/g, ' ')
    .split(/[._\-+\s]+/)
    .filter((w) => w.length > 0);
  if (words.length > 0) return words.map(titleCase).join(' ');
  return fallback?.trim() || local;
}

/** Creates the user on first sign-in, refreshes name/role on later ones. */
export async function upsertSignedInUser(rawEmail: string, profileName?: string): Promise<User> {
  const email = normalizeEmail(rawEmail);
  const name = nameFromEmail(email, profileName);
  const existing = await db.prepare('SELECT id, role FROM users WHERE lower(email) = ?').get(email) as
    | { id: string; role: User['role'] }
    | undefined;

  const role: User['role'] = await isAdminEmail(email)
    ? 'admin'
    : existing?.role === 'faculty'
      ? 'faculty'
      : 'student';

  if (existing) {
    await db.prepare('UPDATE users SET name = ?, role = ? WHERE id = ?').run(name, role, existing.id);
    return { id: existing.id, name, email, role };
  }
  const id = randomUUID();
  await db.prepare('INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)').run(id, name, email, role);
  return { id, name, email, role };
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** Returns the raw cookie token; only its hash is persisted. */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const expires = toLocalDateTime(addDays(new Date(), config.sessionTtlDays));
  await db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(
    hashToken(token),
    userId,
    expires,
  );
  return token;
}

export async function getSessionUser(token: string): Promise<User | undefined> {
  return await db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(hashToken(token), toLocalDateTime(new Date())) as User | undefined;
}

export async function deleteSession(token: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

export async function pruneExpiredSessions(): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(toLocalDateTime(new Date()));
}
