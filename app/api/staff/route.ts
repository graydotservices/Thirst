import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    // 1. Verify caller authentication from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const clientForAuthCheck = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    const { data: { user }, error: userError } = await clientForAuthCheck.auth.getUser(token);
    if (userError || !user) {
      return Response.json({ error: 'Unauthorized: Invalid session' }, { status: 401 });
    }

    // Verify caller is an active admin in staff table
    const { data: callerStaff } = await clientForAuthCheck
      .from('staff')
      .select('role, status')
      .eq('email', user.email)
      .single();

    if (!callerStaff || callerStaff.role !== 'admin' || callerStaff.status !== 'active') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { name, phone, email, role, status, password } = body;

    if (!email || !password || !name || !role) {
      return Response.json({ error: 'Required fields missing: name, email, password, and role are required' }, { status: 400 });
    }

    // Use service role if available for admin operations, otherwise anon client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: { persistSession: false }
    });

    // 3. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return Response.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user?.id;

    // 4. Insert record into public staff table with matched auth user ID
    const { data: newStaff, error: dbError } = await supabaseAdmin
      .from('staff')
      .insert([{
        id: userId,
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        email: email.trim().toLowerCase(),
        role: role.toLowerCase(),
        status: status || 'active'
      }])
      .select()
      .single();

    if (dbError) {
      console.error('Staff DB insert error:', dbError);
      return Response.json({ error: dbError.message || 'User auth created but failed to save staff profile record' }, { status: 500 });
    }

    return Response.json({ success: true, staff: newStaff }, { status: 201 });
  } catch (err) {
    console.error('Staff API error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
