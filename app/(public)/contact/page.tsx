'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, MessageCircle, Camera, Share2, Send } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await new Promise(r => setTimeout(r, 800));
    setSent(true);
  };

  return (
    <>
      {/* Hero */}
      <section style={{ paddingTop: 140, paddingBottom: 80, background: 'var(--color-bg-primary)', textAlign: 'center', borderBottom: '4px solid var(--color-plum)' }}>
        <div className="container">
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '24px', background: 'var(--color-white)', border: '4px solid var(--color-plum)', boxShadow: 'var(--shadow-sm)', color: 'var(--color-plum)', padding: '8px 24px', borderRadius: '50px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Contact Us</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 'clamp(3rem, 6vw, 5rem)', color: 'var(--color-plum)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '24px', lineHeight: 1.1 }}>
            Get In Touch
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', maxWidth: 500, margin: '0 auto', fontWeight: 700 }}>
            We&apos;d love to hear from you. Reach us via any channel below.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '40px', alignItems: 'start' }}>
            {/* Info Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Contact Cards */}
              {[
                { icon: MapPin, label: 'Our Address', value: 'NO.01, Siva Vishnu kovil street, kakkalur, Thiruvallur, TN - 602001', href: null },
                { icon: Phone, label: 'Phone', value: '+91 87548 81546', href: 'tel:+918754881546' },
                { icon: Mail, label: 'Email', value: 'thirst.freshchennai@gmail.com', href: 'mailto:thirst.freshchennai@gmail.com' },
                { icon: Clock, label: 'Business Hours', value: 'Mon–Sun: 2:00 PM – 12:00 AM', href: null },
              ].map(({ icon: Icon, label, value, href }) => (
                <div key={label} style={{ background: 'var(--color-white)', padding: '24px', borderRadius: '16px', display: 'flex', gap: '20px', alignItems: 'flex-start', border: '4px solid var(--color-plum)', boxShadow: 'var(--shadow-md)' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-plum)', flexShrink: 0, border: '4px solid var(--color-plum)' }}>
                    <Icon size={28} />
                  </div>
                  <div style={{ paddingTop: '8px' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, color: 'var(--color-berry)', fontSize: '1.2rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
                    {href ? (
                      <a href={href} style={{ color: 'var(--color-plum)', fontSize: '1rem', fontWeight: 700, textDecoration: 'none', wordBreak: 'break-word', display: 'block' }}>{value}</a>
                    ) : (
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', fontWeight: 600, wordBreak: 'break-word' }}>{value}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Social Links */}
              <div style={{ background: 'var(--color-white)', padding: '32px', borderRadius: '16px', border: '4px solid var(--color-plum)', boxShadow: 'var(--shadow-md)' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, color: 'var(--color-plum)', marginBottom: '24px', fontSize: '1.5rem', textTransform: 'uppercase' }}>Follow Us</h4>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {[
                    { icon: MessageCircle, label: 'WhatsApp', href: 'https://wa.me/918754881546' },
                    { icon: Camera, label: 'Instagram', href: 'https://instagram.com' },
                    { icon: Share2, label: 'Facebook', href: 'https://facebook.com' },
                  ].map(({ icon: Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="btn btn-secondary"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <Icon size={18} style={{ marginRight: '8px' }} /> {label}
                    </a>
                  ))}
                </div>
              </div>

              {/* WhatsApp CTA */}
              <a
                href="https://wa.me/918754881546?text=Hello%20Thirst.%20I%20would%20like%20to%20know%20more!"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ justifyContent: 'center', padding: '16px', fontSize: '1.2rem', width: '100%' }}
              >
                <MessageCircle size={24} style={{ marginRight: '8px' }} />
                Chat on WhatsApp
              </a>
            </div>

            {/* Form Column */}
            <div style={{ background: 'var(--color-white)', padding: '48px', border: '4px solid var(--color-plum)', borderRadius: '16px', boxShadow: 'var(--shadow-xl)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, color: 'var(--color-plum)', fontSize: '2rem', marginBottom: '32px', textTransform: 'uppercase' }}>
                Send Us a Message
              </h3>
              {sent ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '24px' }}>✉️</div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, color: 'var(--color-plum)', marginBottom: '16px', fontSize: '2rem' }}>Message Sent!</h4>
                  <p style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '1.1rem' }}>We&apos;ll get back to you within 24 hours. Thank you!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="flex-col-mobile" style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label htmlFor="c-name" style={{ fontWeight: 800, color: 'var(--color-plum)', textTransform: 'uppercase', fontSize: '0.9rem' }}>Name *</label>
                      <input id="c-name" required placeholder="Your name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ padding: '16px', border: '4px solid var(--color-plum)', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: 'var(--color-cream)' }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label htmlFor="c-phone" style={{ fontWeight: 800, color: 'var(--color-plum)', textTransform: 'uppercase', fontSize: '0.9rem' }}>Phone *</label>
                      <input id="c-phone" type="tel" required placeholder="+91..." value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={{ padding: '16px', border: '4px solid var(--color-plum)', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: 'var(--color-cream)' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    <label htmlFor="c-email" style={{ fontWeight: 800, color: 'var(--color-plum)', textTransform: 'uppercase', fontSize: '0.9rem' }}>Email</label>
                    <input id="c-email" type="email" placeholder="you@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={{ padding: '16px', border: '4px solid var(--color-plum)', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: 'var(--color-cream)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    <label htmlFor="c-subject" style={{ fontWeight: 800, color: 'var(--color-plum)', textTransform: 'uppercase', fontSize: '0.9rem' }}>Subject *</label>
                    <select id="c-subject" required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} style={{ padding: '16px', border: '4px solid var(--color-plum)', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: 'var(--color-cream)' }}>
                      <option value="">Select a topic</option>
                      <option value="Order Inquiry">Order Inquiry</option>
                      <option value="Franchise">Franchise</option>
                      <option value="Catering">Catering / Bulk Order</option>
                      <option value="Feedback">Feedback</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '40px' }}>
                    <label htmlFor="c-message" style={{ fontWeight: 800, color: 'var(--color-plum)', textTransform: 'uppercase', fontSize: '0.9rem' }}>Message *</label>
                    <textarea id="c-message" required placeholder="How can we help you?" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} style={{ padding: '16px', border: '4px solid var(--color-plum)', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: 'var(--color-cream)', minHeight: 140 }} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1.2rem' }}>
                    <Send size={24} style={{ marginRight: '8px' }} /> Send Message
                  </button>
                </form>
              )}

              {/* Map Embed */}
              <div style={{ marginTop: '48px', borderRadius: '12px', overflow: 'hidden', height: 250, border: '4px solid var(--color-plum)' }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15545.986!2d79.912!3d13.136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a528e1d51f28b49%3A0x6a0a0385fcb79606!2sKakkalur%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Thirst. Location"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
