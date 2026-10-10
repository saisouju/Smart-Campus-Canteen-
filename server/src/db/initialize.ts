import { ensureFoundingAdmin } from '../services/adminAccess.service.js';
import { pruneExpiredSessions } from '../services/auth.service.js';
import { initializeDatabase } from './connection.js';
import { seedIfEmpty } from './seed.js';

let initialization: Promise<void> | undefined;

export function initializeServerData(): Promise<void> {
    initialization ??= (async () => {
        await initializeDatabase();
        if (await seedIfEmpty()) console.log('Initialized empty database');
        await ensureFoundingAdmin();
        await pruneExpiredSessions();
    })();
    return initialization;
}
