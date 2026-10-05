import { supabase } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Clean and normalize phone number
    const normalizedPhone = body.customer_phone ? body.customer_phone.replace(/[^\d+]/g, '').trim() : '';

    // Upsert customer (update if phone exists)
    let customer = null;
    if (normalizedPhone) {
      const { data } = await supabase
        .from('customers')
        .upsert(
          {
            phone: normalizedPhone,
            name: body.customer_name || 'Walk-in Customer',
            last_visit: new Date().toISOString(),
          },
          { onConflict: 'phone', ignoreDuplicates: false }
        )
        .select()
        .single();
      customer = data;
    }

    // Create order
    const billNo = body.bill_no || `TH-${Date.now().toString().slice(-8)}`;
    const { data: order, error } = await supabase
      .from('orders')
      .insert([{
        ...body,
        customer_phone: normalizedPhone || body.customer_phone,
        bill_no: billNo,
        customer_id: customer?.id || null,
        status: 'completed',
      }])
      .select()
      .single();

    if (error) throw error;

    // Update loyalty points (1 point per ?100 spent)
    if (customer?.id) {
      const pointsEarned = Math.floor((body.total || 0) / 100);
      await supabase
        .from('customers')
        .update({
          loyalty_points: (customer.loyalty_points || 0) + pointsEarned,
          total_purchase: (customer.total_purchase || 0) + (body.total || 0),
        })
        .eq('id', customer.id);
    }

    // Decrement stock for purchased items
    if (body.items && Array.isArray(body.items)) {
      await Promise.all(
        body.items.map(async (item: { product_id?: string; qty?: number }) => {
          if (!item.product_id || item.product_id === 'meta_staff') return;

          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (product && typeof product.stock === 'number') {
            await supabase
              .from('products')
              .update({ stock: Math.max(0, product.stock - (item.qty || 1)) })
              .eq('id', item.product_id);
          }
        })
      );
    }

    return Response.json({ success: true, order, billNo }, { status: 201 });
  } catch (err) {
    console.error('Order API error:', err);
    return Response.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const date = searchParams.get('date');

    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (date) {
      query = query
        .gte('created_at', `${date}T00:00:00`)
        .lte('created_at', `${date}T23:59:59`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return Response.json(data);
  } catch (err) {
    return Response.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
