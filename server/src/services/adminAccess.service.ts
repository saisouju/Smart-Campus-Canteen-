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

export async function isAdminEmail(email: string): Promise<boolean> {
  return Boolean(await db.prepare('SELECT 1 FROM admin_emails WHERE email = ?').get(normalizeEmail(email)));
}

/**
 * Makes users.role agree with admin_emails: listed emails become admin,
 * anyone else holding the admin role drops back to student.
 */
export async function syncAdminRoles(): Promise<void> {
  await db.exec(`
    UPDATE users SET role = 'admin'
      WHERE lower(email) IN (SELECT lower(email) FROM admin_emails) AND role != 'admin';
    UPDATE users SET role = 'student'
      WHERE role = 'admin' AND lower(email) NOT IN (SELECT lower(email) FROM admin_emails);
  `);
}

/** Boot-time guarantee that the founding admin exists and is marked permanent. */
export async function ensureFoundingAdmin(): Promise<void> {
  await db.prepare(
    `INSERT INTO admin_emails (email, added_by, permanent) VALUES (?, 'system', 1)
     ON CONFLICT(email) DO UPDATE SET permanent = 1`,
  ).run(normalizeEmail(config.permanentAdminEmail));
  syncAdminRoles();
}

export async function listAdminEmails(): Promise<AdminEmail[]> {
  const rows = await db
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

export async function addAdminEmail(rawEmail: string, addedBy: string): Promise<AdminEmail[]> {
  const email = normalizeEmail(rawEmail);
  if (!isAllowedEmail(email)) throw new HttpError(400, `Only @${config.allowedDomain} addresses can be admins`);
  if (await isAdminEmail(email)) throw new HttpError(409, `${email} is already an admin`);
  await db.prepare('INSERT INTO admin_emails (email, added_by) VALUES (?, ?)').run(email, addedBy);
  await syncAdminRoles(); // takes effect on their very next request
  return listAdminEmails();
}

export async function removeAdminEmail(rawEmail: string): Promise<AdminEmail[]> {
  const email = normalizeEmail(rawEmail);
  const row = await db.prepare('SELECT permanent FROM admin_emails WHERE email = ?').get(email) as
    | { permanent: number }
    | undefined;
  if (!row) throw new HttpError(404, `${email} is not an admin`);
  if (row.permanent) throw new HttpError(403, `${email} is the founding admin and cannot be removed`);
  await db.prepare('DELETE FROM admin_emails WHERE email = ?').run(email);
  await syncAdminRoles();
  return listAdminEmails();
}
