'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ShoppingBag, Phone } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/menu', label: 'Menu' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/offers', label: 'Offers' },
  { href: '/franchise', label: 'Franchise' },
  { href: '/store-locations', label: 'Locations' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 'var(--z-sticky)',
        transition: 'all var(--transition-base)',
        background: scrolled
          ? 'rgba(250, 243, 232, 0.95)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
        borderBottom: scrolled ? '2px solid var(--color-plum)' : 'none',
      }}
    >
      <div className="container">
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '72px',
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <Image
                src="/logo-v2.png"
                alt="Thirst. Logo"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '2rem',
                color: 'var(--color-plum)',
                letterSpacing: '-0.02em',
                transition: 'color var(--transition-fast)',
              }}
            >
              Thirst<span style={{ color: 'var(--color-berry)' }}>.</span>
            </span>
          </Link>

          <ul
            className="hide-mobile"
            style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center' }}
          >
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="nav-link"
                  style={{
                    color: 'var(--color-text-primary)',
                    fontWeight: 500
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div
            className="hide-mobile"
            style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}
          >
            <a
              href="tel:+919999999999"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-plum)',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'color var(--transition-fast)',
              }}
            >
              <Phone size={16} />
              Call Us
            </a>
            <Link href="/menu" className="btn btn-primary btn-sm">
              <ShoppingBag size={15} />
              Order Now
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="mobile-only"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            style={{
              padding: '8px',
              color: 'var(--color-plum)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <div
        style={{
          position: 'absolute',
          top: '72px',
          left: 0,
          right: 0,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--color-lavender-dark)',
          padding: isOpen ? 'var(--space-4) var(--space-6) var(--space-6)' : '0 var(--space-6)',
          maxHeight: isOpen ? '500px' : '0',
          overflow: 'hidden',
          transition: 'all var(--transition-base)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {navLinks.map((link, i) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'block',
                  padding: '12px 0',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 500,
                  fontSize: '1rem',
                  borderBottom: i < navLinks.length - 1 ? '1px solid var(--color-lavender)' : 'none',
                  transition: 'color var(--transition-fast)',
                }}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li style={{ marginTop: 'var(--space-4)' }}>
            <Link href="/menu" className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
              Order Now
            </Link>
          </li>
        </ul>
      </div>

    </header>
  );
}
