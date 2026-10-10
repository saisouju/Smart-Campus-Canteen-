import { db } from '../db/connection.js';

export interface CanteenTemperatureReading {
    celsius: number;
    updatedAt: string;
    source: 'simulated' | 'hardware';
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const HARDWARE_READING_TTL_MS = 30_000;
const SIMULATED_READING_INTERVAL_MS = 5_000;

interface TemperatureRow {
    celsius: number;
    updated_at: string;
    source: 'simulated' | 'hardware';
}

export function getTemperatureStatus(celsius: number): 'Cool' | 'Comfortable' | 'Warm' | 'Hot' {
    if (celsius < 20) return 'Cool';
    if (celsius < 27) return 'Comfortable';
    if (celsius < 31) return 'Warm';
    return 'Hot';
}

export async function getCurrentTemperature(): Promise<CanteenTemperatureReading> {
    const row = await db.prepare('SELECT celsius, updated_at, source FROM canteen_temperature WHERE id = 1').get() as TemperatureRow | undefined;
    if (!row) return { celsius: 26.8, updatedAt: new Date().toISOString(), source: 'simulated' };

    const age = Date.now() - new Date(row.updated_at).getTime();
    if (row.source === 'hardware' && age < HARDWARE_READING_TTL_MS) {
        return { celsius: row.celsius, updatedAt: row.updated_at, source: row.source };
    }
    if (row.source === 'simulated' && age < SIMULATED_READING_INTERVAL_MS) {
        return { celsius: row.celsius, updatedAt: row.updated_at, source: row.source };
    }

    const drift = (Math.random() - 0.5) * 1.6;
    const next = clamp(Number((row.celsius + drift).toFixed(1)), 18, 33);
    const celsius = Math.abs(next - row.celsius) < 0.1
        ? clamp(Number((row.celsius + 0.2).toFixed(1)), 18, 33)
        : next;
    const updatedAt = new Date().toISOString();
    await db.prepare("UPDATE canteen_temperature SET celsius = ?, updated_at = ?, source = 'simulated' WHERE id = 1")
        .run(celsius, updatedAt);
    return { celsius, updatedAt, source: 'simulated' };
}

export async function setTemperatureFromHardware(celsius: number): Promise<CanteenTemperatureReading> {
    const next = Number(celsius);
    const safe = clamp(Number.isFinite(next) ? next : 26.8, 12, 40);
    const reading: CanteenTemperatureReading = {
        celsius: Number(safe.toFixed(1)),
        updatedAt: new Date().toISOString(),
        source: 'hardware',
    };

    await db.prepare(
        `INSERT INTO canteen_temperature (id, celsius, updated_at, source) VALUES (1, ?, ?, 'hardware')
         ON CONFLICT(id) DO UPDATE SET celsius = excluded.celsius, updated_at = excluded.updated_at, source = 'hardware'`,
    ).run(reading.celsius, reading.updatedAt);
    return reading;
}
