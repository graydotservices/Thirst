import type { Metadata } from 'next';
import { MapPin, Phone, Clock, Navigation } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Store Locations — Thirst.',
  description: 'Find a Thirst. cafe near you. 50+ locations across India.',
};

const locations = [
  { id: 1, name: 'Thirst. Thiruvallur — Flagship', address: 'NO.01, Siva Vishnu kovil st, kakkalur', city: 'Thiruvallur', phone: '+91 87548 81546', hours: '10:00 AM – 11:00 PM', mapUrl: 'https://maps.google.com', isFlg: true },
];

const cities = [...new Set(locations.map(l => l.city))];

export default function StoreLocationsPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ paddingTop: 140, paddingBottom: 80, background: 'var(--color-bg-primary)', textAlign: 'center', borderBottom: '4px solid var(--color-plum)' }}>
        <div className="container">
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '24px', background: 'var(--color-white)', border: '4px solid var(--color-plum)', boxShadow: 'var(--shadow-sm)', color: 'var(--color-plum)', padding: '8px 24px', borderRadius: '50px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <MapPin size={18} style={{ marginRight: '8px' }} /> Store Locations
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 'clamp(3rem, 6vw, 5rem)', color: 'var(--color-plum)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '24px', lineHeight: 1.1 }}>
            Find Us Near You
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', maxWidth: 500, margin: '0 auto', fontWeight: 700 }}>
            Visit our flagship store in Thiruvallur. More locations coming soon!
          </p>
        </div>
      </section>

      {/* City Filter + Grid */}
      <section className="section" style={{ background: 'var(--color-cream)' }}>
        <div className="container">
          {/* Cities */}
          <div style={{ marginBottom: '60px', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {cities.map(city => (
              <span key={city} style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', background: 'var(--color-white)', border: '4px solid var(--color-plum)', borderRadius: '50px', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', color: 'var(--color-plum)' }}>
                {city}
              </span>
            ))}
          </div>

          {/* Locations Grid */}
          <div className="pad-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '32px' }}>
            {locations.map(loc => (
              <div key={loc.id} style={{ padding: '32px', position: 'relative', background: 'var(--color-white)', border: '4px solid var(--color-plum)', borderRadius: '16px', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
                {loc.isFlg && (
                  <span style={{ position: 'absolute', top: -16, right: 24, background: 'var(--color-berry)', color: 'var(--color-white)', padding: '4px 16px', borderRadius: '50px', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', border: '4px solid var(--color-plum)', letterSpacing: '1px' }}>Flagship</span>
                )}
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, color: 'var(--color-plum)', fontSize: '1.5rem', marginBottom: '24px', paddingRight: loc.isFlg ? 80 : 0 }}>
                  {loc.name}
                </h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', flex: 1 }}>
                  <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <MapPin size={20} style={{ color: 'var(--color-berry)', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', fontWeight: 600 }}>{loc.address}, {loc.city}</span>
                  </li>
                  <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Phone size={20} style={{ color: 'var(--color-berry)', flexShrink: 0 }} />
                    <a href={`tel:${loc.phone}`} style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', fontWeight: 600, textDecoration: 'none' }}>{loc.phone}</a>
                  </li>
                  <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Clock size={20} style={{ color: 'var(--color-berry)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', fontWeight: 600 }}>{loc.hours}</span>
                  </li>
                </ul>
                <a
                  href={loc.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'center', width: '100%' }}
                >
                  <Navigation size={18} style={{ marginRight: '8px' }} /> Get Directions
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Franchise CTA */}
      <section className="section" style={{ background: 'var(--color-gold)', textAlign: 'center', borderTop: '4px solid var(--color-plum)' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'var(--color-plum)', marginBottom: '16px', textTransform: 'uppercase' }}>
            Don&apos;t See Your City?
          </h2>
          <p style={{ color: 'var(--color-plum)', fontSize: '1.2rem', marginBottom: '40px', fontWeight: 700 }}>
            Become a Thirst. franchise partner and bring the luxury to your city!
          </p>
          <a href="/franchise" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1.2rem' }}>
            Apply for Franchise
          </a>
        </div>
      </section>
    </>
  );
}
