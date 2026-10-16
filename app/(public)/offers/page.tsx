'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Percent, ArrowRight, Sparkles, Tag, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type OfferItem = {
  id: string;
  color: string;
  image: string;
  title: string;
  discount: number;
  tag: string;
  description: string;
  code: string;
  validUntil: string;
};

const DEFAULT_OFFERS: OfferItem[] = [
  {
    id: 'default-1',
    title: 'Happy Hours Special',
    description: 'Flat 15% off on all signature thick shakes and vintage hot chocolate orders placed between 2:00 PM and 5:00 PM.',
    discount: 15,
    code: 'HAPPY15',
    tag: 'Happy Hours',
    validUntil: 'Everyday 2-5 PM',
    color: 'var(--color-berry)',
    image: '/hot-chocolate.png',
  },
  {
    id: 'default-2',
    title: 'Weekend Dessert Duo',
    description: 'Order any luxury waffle and get 20% discount on any craft coffee or hot chocolate of your choice.',
    discount: 20,
    code: 'DUO20',
    tag: 'Weekend Special',
    validUntil: 'Sat & Sun',
    color: 'var(--color-plum)',
    image: '/biscoff-waffle.png',
  },
];

export default function OffersPage() {
  const [offersList, setOffersList] = useState<OfferItem[]>(DEFAULT_OFFERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOffers() {
      try {
        const { data, error } = await supabase
          .from('offers')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: OfferItem[] = data.map((o, idx) => ({
            id: o.id,
            title: o.title || 'Special Boutique Offer',
            description: o.description || 'Exclusive dessert privileges and promotional pricing handcrafted for you.',
            discount: o.discount_percent ?? o.discount ?? 0,
            code: o.code || 'THIRST',
            tag: o.tag || (o.discount_percent ? `${o.discount_percent}% OFF` : 'Exclusive Deal'),
            validUntil: o.valid_until ? o.valid_until.split('T')[0] : 'Ongoing',
            color: idx % 2 === 0 ? 'var(--color-berry)' : 'var(--color-plum)',
            image: o.image_url || (idx % 2 === 0 ? '/thick-shake.png' : '/biscoff-waffle.png'),
          }));
          setOffersList(mapped);
        }
      } catch {
        // Fallback to default offers
      } finally {
        setLoading(false);
      }
    }
    void loadOffers();
  }, []);

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
            {offersList.map((offer) => (
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
                    unoptimized={offer.image.startsWith('http')}
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
