export function buildOrderVerificationPayload(orderId: string, verificationToken: string): string {
    const safeOrderId = orderId.trim();
    const safeToken = verificationToken.trim();

    if (!safeOrderId || !safeToken) {
        throw new Error('Order id and verification token are required');
    }

    return `canteen://verify/${safeOrderId}/${safeToken}`;
}

export function verifyOrderVerificationPayload(orderId: string, payload: string): boolean {
    const trimmed = payload?.trim();
    if (!trimmed || !trimmed.startsWith('canteen://verify/')) return false;

    const rest = trimmed.slice('canteen://verify/'.length);
    const [actualOrderId, actualToken] = rest.split('/');

    if (!actualOrderId || !actualToken) return false;
    return actualOrderId === orderId && actualToken.length >= 6;
}
