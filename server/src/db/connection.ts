import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { applySchema } from './schema.js';

/** SQLite file location; override with DB_PATH (use ":memory:" for throwaway runs). */
export const DB_PATH = config.dbPath;

function open(): Database.Database {
  if (DB_PATH !== ':memory:') fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  applySchema(db);
  return db;
}

export const db = open();
