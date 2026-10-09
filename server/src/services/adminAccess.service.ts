import type { AdminEmail } from '@canteen/shared';
import { config } from '../config.js';
import { db } from '../db/connection.js';
import { HttpError } from '../utils/httpError.js';
import { isAllowedEmail, normalizeEmail } from './auth.service.js';

interface AdminEmailRow {
  email: string;
  added_by: string | null;
  added_at: string;
  permanent: number;
  has_signed_in: number;
}

export function isAdminEmail(email: string): boolean {
  return Boolean(db.prepare('SELECT 1 FROM admin_emails WHERE email = ?').get(normalizeEmail(email)));
}

/**
 * Makes users.role agree with admin_emails: listed emails become admin,
 * anyone else holding the admin role drops back to student.
 */
export function syncAdminRoles(): void {
  db.exec(`
    UPDATE users SET role = 'admin'
      WHERE lower(email) IN (SELECT lower(email) FROM admin_emails) AND role != 'admin';
    UPDATE users SET role = 'student'
      WHERE role = 'admin' AND lower(email) NOT IN (SELECT lower(email) FROM admin_emails);
  `);
}

/** Boot-time guarantee that the founding admin exists and is marked permanent. */
export function ensureFoundingAdmin(): void {
  db.prepare(
    `INSERT INTO admin_emails (email, added_by, permanent) VALUES (?, 'system', 1)
     ON CONFLICT(email) DO UPDATE SET permanent = 1`,
  ).run(normalizeEmail(config.permanentAdminEmail));
  syncAdminRoles();
}

export function listAdminEmails(): AdminEmail[] {
  const rows = db
    .prepare(
      `SELECT a.email, a.added_by, a.added_at, a.permanent,
              EXISTS (SELECT 1 FROM users u WHERE lower(u.email) = lower(a.email)) AS has_signed_in
       FROM admin_emails a
       ORDER BY a.permanent DESC, a.added_at ASC`,
    )
    .all() as AdminEmailRow[];
  return rows.map((r) => ({
    email: r.email,
    addedBy: r.added_by,
    addedAt: r.added_at,
    permanent: r.permanent === 1,
    hasSignedIn: r.has_signed_in === 1,
  }));
}

export function addAdminEmail(rawEmail: string, addedBy: string): AdminEmail[] {
  const email = normalizeEmail(rawEmail);
  if (!isAllowedEmail(email)) throw new HttpError(400, `Only @${config.allowedDomain} addresses can be admins`);
  if (isAdminEmail(email)) throw new HttpError(409, `${email} is already an admin`);
  db.prepare('INSERT INTO admin_emails (email, added_by) VALUES (?, ?)').run(email, addedBy);
  syncAdminRoles(); // takes effect on their very next request
  return listAdminEmails();
}

export function removeAdminEmail(rawEmail: string): AdminEmail[] {
  const email = normalizeEmail(rawEmail);
  const row = db.prepare('SELECT permanent FROM admin_emails WHERE email = ?').get(email) as
    | { permanent: number }
    | undefined;
  if (!row) throw new HttpError(404, `${email} is not an admin`);
  if (row.permanent) throw new HttpError(403, `${email} is the founding admin and cannot be removed`);
  db.prepare('DELETE FROM admin_emails WHERE email = ?').run(email);
  syncAdminRoles();
  return listAdminEmails();
}
