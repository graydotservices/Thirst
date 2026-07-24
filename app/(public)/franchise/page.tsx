'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Award, TrendingUp, HeartHandshake, GraduationCap, Megaphone, Check, Send } from 'lucide-react';
import type { Metadata } from 'next';

const whyChoose = [
  { icon: Award, title: 'Established Brand', desc: 'Leverage the power of a nationally recognized premium dessert brand.' },
  { icon: TrendingUp, title: 'High ROI', desc: 'Partners report 35-60% ROI within the first 18 months of operation.' },
  { icon: HeartHandshake, title: 'Full Support', desc: 'Dedicated support team, SOPs, and technology infrastructure from day one.' },
  { icon: GraduationCap, title: 'Training', desc: 'Comprehensive 30-day training at our HQ and ongoing refresher programs.' },
  { icon: Megaphone, title: 'Marketing', desc: 'National campaigns, social media support, and local area marketing materials.' },
];

const investments = [
  { tier: 'Kiosk', size: '100–200 sq.ft.', investment: '₹8–12 Lakhs', roi: '30–40%', features: ['Basic menu', 'POS system', 'Training', 'Brand license'] },
  { tier: 'Café', size: '300–600 sq.ft.', investment: '₹18–28 Lakhs', roi: '40–55%', features: ['Full menu', 'Seating area', 'Premium interiors', 'Full training', 'Marketing kit'], popular: true },
  { tier: 'Flagship', size: '800–1200 sq.ft.', investment: '₹35–50 Lakhs', roi: '50–65%', features: ['Complete menu', 'Premium design', 'VIP lounge', 'Dedicated manager', 'Launch campaign'] },
];

export default function FranchisePage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    budget: '',
    experience: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/franchise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) setSubmitted(true);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section
        style={{
          paddingTop: 140,
          paddingBottom: 80,
          background: 'var(--color-gold)',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
          borderBottom: '4px solid var(--color-plum)'
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '24px', background: 'var(--color-white)', border: '4px solid var(--color-plum)', boxShadow: 'var(--shadow-sm)', color: 'var(--color-plum)', padding: '8px 24px', borderRadius: '50px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Award size={18} style={{ marginRight: '8px' }} /> Franchise Opportunity
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 'clamp(3rem, 6vw, 5rem)', color: 'var(--color-plum)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '24px', lineHeight: 1.1 }}>
            Build Your Empire<br />
            <span style={{ color: 'var(--color-white)', position: 'relative' }}>
              With Thirst.
              <svg style={{ position: 'absolute', bottom: '-5px', left: 0, width: '100%', height: '12px' }} viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M0,10 Q100,-5 200,10" fill="none" stroke="var(--color-berry)" strokeWidth="8" strokeLinecap="round" /></svg>
            </span>
          </h1>
          <p style={{ color: 'var(--color-plum)', fontSize: '1.2rem', maxWidth: 560, margin: '0 auto 40px', fontWeight: 700 }}>
            Join 50+ successful franchise partners across India. A proven business model, premium brand, and complete support system.
          </p>
          <a href="#franchise-form" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1.2rem' }}>
            Apply Now <Award size={20} style={{ marginLeft: '8px' }} />
          </a>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="section" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ color: 'var(--color-berry)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Why Thirst.</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: 'var(--color-plum)', textTransform: 'uppercase' }}>The Thirst. Advantage</h2>
          </div>
          <div className="pad-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
            {whyChoose.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex-col-mobile text-center-mobile" style={{ background: 'var(--color-white)', border: '4px solid var(--color-plum)', borderRadius: '16px', boxShadow: 'var(--shadow-md)', padding: '32px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-plum)', border: '4px solid var(--color-plum)', flexShrink: 0 }}>
                  <Icon size={32} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, color: 'var(--color-plum)', marginBottom: '12px', fontSize: '1.4rem' }}>{title}</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.7, fontWeight: 600 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Tiers */}
      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ color: 'var(--color-berry)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Investment</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: 'var(--color-plum)', textTransform: 'uppercase' }}>Choose Your Model</h2>
          </div>
          <div className="pad-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
            {investments.map((tier) => (
              <div
                key={tier.tier}
                style={{
                  background: 'var(--color-white)',
                  padding: '40px 32px',
                  borderRadius: '16px',
                  position: 'relative',
                  border: '4px solid var(--color-plum)',
                  boxShadow: tier.popular ? 'var(--shadow-xl)' : 'var(--shadow-md)',
                  transform: tier.popular ? 'scale(1.02)' : 'none',
                }}
              >
                {tier.popular && (
                  <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-berry)', color: 'var(--color-white)', padding: '8px 24px', borderRadius: '50px', fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: '1rem', whiteSpace: 'nowrap', border: '4px solid var(--color-plum)', letterSpacing: '1px' }}>
                    Most Popular
                  </div>
                )}
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: '2.5rem', color: 'var(--color-plum)', marginBottom: '8px', textTransform: 'uppercase' }}>{tier.tier}</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '24px' }}>{tier.size}</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: '2rem', color: 'var(--color-berry)', marginBottom: '8px' }}>{tier.investment}</div>
                <div style={{ alignItems: 'center', gap: '8px', marginBottom: '32px', background: 'var(--color-gold)', display: 'inline-flex', padding: '6px 16px', borderRadius: '50px', border: '2px solid var(--color-plum)' }}>
                  <TrendingUp size={16} style={{ color: 'var(--color-plum)' }} />
                  <span style={{ color: 'var(--color-plum)', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase' }}>ROI: {tier.roi}</span>
                </div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-plum)', fontSize: '1rem', fontWeight: 600 }}>
                      <Check size={20} style={{ color: 'var(--color-white)', background: 'var(--color-plum)', borderRadius: '50%', padding: '2px', flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#franchise-form" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Apply for {tier.tier}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="franchise-form" className="section" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ color: 'var(--color-berry)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Apply Now</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: 'var(--color-plum)', textTransform: 'uppercase' }}>Franchise Application</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '16px', fontSize: '1.1rem', fontWeight: 600 }}>
              Fill the form below and our team will reach out within 24 hours.
            </p>
          </div>

          {submitted ? (
            <div style={{ background: 'var(--color-white)', padding: '60px', textAlign: 'center', border: '4px solid var(--color-plum)', borderRadius: '16px', boxShadow: 'var(--shadow-xl)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🎉</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, color: 'var(--color-plum)', fontSize: '2.5rem', marginBottom: '16px' }}>
                Application Submitted!
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', fontWeight: 600 }}>
                Thank you for your interest in Thirst. Our franchise team will contact you within 24 hours. Welcome to the family!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: 'var(--color-white)', padding: '48px', border: '4px solid var(--color-plum)', borderRadius: '16px', boxShadow: 'var(--shadow-xl)' }}>
              <div className="flex-col-mobile" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '24px' }}>
                <div style={{ flex: '1 1 calc(50% - 12px)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="f-name" style={{ fontWeight: 800, color: 'var(--color-plum)', textTransform: 'uppercase', fontSize: '0.9rem' }}>Full Name *</label>
                  <input id="f-name" required placeholder="Your full name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ padding: '16px', border: '4px solid var(--color-plum)', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: 'var(--color-cream)' }} />
                </div>
                <div style={{ flex: '1 1 calc(50% - 12px)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="f-phone" style={{ fontWeight: 800, color: 'var(--color-plum)', textTransform: 'uppercase', fontSize: '0.9rem' }}>Phone Number *</label>
                  <input id="f-phone" type="tel" required placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={{ padding: '16px', border: '4px solid var(--color-plum)', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: 'var(--color-cream)' }} />
                </div>
                <div style={{ flex: '1 1 calc(50% - 12px)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="f-email" style={{ fontWeight: 800, color: 'var(--color-plum)', textTransform: 'uppercase', fontSize: '0.9rem' }}>Email Address *</label>
                  <input id="f-email" type="email" required placeholder="you@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={{ padding: '16px', border: '4px solid var(--color-plum)', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: 'var(--color-cream)' }} />
                </div>
                <div style={{ flex: '1 1 calc(50% - 12px)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="f-city" style={{ fontWeight: 800, color: 'var(--color-plum)', textTransform: 'uppercase', fontSize: '0.9rem' }}>City *</label>
                  <input id="f-city" required placeholder="City for franchise" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} style={{ padding: '16px', border: '4px solid var(--color-plum)', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: 'var(--color-cream)' }} />
                </div>
                <div style={{ flex: '1 1 calc(50% - 12px)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="f-budget" style={{ fontWeight: 800, color: 'var(--color-plum)', textTransform: 'uppercase', fontSize: '0.9rem' }}>Investment Budget *</label>
                  <select id="f-budget" required value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} style={{ padding: '16px', border: '4px solid var(--color-plum)', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: 'var(--color-cream)' }}>
                    <option value="">Select budget range</option>
                    <option value="8-12 Lakhs">₹8–12 Lakhs (Kiosk)</option>
                    <option value="18-28 Lakhs">₹18–28 Lakhs (Café)</option>
                    <option value="35-50 Lakhs">₹35–50 Lakhs (Flagship)</option>
                    <option value="50+ Lakhs">₹50+ Lakhs</option>
                  </select>
                </div>
                <div style={{ flex: '1 1 calc(50% - 12px)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="f-experience" style={{ fontWeight: 800, color: 'var(--color-plum)', textTransform: 'uppercase', fontSize: '0.9rem' }}>Business Experience</label>
                  <select id="f-experience" value={form.experience} onChange={e => setForm(p => ({ ...p, experience: e.target.value }))} style={{ padding: '16px', border: '4px solid var(--color-plum)', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: 'var(--color-cream)' }}>
                    <option value="">Select experience</option>
                    <option value="None">No prior experience</option>
                    <option value="1-3 years">1–3 years</option>
                    <option value="3-5 years">3–5 years</option>
                    <option value="5+ years">5+ years in F&B</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
                <label htmlFor="f-message" style={{ fontWeight: 800, color: 'var(--color-plum)', textTransform: 'uppercase', fontSize: '0.9rem' }}>Message (Optional)</label>
                <textarea id="f-message" placeholder="Tell us about your vision, preferred location, or any questions..." value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} style={{ padding: '16px', border: '4px solid var(--color-plum)', borderRadius: '8px', fontSize: '1rem', outline: 'none', background: 'var(--color-cream)', minHeight: '120px' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1.2rem' }} disabled={loading}>
                {loading ? (
                  'Submitting...'
                ) : (
                  <><Send size={24} style={{ marginRight: '8px' }} /> Submit Application</>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
