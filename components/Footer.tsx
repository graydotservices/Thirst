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
  ArrowRight,
} from 'lucide-react';

const InstagramIcon = ({ size = 24, color = "currentColor", className = "" }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} height={size} viewBox="0 0 24 24" fill="none" 
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const YoutubeIcon = ({ size = 24, color = "currentColor", className = "" }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} height={size} viewBox="0 0 24 24" fill="none" 
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const WhatsappIcon = ({ size = 24, color = "currentColor", className = "" }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} height={size} viewBox="0 0 24 24" fill="none" 
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
);

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'Our Story' },
  { href: '/menu', label: 'The Menu' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/offers', label: 'Special Offers' },
];

const socialLinks = [
  { href: 'https://www.instagram.com/thirst_fresh?igsh=bnY2cTJqd2p3ZmF1&utm_source=qr', icon: InstagramIcon, label: 'Instagram' },
  { href: 'https://youtube.com/@thirstfreshzz?si=2bDbGSIyGi6cc8Ix', icon: YoutubeIcon, label: 'YouTube' },
  { href: 'https://wa.me/918754881546', icon: WhatsappIcon, label: 'WhatsApp' },
];

export default function Footer() {
  return (
    <footer style={{ background: 'var(--color-plum)', color: 'var(--color-cream)', paddingTop: '100px', borderTop: '2px dashed var(--color-lavender-dark)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Blur */}
      <div style={{ position: 'absolute', top: 0, right: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(211, 47, 47, 0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />
      
      <div className="container" style={{ position: 'relative', zIndex: 10 }}>

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
                { icon: Clock, text: 'Mon–Sun: 2:00 PM – 12:00 AM' },
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

          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '8px' }}>&copy; {new Date().getFullYear()} Thirst. All rights reserved.</p>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 8px' }}>
              <span style={{ whiteSpace: 'nowrap' }}>FSSAI: 22425478001152</span>
              <span className="hide-mobile">|</span>
              <span style={{ whiteSpace: 'nowrap' }}>Udyam: UDYAM-TN-24-0161809</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
