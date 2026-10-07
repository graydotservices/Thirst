'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Users,
  Package,
  BarChart3,
  Bell,
  MapPin,
  Ticket,
  Images,
  UserCog,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/billing', label: 'Billing / POS', icon: ShoppingCart },
  { href: '/admin/orders', label: 'Orders', icon: Receipt },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/staff', label: 'Staff', icon: UserCog },
  { href: '/admin/inventory', label: 'Inventory', icon: Package },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/offers', label: 'Offers', icon: Ticket },
  { href: '/admin/gallery', label: 'Gallery', icon: Images },
  { href: '/admin/franchise', label: 'Franchise Apps', icon: ChevronRight },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/locations', label: 'Locations', icon: MapPin },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [staffInfo, setStaffInfo] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === '/admin' || pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    const checkRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
        return;
      }

      const { data: staffData } = await supabase
        .from('staff')
        .select('name, role, status')
        .eq('email', session.user.email)
        .single();
        
      if (!staffData || staffData.status === 'inactive') {
        // Not a registered active staff member
        await supabase.auth.signOut();
        router.push('/admin/login?error=unauthorized');
        return;
      }

      const userRole = staffData.role;
      setRole(userRole);
      setStaffInfo({
        name: staffData.name || 'Admin',
        email: session.user.email || '',
        role: userRole
      });
      
      // Protect routes for cashiers
      if (userRole === 'cashier' && pathname !== '/admin/billing') {
        router.push('/admin/billing');
      }
      setLoading(false);
    };

    checkRole();
  }, [pathname, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  if (pathname === '/admin' || pathname === '/admin/login') return <>{children}</>;
  
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner"></span></div>;

  const visibleNavItems = role === 'cashier' 
    ? navItems.filter(item => item.href === '/admin/billing')
    : navItems;

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 199,
          }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo - Fixed Top */}
        <div className="admin-sidebar-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
              <Image src="/logo-v2.png" alt="Thirst." fill style={{ objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: 'white', lineHeight: 1.2 }}>
                Thirst<span style={{ color: 'var(--color-berry)' }}>.</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Admin Panel</div>
            </div>
          </div>
          {/* Mobile close button inside drawer */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="sidebar-close-btn"
            style={{
              display: 'none',
              width: 34,
              height: 34,
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav - Dedicated Scrollable Area */}
        <nav className="admin-sidebar-nav">
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {visibleNavItems.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-md)',
                      color: active ? 'white' : 'rgba(255,255,255,0.65)',
                      background: active ? 'rgba(217,79,138,0.25)' : 'transparent',
                      borderLeft: active ? '3px solid var(--color-berry)' : '3px solid transparent',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: active ? 600 : 400,
                      fontSize: '0.875rem',
                      transition: 'all var(--transition-fast)',
                      textDecoration: 'none',
                    }}
                  >
                    <Icon size={17} style={{ flexShrink: 0, color: active ? 'var(--color-berry)' : 'inherit' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer with Real Logout - Fixed Bottom */}
        <div className="admin-sidebar-footer">
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-md)',
              color: 'rgba(255,255,255,0.85)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              fontSize: '0.875rem',
              transition: 'all var(--transition-fast)',
              textAlign: 'left',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#fca5a5';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={17} style={{ flexShrink: 0 }} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        {/* Top Bar */}
        <header className="admin-header">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              display: 'none',
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-plum)',
              background: 'var(--color-lavender)',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            className="sidebar-toggle"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: 'var(--color-plum)',
              fontSize: '1rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block'
            }}>
              {visibleNavItems.find(n => pathname.startsWith(n.href))?.label || 'Admin'}
            </span>
          </div>

          {/* Admin Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
            <div className="admin-user-info" style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                color: 'var(--color-plum)',
                fontSize: '0.8125rem',
                maxWidth: 120,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {staffInfo?.name || 'Admin'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                {staffInfo?.role || 'Staff'}
              </div>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gradient-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
              {(staffInfo?.name || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          {children}
        </main>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .sidebar-toggle { display: flex !important; }
          .sidebar-close-btn { display: flex !important; }
        }
        @media (max-width: 480px) {
          .admin-user-info { display: none !important; }
        }
      `}</style>
    </div>
  );
}
