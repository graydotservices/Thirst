import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Percent, ArrowRight, Sparkles, Gift, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Offers & Deals — Thirst.',
  description: 'Exclusive offers and deals from Thirst. Premium dessert brand.',
};

const offers: any[] = [];



export default function OffersPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ paddingTop: 140, paddingBottom: 80, background: 'var(--color-gold)', textAlign: 'center', borderBottom: '4px solid var(--color-plum)' }}>
        <div className="container">
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '24px', background: 'var(--color-white)', border: '4px solid var(--color-plum)', boxShadow: 'var(--shadow-sm)', color: 'var(--color-plum)', padding: '8px 24px', borderRadius: '50px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Percent size={18} style={{ marginRight: '8px' }} /> Exclusive Offers
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 'clamp(3rem, 6vw, 5rem)', color: 'var(--color-plum)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '24px', lineHeight: 1.1 }}>
            Sweet Deals Await
          </h1>
          <p style={{ color: 'var(--color-plum)', fontSize: '1.2rem', maxWidth: 500, margin: '0 auto', fontWeight: 700 }}>
            Exclusive discounts, loyalty rewards, and seasonal specials — only at Thirst.
          </p>
        </div>
      </section>

      {/* Offers Grid */}
      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '40px' }}>
            {offers.map((offer) => (
              <div
                key={offer.id}
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--color-white)', border: '4px solid var(--color-plum)', borderRadius: '16px', boxShadow: 'var(--shadow-xl)' }}
              >
                {/* Banner */}
                <div
                  style={{
                    position: 'relative',
                    height: 200,
                    background: offer.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderBottom: '4px solid var(--color-plum)'
                  }}
                >
                  <Image
                    src={offer.image}
                    alt={offer.title}
                    fill
                    style={{ objectFit: 'contain', opacity: 0.3 }}
                    loading="lazy"
                  />
                  <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    {offer.discount > 0 && (
                      <div
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 400,
                          fontSize: '4.5rem',
                          color: 'var(--color-plum)',
                          lineHeight: 1,
                          letterSpacing: '2px',
                          textShadow: '3px 3px 0px var(--color-white)'
                        }}
                      >
                        {offer.discount}%
                        <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-sans)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0px' }}> OFF</span>
                      </div>
                    )}
                    <span style={{ display: 'inline-block', background: 'var(--color-plum)', color: 'var(--color-white)', marginTop: '12px', padding: '4px 16px', borderRadius: '50px', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem' }}>
                      {offer.tag}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, color: 'var(--color-plum)', fontSize: '1.8rem', marginBottom: '12px', textTransform: 'uppercase' }}>
                    {offer.title}
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '24px', flex: 1, fontWeight: 600 }}>
                    {offer.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'var(--color-cream)', padding: '16px', borderRadius: '8px', border: '2px dashed var(--color-plum)', marginBottom: '24px' }}>
                    {/* Code */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase' }}>Code:</span>
                      <span
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 400,
                          color: 'var(--color-berry)',
                          letterSpacing: '2px',
                          fontSize: '1.2rem',
                          textTransform: 'uppercase'
                        }}
                      >
                        {offer.code}
                      </span>
                    </div>
                    {/* Validity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      <Clock size={16} />
                      {offer.validUntil}
                    </div>
                  </div>
                  <Link href="/menu" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                    Avail Offer <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


    </>
  );
}
