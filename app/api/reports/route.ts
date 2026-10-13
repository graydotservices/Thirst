import { apiError, json, requireStaff } from '@/lib/security/server';
import { MANAGERS } from '@/lib/security/roles';
import { choice } from '@/lib/security/validation';

export async function GET(request: Request) {
  try {
    const { client } = await requireStaff(request, MANAGERS);
    const range = choice(new URL(request.url).searchParams.get('range') || 'daily', ['daily','weekly','monthly','yearly'] as const, 'range');
    const { data, error } = await client.rpc('sales_summary', { p_range: range });
    if (error) throw error;
    return json(data);
  } catch (error) { return apiError(error); }
}
