import type { User } from '@canteen/shared';
import { db } from '../db/connection.js';

export function findUser(id: string): User | undefined {
  return db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id) as User | undefined;
}
