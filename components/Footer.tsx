'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Camera,
  Share2,
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  Clock,
  Heart,
  ArrowRight
} from 'lucide-react';

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'Our Story' },
  { href: '/menu', label: 'The Menu' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/offers', label: 'Special Offers' },
];

const socialLinks = [
  { href: 'https://instagram.com', icon: Camera, label: 'Instagram' },
  { href: 'https://facebook.com', icon: Share2, label: 'Facebook' },
  { href: 'https://twitter.com', icon: MessageSquare, label: 'Twitter' },
];

export default function Footer() {
  return (
    <footer style={{ background: 'var(--color-plum)', color: 'var(--color-cream)', paddingTop: '100px', borderTop: '2px dashed var(--color-lavender-dark)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Blur */}
      <div style={{ position: 'absolute', top: 0, right: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(211, 47, 47, 0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />
      
      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* Newsletter Section */}
        <div className="flex-col-mobile pad-mobile text-center-mobile" style={{ background: 'var(--gradient-berry)', padding: '60px', borderRadius: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '40px', marginBottom: '80px', border: '2px solid var(--color-plum)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ maxWidth: '500px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', color: 'var(--color-white)', fontWeight: 800, marginBottom: '12px' }}>Join the Thirst Club</h3>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', lineHeight: 1.6 }}>Subscribe to our newsletter for exclusive offers, seasonal menus, and VIP event invitations.</p>
          </div>
          <div style={{ flex: '1 1 100%', display: 'flex', flexWrap: 'wrap', gap: '12px', background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '16px', border: '2px solid rgba(255,255,255,0.2)' }}>
            <input type="email" placeholder="Enter your email address" style={{ flex: '1 1 200px', background: 'transparent', border: 'none', outline: 'none', color: 'white', padding: '10px 12px', fontSize: '1rem' }} />
            <button className="btn" style={{ flex: '1 1 auto', background: 'var(--color-gold)', color: 'var(--color-plum)', padding: '14px 32px', borderRadius: '12px', fontWeight: 600, justifyContent: 'center' }}>Subscribe</button>
          </div>
        </div>

        {/* Main Footer Links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '60px', paddingBottom: '60px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Brand */}
          <div>
            <Link href="/" className="text-center-mobile" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ position: 'relative', width: 48, height: 48, background: 'var(--color-cream)', borderRadius: '50%', border: '2px solid var(--color-gold)', overflow: 'hidden' }}>
                <Image src="/logo-v2.png" alt="Thirst." fill style={{ objectFit: 'contain', transform: 'scale(1.1)' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>Thirst<span style={{ color: 'var(--color-gold)' }}>.</span></span>
            </Link>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: '32px' }}>
              One For Living. Handcrafted desserts that redefine indulgence and luxury in every bite.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', transition: '0.3s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-berry)'; e.currentTarget.style.borderColor = 'var(--color-berry)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                  <Icon size={18} color="white" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px' }}>Quick Links</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {quickLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} style={{ color: 'rgba(255,255,255,0.6)', transition: '0.3s', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-gold)'; e.currentTarget.style.transform = 'translateX(5px)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                    <ArrowRight size={14} /> {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px' }}>Get in Touch</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { icon: MapPin, text: 'NO.01, Siva Vishnu kovil street, kakkalur, Thiruvallur - 602001' },
                { icon: Phone, text: '+91 87548 81546' },
                { icon: Mail, text: 'thirst.freshchennai@gmail.com' },
                { icon: Clock, text: 'Mon–Sun: 10:00 AM – 11:00 PM' },
              ].map(({ icon: Icon, text }, i) => (
                <li key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ background: 'rgba(217,79,138,0.1)', padding: '10px', borderRadius: '50%' }}>
                    <Icon size={18} color="var(--color-soft-pink)" />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginTop: '4px' }}>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright & Certifications */}
        <div style={{ padding: '40px 0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
            Crafted with <Heart size={14} fill="var(--color-berry)" color="var(--color-berry)" /> for Dessert Lovers
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '8px' }}>&copy; {new Date().getFullYear()} Thirst. All rights reserved.</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>FSSAI: 22425478001152 &nbsp;|&nbsp; Udyam: UDYAM-TN-24-0161809</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
