import assert from 'node:assert/strict';
import test from 'node:test';

import { getCurrentTemperature, getTemperatureStatus, setTemperatureFromHardware } from './canteenTemperature.js';

test('temperature status labels match expected ranges', () => {
    assert.equal(getTemperatureStatus(19), 'Cool');
    assert.equal(getTemperatureStatus(25), 'Comfortable');
    assert.equal(getTemperatureStatus(29), 'Warm');
    assert.equal(getTemperatureStatus(32), 'Hot');
});

test('hardware reading clamps to valid temperature range', () => {
    const reading = setTemperatureFromHardware(48);
    assert.ok(reading.celsius <= 40);
    assert.equal(reading.source, 'hardware');
});

test('hardware temperature is stored as the current reading', () => {
    const reading = setTemperatureFromHardware(24.5);
    assert.equal(getCurrentTemperature().updatedAt, reading.updatedAt);
    assert.equal(getCurrentTemperature().source, 'hardware');
});
