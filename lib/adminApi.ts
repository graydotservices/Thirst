import { supabase } from './supabase';
import { requestSignal } from './requestSignal';

export class ApiRequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Refreshes the existing Supabase session when needed; no inactivity timer.
export async function adminApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new ApiRequestError(401, 'Please sign in to continue');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);
  if (init.body) headers.set('Content-Type', 'application/json');
  // Bound network waits, without changing session lifetime. Checkout keeps its
  // idempotency key when a timeout leaves the result uncertain.
  const signal = requestSignal(init.signal);
  const response = await fetch(path, { ...init, signal, headers, cache: 'no-store', credentials: 'same-origin' });
  const result = await response.json();
  if (!response.ok) throw new ApiRequestError(response.status, result.error || 'Unable to complete this action');
  return result as T;
}
