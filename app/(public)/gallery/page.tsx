'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';
import type { Metadata } from 'next';

const galleryItems = [
  { id: 1, src: '/biscoff-waffle.png', alt: 'Lotus Biscoff Waffle', caption: 'Lotus Biscoff Waffle', span: 'large' },
  { id: 2, src: '/blue-crusher.png', alt: 'Strawberry Crusher', caption: 'Strawberry Crusher', span: 'small' },
  { id: 3, src: '/hot-chocolate.png', alt: 'Signature Sip', caption: 'Signature Sip', span: 'small' },
  { id: 4, src: '/dream-cake.png', alt: 'Dream Cake', caption: 'Thirst Dream Cake', span: 'wide' },
  { id: 5, src: '/hot-chocolate.png', alt: 'Mallow Crown', caption: 'Mallow Crown', span: 'small' },
  { id: 6, src: '/blue-crusher.png', alt: 'Litchi Crusher', caption: 'Litchi Crusher', span: 'small' },
  { id: 7, src: '/biscoff-waffle.png', alt: 'Waffles', caption: 'Classic Waffle', span: 'large' },
  { id: 8, src: '/thick-shake.png', alt: 'Cocoa Kick', caption: 'Cocoa Kick', span: 'small' },
  { id: 9, src: '/blue-crusher.png', alt: 'Mango Crusher', caption: 'Mango Crusher', span: 'small' },
];

export default function GalleryPage() {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const prev = () => setLightboxIdx((i) => (i === null || i === 0 ? galleryItems.length - 1 : i - 1));
  const next = () => setLightboxIdx((i) => (i === null ? 0 : (i === galleryItems.length - 1 ? 0 : i + 1)));

  return (
    <>
      {/* Hero */}
      <section style={{ paddingTop: 140, paddingBottom: 80, background: 'var(--color-bg-primary)', textAlign: 'center', borderBottom: '4px solid var(--color-plum)' }}>
        <div className="container">
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '24px', background: 'var(--color-white)', border: '4px solid var(--color-plum)', boxShadow: 'var(--shadow-sm)', color: 'var(--color-plum)', padding: '8px 24px', borderRadius: '50px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Gallery</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 'clamp(3rem, 6vw, 5rem)', color: 'var(--color-plum)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '24px', lineHeight: 1.1 }}>
            Our Visual World
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', maxWidth: 500, margin: '0 auto', fontWeight: 700 }}>
            A glimpse into the artistry and love behind every creation.
          </p>
        </div>
      </section>

      {/* Masonry Gallery */}
      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          <div
            style={{
              columns: 'auto 300px',
              columnGap: '32px',
            }}
          >
            {galleryItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setLightboxIdx(idx)}
                style={{
                  breakInside: 'avoid',
                  marginBottom: '32px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  background: 'var(--color-white)',
                  border: '4px solid var(--color-plum)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div style={{ background: 'var(--color-gold)' }}>
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={600}
                    height={idx % 3 === 0 ? 700 : 400}
                    style={{ width: '100%', height: 'auto', display: 'block', transition: 'transform var(--transition-slow)' }}
                    loading="lazy"
                    className="gallery-img"
                  />
                </div>
                <div style={{ padding: '16px', textAlign: 'center', borderTop: '4px solid var(--color-plum)' }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: '1.2rem', color: 'var(--color-plum)' }}>{item.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxIdx(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(62,39,35,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <button
            onClick={() => setLightboxIdx(null)}
            aria-label="Close lightbox"
            style={{ position: 'absolute', top: 20, right: 20, background: 'var(--color-white)', border: '4px solid var(--color-plum)', color: 'var(--color-plum)', padding: 12, borderRadius: '50%', cursor: 'pointer', zIndex: 10 }}
          >
            <X size={24} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous image"
            style={{ position: 'absolute', left: 20, background: 'var(--color-white)', border: '4px solid var(--color-plum)', color: 'var(--color-plum)', padding: '12px 16px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem', fontWeight: 800 }}
          >
            ‹
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 800, width: '90%', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '4px solid var(--color-plum)', boxShadow: 'var(--shadow-xl)', background: 'var(--color-white)' }}
          >
            <div style={{ background: 'var(--color-gold)' }}>
              <Image
                src={galleryItems[lightboxIdx].src}
                alt={galleryItems[lightboxIdx].alt}
                width={800}
                height={600}
                style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: '70vh', display: 'block' }}
              />
            </div>
            <div style={{ background: 'var(--color-cream)', padding: '24px', textAlign: 'center', borderTop: '4px solid var(--color-plum)' }}>
              <p style={{ color: 'var(--color-plum)', fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: '1.5rem', textTransform: 'uppercase' }}>{galleryItems[lightboxIdx].caption}</p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', fontWeight: 700, marginTop: '8px' }}>{lightboxIdx + 1} / {galleryItems.length}</p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next image"
            style={{ position: 'absolute', right: 20, background: 'var(--color-white)', border: '4px solid var(--color-plum)', color: 'var(--color-plum)', padding: '12px 16px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem', fontWeight: 800 }}
          >
            ›
          </button>
        </div>
      )}

      <style jsx>{`
        .gallery-img:hover {
          transform: scale(1.05);
        }
      `}</style>
    </>
  );
}
