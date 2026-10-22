import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { HttpError, object } from './validation';
import { STAFF_ROLES, type StaffRole } from './roles';

function configuration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !url.startsWith('https://')) throw new HttpError(503, 'Service is not configured');
  return { url, key };
}

export function adminClient() {
  const { url } = configuration();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new HttpError(503, 'Administrative service is not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (process.env.NODE_ENV === 'production' && !process.env.APP_ORIGIN) {
    throw new HttpError(503, 'Application origin is not configured');
  }
  const expected = process.env.APP_ORIGIN ? new URL(process.env.APP_ORIGIN).origin : new URL(request.url).origin;
  if ((origin && origin !== expected) || request.headers.get('sec-fetch-site') === 'cross-site') throw new HttpError(403, 'Cross-site requests are not allowed');
}

export async function requireStaff(request: Request, roles: readonly StaffRole[] = STAFF_ROLES) {
  sameOrigin(request);
  const token = request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9._~-]{16,8192})$/)?.[1];
  if (!token) throw new HttpError(401, 'Sign in to continue');
  const { url, key } = configuration();
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) throw new HttpError(401, 'Sign in to continue');
  if (!user.email_confirmed_at) throw new HttpError(403, 'A confirmed staff account is required');
  const { data: staff, error: staffError } = await client.from('staff')
    .select('id, auth_user_id, name, email, role, status').eq('auth_user_id', user.id).single();
  if (staffError || !staff || staff.status !== 'active' || !roles.includes(staff.role)) throw new HttpError(403, 'You do not have access to this action');
  const { data: allowed, error: rateError } = await client.rpc('consume_api_rate_limit', { p_action: request.method === 'GET' ? 'read' : 'write' });
  if (rateError) throw new HttpError(503, 'Security configuration is not ready');
  if (!allowed) throw new HttpError(429, 'Too many requests. Please try again shortly.');
  return { client, user, staff: staff as { id: string; auth_user_id: string; name: string; email: string; role: StaffRole; status: string } };
}

export async function jsonBody(request: Request, allowed: readonly string[], maxBytes = 32_768) {
  sameOrigin(request);
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new HttpError(415, 'Use application/json');
  const length = Number(request.headers.get('content-length'));
  if (length > maxBytes) throw new HttpError(413, 'Request is too large');
  if (!request.body) throw new HttpError(400, 'Request body required');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) { await reader.cancel(); throw new HttpError(413, 'Request is too large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const buffer = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer)); }
  catch { throw new HttpError(400, 'Invalid JSON'); }
  return object(parsed, allowed);
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff', Vary: 'Authorization' } });
}

export function apiError(error: unknown) {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  // Deliberately do not return database details, credentials, or request bodies.
  return json({ error: 'Unable to complete this request. Please try again.' }, 500);
}
