import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOrderVerificationPayload, verifyOrderVerificationPayload } from './orderVerification.js';

test('QR payload is unique and verifies the correct order', () => {
    const payloadA = buildOrderVerificationPayload('ORD-TEST-1', 'token-1234567890abcd');
    const payloadB = buildOrderVerificationPayload('ORD-TEST-1', 'token-abcdef123456789');

    assert.ok(payloadA.startsWith('canteen://verify/ORD-TEST-1/'));
    assert.notEqual(payloadA, payloadB);
    assert.equal(verifyOrderVerificationPayload('ORD-TEST-1', payloadA), true);
    assert.equal(verifyOrderVerificationPayload('ORD-TEST-2', payloadA), false);
});
