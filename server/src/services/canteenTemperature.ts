export interface CanteenTemperatureReading {
    celsius: number;
    updatedAt: string;
    source: 'simulated' | 'hardware';
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const HARDWARE_READING_TTL_MS = 30_000;

const state: CanteenTemperatureReading = {
    celsius: 26.8,
    updatedAt: new Date().toISOString(),
    source: 'simulated',
};

const listeners = new Set<(reading: CanteenTemperatureReading) => void>();

export function getTemperatureStatus(celsius: number): 'Cool' | 'Comfortable' | 'Warm' | 'Hot' {
    if (celsius < 20) return 'Cool';
    if (celsius < 27) return 'Comfortable';
    if (celsius < 31) return 'Warm';
    return 'Hot';
}

export function getCurrentTemperature(): CanteenTemperatureReading {
    return { ...state };
}

export function setTemperatureFromHardware(celsius: number): CanteenTemperatureReading {
    const next = Number(celsius);
    const safe = clamp(Number.isFinite(next) ? next : state.celsius, 12, 40);
    const reading = {
        celsius: Number(safe.toFixed(1)),
        updatedAt: new Date().toISOString(),
        source: 'hardware' as const,
    };

    state.celsius = reading.celsius;
    state.updatedAt = reading.updatedAt;
    state.source = reading.source;

    for (const listener of listeners) listener({ ...reading });
    return { ...reading };
}

export function subscribeToTemperature(listener: (reading: CanteenTemperatureReading) => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function tickSensor(): void {
    if (
        state.source === 'hardware' &&
        Date.now() - new Date(state.updatedAt).getTime() < HARDWARE_READING_TTL_MS
    ) {
        return;
    }

    const drift = (Math.random() - 0.5) * 1.6;
    const next = clamp(Number((state.celsius + drift).toFixed(1)), 18, 33);

    if (Math.abs(next - state.celsius) < 0.1) {
        state.celsius = clamp(Number((state.celsius + 0.2).toFixed(1)), 18, 33);
    } else {
        state.celsius = next;
    }

    state.updatedAt = new Date().toISOString();
    state.source = 'simulated';

    for (const listener of listeners) listener({ ...state });
}

setInterval(tickSensor, 5000).unref();
