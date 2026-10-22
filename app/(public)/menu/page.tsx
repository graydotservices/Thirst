'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Coffee, Cake, IceCream, Heart, Gift, type LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

import { formatCategoryLabel } from '@/lib/categories';

type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description?: string;
  stock: number;
  is_available: boolean;
};

function getCategoryIcon(cat: string): LucideIcon {
  const norm = cat.toLowerCase();
  if (norm.includes('cake') || norm.includes('treat')) return Cake;
  if (norm.includes('waffle') || norm.includes('pancake')) return Heart;
  if (norm.includes('ice')) return IceCream;
  if (norm.includes('combo') || norm.includes('offer')) return Gift;
  return Coffee;
}

function MenuContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; label: string; icon: LucideIcon }[]>([]);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Sync category param if URL changes
  useEffect(() => {
    const paramCat = searchParams.get('category');
    if (paramCat) {
      setActiveCategory(paramCat);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('is_available', true)
          .order('name');
          
        if (data && data.length > 0) {
          setMenuItems(data as MenuItem[]);
          
          // Dynamically extract categories from the live data
          const uniqueCategories = Array.from(new Set(data.map(item => item.category).filter(Boolean)));
          const dynamicCategories = [
            { id: 'all', label: 'All Items', icon: Sparkles },
            ...uniqueCategories.map(cat => ({ 
              id: cat, 
              label: formatCategoryLabel(cat), 
              icon: getCategoryIcon(cat)
            }))
          ];
          
          setCategories(dynamicCategories);
        } else {
          setMenuItems([]);
          setCategories([]);
        }
      } catch (err) {
        console.error('Failed to load menu products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const filtered = menuItems.filter(
    (item) =>
      (activeCategory === 'all' || item.category === activeCategory) &&
      item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: 'var(--color-bg-primary)', minHeight: '100vh' }}>
      
      {/* VINTAGE BAKERY HERO */}
      <section
        style={{
          paddingTop: 140,
          paddingBottom: 80,
          background: 'var(--gradient-hero)',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center'
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
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
            Our Menu
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 400,
              fontSize: 'clamp(3rem, 6vw, 4.5rem)',
              color: 'var(--color-plum)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '24px',
            }}
          >
            The Sweetest Selection
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', maxWidth: 600, margin: '0 auto', lineHeight: 1.6, fontWeight: 700 }}>
            Handcrafted luxury desserts. Made fresh, served daily.
          </p>
        </div>
      </section>

      {/* FILTER + SEARCH BAR */}
      <section style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(20px)',
        padding: '24px 0', 
        position: 'sticky', 
        top: 72, 
        zIndex: 100, 
        borderBottom: '1px solid rgba(0,0,0,0.05)', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)' 
      }}>
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: 'var(--color-plum)', opacity: 0.5 }}>
                <Search size={20} />
              </div>
              <input
                type="text"
                id="search-menu"
                name="search-menu"
                placeholder="Search our luxury desserts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '16px 24px 16px 56px', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: 'var(--color-cream)',
                  fontSize: '1.05rem',
                  outline: 'none',
                  color: 'var(--color-plum)',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-plum)';
                  e.target.style.background = 'var(--color-white)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(0,0,0,0.08)';
                  e.target.style.background = 'var(--color-cream)';
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
                }}
              />
            </div>

            {/* Categories */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '16px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '8px', maxWidth: '100%', scrollBehavior: 'smooth' }}>
              {categories.map(({ id, label, icon: Icon }) => {
                const isActive = activeCategory === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveCategory(id)}
                    style={{
                      display: 'flex',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      border: isActive ? '1px solid var(--color-plum)' : '1px solid rgba(0,0,0,0.06)',
                      background: isActive ? 'var(--color-plum)' : 'var(--color-white)',
                      color: isActive ? 'var(--color-gold)' : 'var(--color-plum)',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 600,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: isActive ? '0 8px 16px rgba(62,39,35,0.15)' : '0 2px 8px rgba(0,0,0,0.03)',
                    }}
                  >
                    <Icon size={18} opacity={isActive ? 1 : 0.6} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* MENU GRID */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '40px' }}>
              {[1, 2, 3, 4, 5, 6].map(idx => (
                <div key={idx} style={{ background: 'var(--color-white)', borderRadius: '16px', overflow: 'hidden', padding: '24px', height: '380px', display: 'flex', flexDirection: 'column', gap: '16px', border: '2px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '100%', height: '180px', borderRadius: '12px', background: 'rgba(74, 13, 51, 0.05)' }} />
                  <div style={{ width: '60%', height: '22px', borderRadius: '6px', background: 'rgba(74, 13, 51, 0.08)' }} />
                  <div style={{ width: '85%', height: '16px', borderRadius: '6px', background: 'rgba(74, 13, 51, 0.05)' }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <div style={{ display: 'inline-flex', padding: '24px', background: 'white', borderRadius: '50%', marginBottom: '20px', border: '4px dashed var(--color-soft-pink)' }}>
                <Search size={40} color="var(--color-text-muted)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-plum)', marginBottom: '8px' }}>
                {search.trim() ? 'No items found' : menuItems.length === 0 ? 'Dessert Menu In Preparation' : 'No items in this collection'}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 24px' }}>
                {search.trim() 
                  ? "We couldn't find anything matching your search. Try a different keyword." 
                  : menuItems.length === 0 
                  ? "Our fresh luxury menu is being prepared. Check back shortly to explore our full selection!"
                  : "We don't have items in this category right now. Browse our other sweet categories!"}
              </p>
              {activeCategory !== 'all' && (
                <button
                  onClick={() => setActiveCategory('all')}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Sparkles size={16} /> View All Items
                </button>
              )}
            </div>
          ) : (
            <motion.div layout className="pad-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '40px' }}>
              <AnimatePresence>
                {filtered.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    key={item.id} 
                    style={{
                      background: 'var(--color-white)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-md)',
                      border: '2px solid var(--color-plum)',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translate(-4px, -4px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translate(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '80%', overflow: 'hidden', borderBottom: '2px solid var(--color-plum)' }}>
                      <Image 
                        src={item.image || '/cake-product.png'} 
                        alt={item.name} 
                        fill 
                        sizes="(max-width: 768px) 100vw, 33vw" 
                        style={{ objectFit: 'cover' }} 
                        loading="lazy" 
                        unoptimized={Boolean(item.image && item.image.startsWith('http'))}
                      />
                    </div>
                    
                    <div style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h3
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 800,
                            color: 'var(--color-plum)',
                            fontSize: '1.25rem',
                            lineHeight: 1.3,
                            flex: 1,
                            paddingRight: '12px',
                          }}
                        >
                          {item.name}
                        </h3>
                        <span
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 900,
                            color: 'var(--color-berry)',
                            fontSize: '1.4rem',
                          }}
                        >
                          ₹{item.price}
                        </span>
                      </div>
                      
                      {item.description && (
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px', minHeight: '45px' }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)' }}>
        <span className="spinner"></span>
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
