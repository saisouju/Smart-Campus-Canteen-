import type { User } from '@canteen/shared';
import { db } from '../db/connection.js';

export async function findUser(id: string): Promise<User | undefined> {
  return await db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id) as User | undefined;
}
