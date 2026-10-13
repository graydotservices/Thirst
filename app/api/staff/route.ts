import { adminClient, apiError, json, jsonBody, requireStaff } from '@/lib/security/server';
import { STAFF_ROLES } from '@/lib/security/roles';
import { choice, email, HttpError, phone, text, uuid } from '@/lib/security/validation';

function profile(body: Record<string, unknown>) {
  return { name: text(body.name, 'name'), phone: phone(body.phone, true) || null,
    role: choice(body.role, STAFF_ROLES, 'role'), status: choice(body.status ?? 'active', ['active','inactive'] as const, 'status') };
}
export async function POST(request: Request) {
  try {
    const { user } = await requireStaff(request, ['admin']);
    const body = await jsonBody(request, ['name','phone','email','role','status','password']);
    const details = profile(body);
    const address = email(body.email);
    // Check length without trimming or changing the password.
    if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128) throw new HttpError(400, 'Use a password between 12 and 128 characters');
    const admin = adminClient();
    const { data: auth, error: authError } = await admin.auth.admin.createUser({ email: address, password: body.password, email_confirm: true });
    if (authError || !auth.user) throw new HttpError(409, 'Unable to create this staff account. Check whether the email is already registered.');
    const { data, error } = await admin.rpc('manage_staff_secure', { p_actor: user.id, p_operation: 'create', p_target: auth.user.id, p_details: { ...details, email: address } });
    if (error) {
      await admin.auth.admin.deleteUser(auth.user.id);
      throw new Error('Staff profile creation failed');
    }
    return json({ success: true, staff: data }, 201);
  } catch (error) { return apiError(error); }
}
export async function PUT(request: Request) {
  try {
    const { staff: actor, user } = await requireStaff(request, ['admin']);
    const body = await jsonBody(request, ['id','name','phone','role','status']);
    const id = uuid(body.id); const details = profile(body);
    if (id === actor.id && (details.role !== 'admin' || details.status !== 'active')) throw new HttpError(400, 'You cannot deactivate or demote your own account');
    const { data, error } = await adminClient().rpc('manage_staff_secure', { p_actor: user.id, p_operation: 'update', p_target: id, p_details: details });
    if (error?.code === '23514') throw new HttpError(409, 'Keep at least one active administrator');
    if (error?.code === 'P0002') throw new HttpError(404, 'Staff member not found');
    if (error?.code === '42501') throw new HttpError(403, 'Administrator access required');
    if (error) throw error;
    return json({ success: true, staff: data });
  } catch (error) { return apiError(error); }
}
export async function DELETE(request: Request) {
  try {
    const { staff: actor, user } = await requireStaff(request, ['admin']);
    const id = uuid(new URL(request.url).searchParams.get('id'));
    if (id === actor.id) throw new HttpError(400, 'You cannot delete your own account');
    const admin = adminClient();
    // Removing the profile immediately revokes database/API access, even if Auth cleanup fails.
    const { data, error } = await admin.rpc('manage_staff_secure', { p_actor: user.id, p_operation: 'delete', p_target: id, p_details: {} });
    if (error?.code === '23514') throw new HttpError(409, 'Keep at least one active administrator');
    if (error?.code === 'P0002') throw new HttpError(404, 'Staff member not found');
    if (error?.code === '42501') throw new HttpError(403, 'Administrator access required');
    if (error) throw error;
    if (data.auth_user_id) {
      const { error: cleanupError } = await admin.auth.admin.deleteUser(data.auth_user_id);
      if (cleanupError) return json({ success: true, warning: 'Access removed. The Auth account needs administrator cleanup before this email can be reused.' });
    }
    return json({ success: true });
  } catch (error) { return apiError(error); }
}
