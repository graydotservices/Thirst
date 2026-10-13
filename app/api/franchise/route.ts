import { createHmac } from 'node:crypto';
import { adminClient, apiError, json, jsonBody, requireStaff } from '@/lib/security/server';
import { MANAGERS } from '@/lib/security/roles';
import { email, HttpError, phone, text } from '@/lib/security/validation';

export async function POST(request: Request) {
  try {
    const body = await jsonBody(request, ['name','phone','email','city','budget','experience','message'], 8192);
    const payload = { name: text(body.name,'name'), phone: phone(body.phone), email: email(body.email),
      city: text(body.city,'city'), budget: text(body.budget,'budget'), experience: text(body.experience,'experience',200,true), message: text(body.message,'message',2000,true) };
    const admin = adminClient();
    // Only trust IP headers when the deployment proxy is configured to replace them.
    const address = process.env.TRUST_PROXY === 'true' ? (request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'shared') : 'shared';
    const key = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!).update(address.slice(0,100)).digest('hex');
    const { data, error } = await admin.rpc('submit_franchise_application', { p_payload: payload, p_rate_key: key });
    if (error) throw error;
    if (!data) throw new HttpError(429, 'Too many applications. Please try again later.');
    return json({ success: true },201);
  } catch (error) { return apiError(error); }
}
export async function GET(request: Request) {
  try {
    const { client } = await requireStaff(request, MANAGERS);
    const limit = Number(new URL(request.url).searchParams.get('limit') || 100);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new HttpError(400, 'Invalid limit');
    const { data, error } = await client.from('franchise_applications').select('*').order('created_at',{ascending:false}).limit(limit);
    if (error) throw error;
    return json(data);
  } catch (error) { return apiError(error); }
}
