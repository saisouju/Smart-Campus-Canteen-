import { createClient, type Client, type InArgs, type Transaction } from '@libsql/client/web';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { applySchema } from './schema.js';

if (process.env.VERCEL === '1' && (!config.tursoDatabaseUrl || !config.tursoAuthToken)) {
  throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required on Vercel');
}

type SqlParameter = string | number | bigint | boolean | Uint8Array | null;
type SqlRow = unknown;

export interface AsyncStatement {
  get(...params: SqlParameter[]): Promise<SqlRow | undefined>;
  all(...params: SqlParameter[]): Promise<SqlRow[]>;
  run(...params: SqlParameter[]): Promise<{ changes: number; lastInsertRowid: number | bigint }>;
}

export interface AsyncDatabase {
  prepare(sql: string): AsyncStatement;
  exec(sql: string): Promise<void>;
  transaction<T>(callback: (transaction: AsyncDatabase) => Promise<T>): Promise<T>;
}

/** Local path for development; production uses TURSO_DATABASE_URL. */
export const DB_PATH = config.dbPath;

class LocalDatabase implements AsyncDatabase {
  private queue = Promise.resolve();

  constructor(private readonly raw: Database.Database, private readonly inTransaction = false) { }

  private async exclusive<T>(operation: () => T | Promise<T>): Promise<T> {
    if (this.inTransaction) return operation();
    const previous = this.queue;
    let release!: () => void;
    this.queue = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  prepare(sql: string): AsyncStatement {
    return {
      get: (...params) => this.exclusive(() => this.raw.prepare(sql).get(...params) as SqlRow | undefined),
      all: (...params) => this.exclusive(() => this.raw.prepare(sql).all(...params) as SqlRow[]),
      run: (...params) => this.exclusive(() => {
        const result = this.raw.prepare(sql).run(...params);
        return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
      }),
    };
  }

  exec(sql: string): Promise<void> {
    return this.exclusive(() => { this.raw.exec(sql); });
  }

  transaction<T>(callback: (transaction: AsyncDatabase) => Promise<T>): Promise<T> {
    return this.exclusive(async () => {
      this.raw.exec('BEGIN IMMEDIATE');
      try {
        const result = await callback(new LocalDatabase(this.raw, true));
        this.raw.exec('COMMIT');
        return result;
      } catch (error) {
        this.raw.exec('ROLLBACK');
        throw error;
      }
    });
  }
}

class RemoteDatabase implements AsyncDatabase {
  constructor(private readonly executor: Client | Transaction) { }

  prepare(sql: string): AsyncStatement {
    return {
      get: async (...params) => {
        const result = await this.executor.execute({ sql, args: params as InArgs });
        return result.rows[0] as SqlRow | undefined;
      },
      all: async (...params) => {
        const result = await this.executor.execute({ sql, args: params as InArgs });
        return result.rows as SqlRow[];
      },
      run: async (...params) => {
        const result = await this.executor.execute({ sql, args: params as InArgs });
        return { changes: result.rowsAffected, lastInsertRowid: result.lastInsertRowid ?? 0 };
      },
    };
  }

  async exec(sql: string): Promise<void> {
    if (!('executeMultiple' in this.executor)) throw new Error('Multi-statement SQL is not supported in a transaction');
    await this.executor.executeMultiple(sql);
  }

  async transaction<T>(callback: (transaction: AsyncDatabase) => Promise<T>): Promise<T> {
    if (!('transaction' in this.executor)) throw new Error('Nested transactions are not supported');
    const transaction = await this.executor.transaction('write');
    try {
      const result = await callback(new RemoteDatabase(transaction));
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

function openLocal(): AsyncDatabase {
  if (DB_PATH !== ':memory:') fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const raw = new Database(DB_PATH);
  raw.pragma('journal_mode = WAL');
  raw.pragma('foreign_keys = ON');
  return new LocalDatabase(raw);
}

export const db: AsyncDatabase = config.tursoDatabaseUrl
  ? new RemoteDatabase(createClient({
    url: config.tursoDatabaseUrl,
    ...(config.tursoAuthToken ? { authToken: config.tursoAuthToken } : {}),
  }))
  : openLocal();

let initialization: Promise<void> | undefined;
export function initializeDatabase(): Promise<void> {
  initialization ??= (async () => {
    await applySchema(db);
    await db.prepare('PRAGMA foreign_keys = ON').run();
  })();
  return initialization;
}
