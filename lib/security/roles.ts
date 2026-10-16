export const STAFF_ROLES = ['admin', 'manager', 'cashier'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
export const MANAGERS: readonly StaffRole[] = ['admin', 'manager'];

export function canAccessDashboard(role: StaffRole, pathname: string): boolean {
  if (role === 'admin') return true;
  if (role === 'cashier') return pathname === '/admin/billing';
  if (role !== 'manager') return false;
  return ['/admin/dashboard', '/admin/billing', '/admin/orders', '/admin/customers',
    '/admin/inventory', '/admin/reports', '/admin/signature', '/admin/offers', '/admin/gallery',
    '/admin/franchise', '/admin/notifications', '/admin/locations'].includes(pathname);
}
