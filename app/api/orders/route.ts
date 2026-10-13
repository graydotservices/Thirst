import { apiError, json, jsonBody, requireStaff } from '@/lib/security/server';
import { MANAGERS } from '@/lib/security/roles';
import { orderInput } from '@/lib/security/orders';
import { date, HttpError, uuid } from '@/lib/security/validation';

export async function POST(request: Request) {
  try {
    const { client } = await requireStaff(request);
    const body = await jsonBody(request, ['items','customer_name','customer_phone','discount_percent','payment_method','request_id']);
    const { data, error } = await client.rpc('place_order_atomic', orderInput(body));
    if (error) {
      if (error.code === '42501') throw new HttpError(403, 'Billing access denied');
      if (['22023','22P02'].includes(error.code)) throw new HttpError(400, 'Invalid order details');
      if (error.code === 'P0001') throw new HttpError(409, 'Stock or price changed. Refresh the menu and try again.');
      throw error;
    }
    if (!data?.id) throw new Error('Order was not confirmed');
    return json({ success: true, order: data, billNo: data.bill_no }, 201);
  } catch (error) { return apiError(error); }
}

export async function GET(request: Request) {
  try {
    const { client } = await requireStaff(request, MANAGERS);
    const params = new URL(request.url).searchParams;
    const limit = Number(params.get('limit') || 50);
    const offset = Number(params.get('offset') || 0);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0 || offset > 1000000) throw new HttpError(400, 'Invalid pagination');
    let query = client.from('orders').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (params.has('date')) {
      const day = date(params.get('date'));
      if (!day) throw new HttpError(400, 'Invalid date');
      const start = new Date(`${day}T00:00:00+05:30`);
      query = query.gte('created_at', start.toISOString()).lt('created_at', new Date(start.getTime() + 86400000).toISOString());
    }
    const { data, error } = await query;
    if (error) throw error;
    return json(data);
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const { client } = await requireStaff(request, MANAGERS);
    const body = await jsonBody(request, ['id','status']);
    if (body.status !== 'cancelled') throw new HttpError(400, 'Only cancellation is supported');
    const { data, error } = await client.rpc('cancel_order_atomic', { p_order_id: uuid(body.id) });
    if (error?.code === 'P0002') throw new HttpError(404, 'Order not found');
    if (error) throw error;
    return json({ success: true, order: data });
  } catch (error) { return apiError(error); }
}
