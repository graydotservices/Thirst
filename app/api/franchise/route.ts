import { supabase } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, city, budget, experience, message } = body;

    if (!name || !phone || !email || !city || !budget) {
      return Response.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('franchise_applications')
      .insert([{ name, phone, email, city, budget, experience, message, status: 'pending' }])
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, id: data.id }, { status: 201 });
  } catch (err) {
    console.error('Franchise API error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('franchise_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return Response.json(data);
  } catch (err) {
    return Response.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
