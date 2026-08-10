import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, role, status, password } = body;

    if (!email || !password || !name || !role) {
      return Response.json({ error: 'Required fields missing' }, { status: 400 });
    }

    // Create a server-only client to bypass local session pollution
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    // If a user with this email already exists but isn't in staff table, it might return an empty user or error.
    if (authError) {
      return Response.json({ error: authError.message }, { status: 400 });
    }

    return Response.json({ success: true, userId: authData.user?.id }, { status: 201 });
  } catch (err) {
    console.error('Staff API error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
