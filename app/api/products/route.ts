import { apiError, json, jsonBody, requireStaff } from '@/lib/security/server';
import { MANAGERS } from '@/lib/security/roles';
import { choice, HttpError, imageUrl, number, text, uuid } from '@/lib/security/validation';

const fields = ['id','name','category','price','stock','low_stock_threshold','image','description','barcode','is_available'];
function product(body: Record<string, unknown>) {
  if (body.is_available !== undefined && typeof body.is_available !== 'boolean') throw new HttpError(400, 'Invalid availability');
  return {
    name: text(body.name, 'name'), 
    category: text(body.category, 'category', 100),
    price: number(body.price, 'price', 0, 1000000), stock: number(body.stock, 'stock', 0, 1000000, true),
    low_stock_threshold: number(body.low_stock_threshold ?? 5, 'stock threshold', 0, 1000000, true),
    image: imageUrl(body.image), description: text(body.description, 'description', 2000, true) || null,
    barcode: text(body.barcode, 'barcode', 100, true) || null, is_available: body.is_available ?? true,
  };
}
export async function GET(request: Request) {
  try {
    const { client } = await requireStaff(request);
    const category = new URL(request.url).searchParams.get('category');
    let query = client.from('products').select('*').order('name');
    if (category) query = query.eq('category', text(category, 'category', 100));
    const { data, error } = await query;
    if (error) throw error;
    return json(data);
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const { client } = await requireStaff(request, MANAGERS);
    const body = await jsonBody(request, fields.filter(key => key !== 'id'));
    const { data, error } = await client.from('products').insert(product(body)).select().single();
    if (error) throw error;
    return json(data, 201);
  } catch (error) { return apiError(error); }
}
export async function PUT(request: Request) {
  try {
    const { client } = await requireStaff(request, MANAGERS);
    const body = await jsonBody(request, fields);
    const { data, error } = await client.from('products').update(product(body)).eq('id', uuid(body.id)).select().single();
    if (error?.code === 'PGRST116') throw new HttpError(404, 'Product not found');
    if (error) throw error;
    return json(data);
  } catch (error) { return apiError(error); }
}
export async function DELETE(request: Request) {
  try {
    const { client } = await requireStaff(request, MANAGERS);
    const id = uuid(new URL(request.url).searchParams.get('id'));
    const { data, error } = await client.from('products').delete().eq('id', id).select('id').single();
    if (error?.code === 'PGRST116') throw new HttpError(404, 'Product not found');
    if (error || !data) throw error || new Error('Delete not confirmed');
    return json({ success: true });
  } catch (error) { return apiError(error); }
}
