'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
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

  if (pathname === '/admin' || pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 199,
            display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', width: 36, height: 36 }}>
            <Image src="/logo-v2.png" alt="Thirst." fill style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: 'white' }}>
              Thirst<span style={{ color: 'var(--color-berry)' }}>.</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Admin Panel</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: 'var(--space-4)', overflowY: 'auto' }}>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: '11px 14px',
                      borderRadius: 'var(--radius-md)',
                      color: active ? 'white' : 'rgba(255,255,255,0.6)',
                      background: active ? 'rgba(217,79,138,0.25)' : 'transparent',
                      borderLeft: active ? '3px solid var(--color-berry)' : '3px solid transparent',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: active ? 600 : 400,
                      fontSize: '0.9rem',
                      transition: 'all var(--transition-fast)',
                      textDecoration: 'none',
                    }}
                  >
                    <Icon size={18} style={{ flexShrink: 0 }} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Link
            href="/admin/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: '11px 14px',
              borderRadius: 'var(--radius-md)',
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              fontSize: '0.9rem',
              transition: 'all var(--transition-fast)',
              textDecoration: 'none',
            }}
          >
            <LogOut size={18} />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        {/* Top Bar */}
        <header style={{
          height: 64,
          background: 'white',
          borderBottom: '1px solid var(--color-lavender-dark)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-6)',
          gap: 'var(--space-4)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: 'var(--shadow-sm)',
        }}>
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display: 'none', padding: 8, borderRadius: 'var(--radius-md)', color: 'var(--color-plum)' }}
            className="sidebar-toggle"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-plum)', fontSize: '1rem' }}>
              {navItems.find(n => pathname.startsWith(n.href))?.label || 'Admin'}
            </span>
          </div>

          {/* Admin Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-plum)', fontSize: '0.875rem' }}>Admin</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Thirst. HQ</div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--gradient-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: 'var(--space-6)', background: '#f9f4f7' }}>
          {children}
        </main>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .sidebar-toggle { display: flex !important; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
    </div>
  );
}
