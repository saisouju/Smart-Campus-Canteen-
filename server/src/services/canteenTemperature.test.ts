import assert from 'node:assert/strict';
import test from 'node:test';

import { initializeDatabase } from '../db/connection.js';
import { getCurrentTemperature, getTemperatureStatus, setTemperatureFromHardware } from './canteenTemperature.js';

test('initialize local schema for temperature tests', async () => {
    await initializeDatabase();
});

test('temperature status labels match expected ranges', () => {
    assert.equal(getTemperatureStatus(19), 'Cool');
    assert.equal(getTemperatureStatus(25), 'Comfortable');
    assert.equal(getTemperatureStatus(29), 'Warm');
    assert.equal(getTemperatureStatus(32), 'Hot');
});

test('hardware reading clamps to valid temperature range', async () => {
    const reading = await setTemperatureFromHardware(48);
    assert.ok(reading.celsius <= 40);
    assert.equal(reading.source, 'hardware');
});

test('hardware temperature is stored as the current reading', async () => {
    const reading = await setTemperatureFromHardware(24.5);
    const current = await getCurrentTemperature();
    assert.equal(current.updatedAt, reading.updatedAt);
    assert.equal(current.source, 'hardware');
});
