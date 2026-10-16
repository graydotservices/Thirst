'use client';

import { useState, useMemo } from 'react';
import { MapPin, Phone, Clock, Navigation, Search, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useCompanySettings, getFormattedAddress, formatIndianPhoneDisplay } from '@/lib/companySettings';
import { useStoreLocations, StoreLocation } from '@/lib/storeLocations';

export default function StoreLocationsPage() {
  const { settings, formattedAddress, phoneDisplay } = useCompanySettings();
  const { locations: branchLocations, loading } = useStoreLocations();
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Combine Flagship store from company settings with branch locations
  const allLocations = useMemo<StoreLocation[]>(() => {
    const flagshipStore: StoreLocation = {
      id: 'flagship-hq',
      name: `${settings.name || 'Thirst.'} ${settings.city || 'Thiruvallur'} — Flagship`,
      address: formattedAddress || 'NO.01, Siva Vishnu kovil street, kakkalur, Thiruvallur, Tamil Nadu - 602001',
      city: settings.city || 'Thiruvallur',
      phone: phoneDisplay || settings.phone || '+91 87548 81546',
      hours: settings.opening_hours || '2:00 PM – 12:00 AM',
      map_url: settings.google_maps_url || 'https://maps.google.com/?q=NO.01,+Siva+Vishnu+kovil+street,+kakkalur,+Thiruvallur',
      is_flagship: true,
      is_active: true,
    };

    // Filter active branches from database/cache (skip duplicate of flagship if address matches)
    const validBranches = branchLocations.filter(b => {
      if (!b.is_active) return false;
      const isDuplicateFlagship = b.name.toLowerCase().includes('flagship') && 
        b.city.toLowerCase() === flagshipStore.city.toLowerCase();
      return !isDuplicateFlagship;
    });

    return [flagshipStore, ...validBranches];
  }, [settings, formattedAddress, phoneDisplay, branchLocations]);

  // Unique list of cities
  const cities = useMemo(() => {
    const list = Array.from(new Set(allLocations.map(l => l.city.trim().toUpperCase()))).filter(Boolean);
    return ['ALL', ...list];
  }, [allLocations]);

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return allLocations.filter(loc => {
      const matchCity = selectedCity === 'ALL' || loc.city.trim().toUpperCase() === selectedCity;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch = !query || 
        loc.name.toLowerCase().includes(query) || 
        loc.address.toLowerCase().includes(query) || 
        loc.city.toLowerCase().includes(query);
      return matchCity && matchSearch;
    });
  }, [allLocations, selectedCity, searchQuery]);

  return (
    <>
      {/* Hero Section */}
      <section style={{ paddingTop: 140, paddingBottom: 70, background: 'var(--color-bg-primary)', textAlign: 'center', borderBottom: '4px solid var(--color-plum)' }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', background: 'var(--color-white)', border: '4px solid var(--color-plum)', boxShadow: 'var(--shadow-sm)', color: 'var(--color-plum)', padding: '8px 24px', borderRadius: '50px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <MapPin size={18} style={{ marginRight: '8px', color: 'var(--color-berry)' }} /> Store Locations & Outlets
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 'clamp(2.75rem, 6vw, 4.75rem)', color: 'var(--color-plum)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px', lineHeight: 1.1 }}>
            Find Us Near You
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', maxWidth: 580, margin: '0 auto', fontWeight: 700 }}>
            Indulge in handcrafted luxury desserts at our flagship boutique in {settings.city || 'Thiruvallur'} and city branches.
          </p>
        </div>
      </section>

      {/* Filter and Location Directory */}
      <section className="section" style={{ background: 'var(--color-cream)', minHeight: '60vh' }}>
        <div className="container">
          {/* Controls Bar: Search & City Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginBottom: '48px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '440px' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search branch name, street, or city..."
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 46px',
                  borderRadius: '50px',
                  border: '3px solid var(--color-plum)',
                  background: 'white',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  outline: 'none',
                  boxShadow: 'var(--shadow-sm)'
                }}
              />
            </div>

            {/* City Tabs */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {cities.map(city => {
                const isSelected = selectedCity === city;
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    style={{
                      padding: '10px 22px',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: isSelected ? 'var(--color-berry)' : 'var(--color-white)',
                      color: isSelected ? 'white' : 'var(--color-plum)',
                      border: isSelected ? '4px solid var(--color-plum)' : '3px solid var(--color-plum)',
                      borderRadius: '50px',
                      boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locations Grid */}
          {filteredLocations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '24px', border: '3px dashed var(--color-plum)', maxWidth: '600px', margin: '0 auto' }}>
              <MapPin size={40} style={{ color: 'var(--color-berry)', marginBottom: '12px', opacity: 0.8 }} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-plum)', marginBottom: '8px' }}>
                No Outlets Found
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginBottom: '20px' }}>
                We couldn&apos;t find any stores matching &ldquo;{searchQuery || selectedCity}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => { setSelectedCity('ALL'); setSearchQuery(''); }}
                className="btn btn-secondary"
                style={{ display: 'inline-flex' }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="pad-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '32px' }}>
              {filteredLocations.map(loc => (
                <div
                  key={loc.id}
                  style={{
                    padding: '36px 30px',
                    position: 'relative',
                    background: 'var(--color-white)',
                    border: '4px solid var(--color-plum)',
                    borderRadius: '24px',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  {/* Badge */}
                  {loc.is_flagship ? (
                    <span style={{
                      position: 'absolute',
                      top: -16,
                      right: 24,
                      background: 'var(--color-berry)',
                      color: 'var(--color-white)',
                      padding: '4px 18px',
                      borderRadius: '50px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      fontSize: '0.82rem',
                      border: '3px solid var(--color-plum)',
                      letterSpacing: '1px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Sparkles size={13} /> Flagship
                    </span>
                  ) : (
                    <span style={{
                      position: 'absolute',
                      top: -14,
                      right: 24,
                      background: 'var(--color-gold)',
                      color: 'var(--color-plum)',
                      padding: '3px 14px',
                      borderRadius: '50px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      border: '2px solid var(--color-plum)',
                      letterSpacing: '0.5px'
                    }}>
                      {loc.city} Outlet
                    </span>
                  )}

                  {/* Store Name */}
                  <h3 style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    color: 'var(--color-plum)',
                    fontSize: '1.45rem',
                    marginBottom: '20px',
                    lineHeight: 1.25,
                    paddingRight: 60
                  }}>
                    {loc.name}
                  </h3>

                  {/* Details List */}
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', flex: 1, listStyle: 'none', padding: 0 }}>
                    <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <MapPin size={20} style={{ color: 'var(--color-berry)', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.5 }}>
                        {loc.address}
                      </span>
                    </li>

                    {loc.phone && (
                      <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Phone size={19} style={{ color: 'var(--color-berry)', flexShrink: 0 }} />
                        <a
                          href={`tel:${loc.phone.replace(/\s+/g, '')}`}
                          style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none' }}
                        >
                          {formatIndianPhoneDisplay(loc.phone)}
                        </a>
                      </li>
                    )}

                    <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <Clock size={19} style={{ color: 'var(--color-berry)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>
                        {loc.hours || '2:00 PM – 12:00 AM'}
                      </span>
                    </li>
                  </ul>

                  {/* Directions CTA */}
                  <a
                    href={loc.map_url || `https://maps.google.com/?q=${encodeURIComponent(loc.name + ', ' + loc.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{
                      justifyContent: 'center',
                      width: '100%',
                      padding: '12px 18px',
                      fontSize: '0.95rem',
                      fontWeight: 700
                    }}
                  >
                    <Navigation size={17} style={{ marginRight: '8px' }} /> Get Directions
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Franchise Call to Action */}
      <section className="section" style={{ background: 'var(--color-gold)', textAlign: 'center', borderTop: '4px solid var(--color-plum)' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', color: 'var(--color-plum)', marginBottom: '16px', textTransform: 'uppercase', lineHeight: 1.15 }}>
            Don&apos;t See Your City?
          </h2>
          <p style={{ color: 'var(--color-plum)', fontSize: '1.15rem', marginBottom: '36px', fontWeight: 700, maxWidth: '640px', margin: '0 auto 36px auto' }}>
            Bring Thirst.&apos;s luxury desserts and artisanal thick shakes to your neighborhood. Partner with our growing boutique cafe franchise!
          </p>
          <Link href="/franchise" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1.15rem', display: 'inline-flex' }}>
            Apply for Franchise
          </Link>
        </div>
      </section>
    </>
  );
}
