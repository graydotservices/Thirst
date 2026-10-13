export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function object(value: unknown, allowed: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'Expected a JSON object');
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some(key => !allowed.includes(key))) throw new HttpError(400, 'Unexpected request field');
  return result;
}

export function text(value: unknown, label: string, max = 200, optional = false): string {
  if (optional && (value === undefined || value === null || value === '')) return '';
  if (typeof value !== 'string') throw new HttpError(400, `Invalid ${label}`);
  const result = value.trim();
  if (!result || result.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(result)) throw new HttpError(400, `Invalid ${label}`);
  return result;
}

export function uuid(value: unknown, label = 'ID'): string {
  const result = text(value, label, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result)) throw new HttpError(400, `Invalid ${label}`);
  return result;
}

export function number(value: unknown, label: string, min: number, max: number, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new HttpError(400, `Invalid ${label}`);
  return value;
}

export function choice<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) throw new HttpError(400, `Invalid ${label}`);
  return value as T;
}

export function phone(value: unknown, optional = false): string {
  const raw = text(value, 'phone number', 30, optional);
  if (!raw && optional) return '';
  if (!/^[+\d\s()-]+$/.test(raw)) throw new HttpError(400, 'Invalid phone number');
  const digits = raw.replace(/\D/g, '');
  const normalized = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.length === 11 && digits.startsWith('0') ? digits.slice(1) : digits;
  if (!/^[6-9]\d{9}$/.test(normalized)) throw new HttpError(400, 'Enter a valid Indian phone number');
  return normalized;
}

export function email(value: unknown, optional = false): string {
  const result = text(value, 'email', 254, optional).toLowerCase();
  if (result && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new HttpError(400, 'Invalid email');
  return result;
}

export function date(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  const result = text(value, 'date', 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || !Number.isFinite(Date.parse(result)) || new Date(result).toISOString().slice(0, 10) !== result) throw new HttpError(400, 'Invalid date');
  return result;
}

export function imageUrl(value: unknown): string | null {
  const result = text(value, 'image URL', 2048, true);
  if (!result) return null;
  if (/^\/[a-zA-Z0-9/_-]+\.(png|jpe?g|webp|avif)$/.test(result)) return result;
  try {
    const parsed = new URL(result);
    const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
    if (parsed.protocol === 'https:' && parsed.origin === supabase.origin && !parsed.username && !parsed.password && parsed.pathname.startsWith('/storage/v1/object/public/product-images/')) return result;
  } catch { /* Invalid URL. */ }
  throw new HttpError(400, 'Use an image uploaded to this store');
}
