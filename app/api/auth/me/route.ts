import { apiError, json, requireStaff } from '@/lib/security/server';

export async function GET(request: Request) {
  try { const { staff } = await requireStaff(request); return json(staff); }
  catch (error) { return apiError(error); }
}
