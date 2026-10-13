import { supabase } from './supabase';

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
  const response = await fetch(path, { ...init, headers, cache: 'no-store', credentials: 'same-origin' });
  const result = await response.json();
  if (!response.ok) throw new ApiRequestError(response.status, result.error || 'Unable to complete this action');
  return result as T;
}
