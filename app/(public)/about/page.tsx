import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Award, Leaf, Coffee, Users, Star, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us — Thirst.',
  description:
    'Learn about the story, mission, and passion behind Thirst. — India\'s premium luxury dessert brand.',
};

const values = [
  { icon: Heart, title: 'Made with Love', desc: 'Every dessert is handcrafted by our master pastry chefs with genuine passion.' },
  { icon: Leaf, title: 'Premium Ingredients', desc: 'We source only the finest, freshest ingredients from trusted suppliers.' },
  { icon: Award, title: 'Award-Winning', desc: 'Recognized as India\'s best premium dessert brand three years running.' },
  { icon: Coffee, title: 'Perfect Experience', desc: 'Every visit is designed to be a luxurious, memorable experience.' },
];

const team = [
  { name: 'V MEENAKSHI', role: 'Founder', emoji: '👩‍🍳' },
  { name: 'Yuvaraj', role: 'Co-Founder', emoji: '👨‍🍳' },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          paddingTop: 140,
          paddingBottom: 80,
          background: 'var(--color-bg-primary)',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
          borderBottom: '4px solid var(--color-plum)'
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ 
            display: 'inline-flex', 
            background: 'var(--color-gold)', 
            color: 'var(--color-plum)', 
            padding: '8px 20px', 
            borderRadius: '50px', 
            fontWeight: 800, 
            letterSpacing: '2px', 
            textTransform: 'uppercase', 
            fontSize: '0.85rem', 
            marginBottom: '24px',
            border: '2px solid var(--color-plum)',
            boxShadow: '2px 2px 0px var(--color-plum)'
          }}>
            Our Story
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 400,
              fontSize: 'clamp(3rem, 6vw, 5rem)',
              color: 'var(--color-plum)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '24px',
              lineHeight: 1.1
            }}
          >
            Born from a <span style={{ color: 'var(--color-berry)', position: 'relative' }}>
              Passion
              <svg style={{ position: 'absolute', bottom: '-5px', left: 0, width: '100%', height: '12px' }} viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M0,10 Q100,-5 200,10" fill="none" stroke="var(--color-gold)" strokeWidth="8" strokeLinecap="round" /></svg>
            </span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', maxWidth: 600, margin: '0 auto', fontWeight: 700 }}>
            What started as a small dessert studio has grown into a beloved premium dessert boutique. Handcrafted for chocolate lovers.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '60px', alignItems: 'center' }}>
            <div style={{ position: 'relative', paddingBottom: '100%', borderRadius: '16px', overflow: 'hidden', border: '4px solid var(--color-plum)', boxShadow: 'var(--shadow-xl)', background: 'var(--color-white)' }}>
              <Image src="/hot-chocolate.png" alt="Our Story" fill style={{ objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ color: 'var(--color-berry)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Since 2025</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'var(--color-plum)', lineHeight: 1.1, marginBottom: '24px' }}>
                A Journey of Taste
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.8, fontSize: '1.1rem', fontWeight: 600, textAlign: 'justify' }}>
                Thirst. was founded in 2025 by a young chef with a dream of bringing the finest patisserie culture to the streets. From our beautiful flagship store in Thiruvallur, our handcrafted essence remains the core of everything we do.
              </p>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', lineHeight: 1.8, fontSize: '1.1rem', fontWeight: 600, textAlign: 'justify' }}>
                Our philosophy is simple: desserts are not just food — they are emotions. We create moments of joy, celebration, and pure indulgence through every handcrafted creation.
              </p>
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                {[{ value: '2', label: 'Years of Excellence' }, { value: '1', label: 'Flagship Store' }, { value: '10k+', label: 'Happy Customers' }].map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '2.5rem', color: 'var(--color-plum)' }}>{s.value}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section" style={{ background: 'var(--color-white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ color: 'var(--color-berry)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Our Values</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: 'var(--color-plum)' }}>What We Stand For</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--color-cream)', padding: '40px 32px', textAlign: 'center', border: '4px solid var(--color-plum)', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'var(--color-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    color: 'var(--color-plum)',
                    border: '4px solid var(--color-plum)'
                  }}
                >
                  <Icon size={32} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: '1.5rem', color: 'var(--color-plum)', marginBottom: '16px' }}>
                  {title}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.7, fontWeight: 600 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ color: 'var(--color-berry)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}><Users size={16} style={{ display: 'inline', marginBottom: '-3px' }}/> Our Team</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: 'var(--color-plum)' }}>The Faces Behind Thirst.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' }}>
            {team.map(member => (
              <div key={member.name} style={{ textAlign: 'center', padding: '32px', background: 'var(--color-white)', border: '4px solid var(--color-plum)', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
                <div style={{
                  width: 100, height: 100, borderRadius: '50%', background: 'var(--color-bg-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px', fontSize: '3rem',
                  border: '4px solid var(--color-plum)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {member.emoji}
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: '1.5rem', color: 'var(--color-plum)', marginBottom: '8px' }}>{member.name}</h3>
                <p style={{ color: 'var(--color-berry)', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase' }}>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards */}
      <section className="section" style={{ background: 'var(--color-gold)', textAlign: 'center', borderTop: '4px solid var(--color-plum)' }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--color-white)', padding: '8px 24px', borderRadius: '50px', border: '4px solid var(--color-plum)', boxShadow: 'var(--shadow-sm)', color: 'var(--color-plum)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '32px' }}>
            <Star size={18} /> Awards & Recognition
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'var(--color-plum)', marginBottom: '48px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Recognized for Excellence
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
            {[
              'Best Dessert Brand 2023 — India Food Awards',
              'Top Franchise Opportunity 2024 — Franchise India',
              'Customer Choice Award 2022 & 2023 — Google Reviews',
            ].map((award) => (
              <div key={award} style={{ background: 'var(--color-white)', borderRadius: '16px', padding: '32px 24px', border: '4px solid var(--color-plum)', maxWidth: 320, boxShadow: 'var(--shadow-md)' }}>
                <Award size={36} style={{ color: 'var(--color-berry)', marginBottom: '16px' }} />
                <p style={{ color: 'var(--color-plum)', fontSize: '1.1rem', lineHeight: 1.6, fontWeight: 700 }}>{award}</p>
              </div>
            ))}
          </div>
          <div className="flex-col-mobile" style={{ display: 'flex', marginTop: '60px', justifyContent: 'center' }}>
            <Link href="/franchise" className="btn btn-primary text-center-mobile" style={{ padding: '16px 24px', fontSize: '1.1rem', maxWidth: '100%', justifyContent: 'center' }}>
              Join Our Journey <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
