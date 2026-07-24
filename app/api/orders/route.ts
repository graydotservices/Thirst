import { supabase } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Upsert customer (update if phone exists)
    const { data: customer } = await supabase
      .from('customers')
      .upsert(
        {
          phone: body.customer_phone,
          name: body.customer_name,
          last_visit: new Date().toISOString(),
        },
        { onConflict: 'phone', ignoreDuplicates: false }
      )
      .select()
      .single();

    // Create order
    const billNo = `TH-${Date.now().toString().slice(-8)}`;
    const { data: order, error } = await supabase
      .from('orders')
      .insert([{
        ...body,
        bill_no: billNo,
        customer_id: customer?.id || null,
        status: 'completed',
      }])
      .select()
      .single();

    if (error) throw error;

    // Update loyalty points (1 point per ₹100)
    if (customer?.id) {
      const pointsEarned = Math.floor(body.total / 100);
      await supabase
        .from('customers')
        .update({
          loyalty_points: (customer.loyalty_points || 0) + pointsEarned,
          total_purchase: (customer.total_purchase || 0) + body.total,
        })
        .eq('id', customer.id);
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
