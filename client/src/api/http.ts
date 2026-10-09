import type { ApiError } from '@canteen/shared';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export function apiUrl(path: string) {
  return `${BASE}${path}`;
}

/** Called on any 401 so the app can drop back to the sign-in screen. */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: init.method ?? 'GET',
    // The session lives in an httpOnly cookie; the browser attaches it.
    credentials: 'include',
    headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const payload = res.status === 204 ? undefined : await res.json().catch(() => undefined);
  if (!res.ok) {
    if (res.status === 401) onUnauthorized?.();
    const err = payload as ApiError | undefined;
    throw new ApiRequestError(res.status, err?.error ?? `Request failed (${res.status})`, err?.details);
  }
  return payload as T;
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
