'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence, useInView, Variants } from 'framer-motion';
import {
  Star,
  ArrowRight,
  Clock,
  CheckCircle2,
  Heart,
  Camera,
  Share2,
  MessageSquare,
  Leaf,
  Timer,
  Quote,
  X,
  MapPin,
  Award,
  PlayCircle,
  MessageCircle,
} from 'lucide-react';
import { useCompanySettings } from '@/lib/companySettings';
import { useSignatureSettings } from '@/lib/signatureSettings';
import { supabase } from '@/lib/supabase';
import { formatCategoryLabel } from '@/lib/categories';

/* ============================================================
   TYPES & VISUAL MAPPINGS
============================================================ */
type FavoriteItem = {
  id: string;
  name: string;
  category: string;
  price: string;
  rating: number;
  img: string;
  description: string;
};

type CategoryVisual = {
  id: string;
  name: string;
  image: string;
  href: string;
  color: string;
};

const CATEGORY_VISUALS: Record<string, { image: string; color: string }> = {
  'special': { image: '/hot-chocolate.png', color: 'var(--color-berry)' },
  'shakes': { image: '/thick-shake.png', color: 'var(--color-lavender)' },
  'thick-shakes': { image: '/thick-shake.png', color: 'var(--color-lavender)' },
  'crushers': { image: '/blue-crusher.png', color: 'var(--color-berry)' },
  'treats': { image: '/dream-cake.png', color: 'var(--color-soft-pink)' },
  'cakes': { image: '/dream-cake.png', color: 'var(--color-soft-pink)' },
  'waffles': { image: '/biscoff-waffle.png', color: 'var(--color-gold)' },
  'combos': { image: '/hot-chocolate.png', color: 'var(--color-berry)' },
  'ice-cream': { image: '/icecream-product.png', color: 'var(--color-lavender)' },
};

function getCategoryVisual(slug: string, firstProductImage?: string) {
  const norm = slug.toLowerCase().trim();
  for (const [key, visual] of Object.entries(CATEGORY_VISUALS)) {
    if (norm.includes(key)) {
      return {
        image: firstProductImage || visual.image,
        color: visual.color
      };
    }
  }
  return {
    image: firstProductImage || '/dream-cake.png',
    color: 'var(--color-gold)'
  };
}



const instagramPosts = [
  '/hot-chocolate.png',
  '/biscoff-waffle.png',
  '/blue-crusher.png',
  '/thick-shake.png',
  '/dream-cake.png',
  '/biscoff-waffle.png',
];

const reviews = [
  { name: 'Priya Sharma', text: 'The Signature Sip is absolutely divine! The combination of hot chocolate and biscuit crunch is unmatched.', rating: 5 },
  { name: 'Arjun Mehta', text: 'Best Lotus Biscoff Waffle in town. Handcrafted to perfection with premium ingredients.', rating: 5 },
  { name: 'Sneha Patel', text: 'The Thirst Dream Cake is life-changing. Beautiful presentation and incredible taste.', rating: 5 },
];



/* ============================================================
   ANIMATION VARIANTS
============================================================ */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

/* ============================================================
   COMPONENTS
============================================================ */
function Counter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 2000;
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 800, color: '#D4A373' }}>
        {count}{suffix}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', fontWeight: 500, letterSpacing: '1px' }}>
        {label}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { settings, formattedAddress } = useCompanySettings();
  const { settings: signature } = useSignatureSettings();
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const [activeReview, setActiveReview] = useState(0);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [liveFavorites, setLiveFavorites] = useState<FavoriteItem[]>([]);
  const [liveCategories, setLiveCategories] = useState<CategoryVisual[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [totalProductsCount, setTotalProductsCount] = useState<number>(0);

  // Load live customer favorites and categories dynamically from Supabase products
  useEffect(() => {
    async function loadMenuData() {
      setLoadingMenu(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_available', true)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setTotalProductsCount(data.length);

          // 1. Live Customer Favorites (top 4 available products)
          const favorites: FavoriteItem[] = data.slice(0, 4).map((p, idx) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: typeof p.price === 'number' ? `₹${p.price}` : String(p.price ? (String(p.price).startsWith('₹') ? p.price : `₹${p.price}`) : '₹99'),
            rating: 4.8 + ((idx % 3) * 0.1),
            img: p.image || '/hot-chocolate.png',
            description: p.description?.trim() || 'Perfectly handcrafted with premium ingredients for an unforgettable taste.',
          }));
          setLiveFavorites(favorites);

          // 2. Dynamic Categories derived from live products
          const uniqueCats = Array.from(new Set(data.map(p => p.category).filter(Boolean)));
          const dynamicCats: CategoryVisual[] = uniqueCats.map(cat => {
            const firstProductWithImg = data.find(p => p.category === cat && p.image)?.image;
            const visual = getCategoryVisual(cat, firstProductWithImg);
            return {
              id: cat,
              name: formatCategoryLabel(cat),
              image: visual.image,
              href: `/menu?category=${encodeURIComponent(cat)}`,
              color: visual.color,
            };
          });
          setLiveCategories(dynamicCats);
        } else {
          setLiveFavorites([]);
          setLiveCategories([]);
        }
      } catch (err) {
        console.error('Failed to load menu products for homepage:', err);
        setLiveFavorites([]);
        setLiveCategories([]);
      } finally {
        setLoadingMenu(false);
      }
    }

    void loadMenuData();
  }, []);

  // Auto-slide testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveReview((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ background: 'var(--color-cream)' }}>
      {/* 1. STUNNING DARK PREMIUM HERO SECTION */}
      <section style={{ position: 'relative', minHeight: '80vh', display: 'flex', alignItems: 'center', background: 'var(--color-plum)', overflow: 'hidden', marginTop: '72px', color: 'var(--color-cream)' }}>
        
        {/* Subtle Luxury Background Glows */}
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 1 }} />
        
        <div className="container" style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', padding: '60px 20px' }}>
          
          {/* Left Content */}
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} style={{ flex: '1 1 500px' }}>
            <motion.div variants={fadeUp} style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '1px', background: '#D4AF37' }} />
              <span style={{ color: '#D4AF37', fontWeight: 600, letterSpacing: '4px', textTransform: 'uppercase', fontSize: '0.85rem' }}>Est. 2025</span>
            </motion.div>
            
            <motion.h1 variants={fadeUp} style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(3rem, 7vw, 5.5rem)', color: 'var(--color-cream)', fontWeight: 400, lineHeight: 1.05, marginBottom: '20px', letterSpacing: '-1px' }}>
              The Art of <br/>
              <span style={{ fontStyle: 'italic', color: '#D4AF37', fontWeight: 300 }}>Premium</span> Desserts.
            </motion.h1>
            
            <motion.p variants={fadeUp} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.15rem', fontWeight: 300, marginBottom: '40px', maxWidth: '480px', lineHeight: 1.7 }}>
              Experience the finest, handcrafted desserts made with authentic ingredients. Exquisitely crafted to elevate every moment.
            </motion.p>
            
            <motion.div variants={fadeUp} style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <Link href="/menu" style={{ background: '#D4AF37', color: 'var(--color-plum)', padding: '16px 40px', borderRadius: '50px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', fontSize: '0.9rem', boxShadow: '0 8px 30px rgba(212, 175, 55, 0.3)', transition: 'all 0.3s ease' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(212, 175, 55, 0.4)'; e.currentTarget.style.background = '#F3D275'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(212, 175, 55, 0.3)'; e.currentTarget.style.background = '#D4AF37'; }}>
                Explore Menu
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Image Composition */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} style={{ flex: '1 1 320px', position: 'relative', display: 'flex', justifyContent: 'center' }}>
            
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px', aspectRatio: '1 / 1.1', margin: '0 auto' }}>
               {/* Elegant Oval Image Container */}
               <div style={{ position: 'absolute', inset: 0, background: 'var(--color-cream)', borderRadius: '200px', overflow: 'hidden', zIndex: 2, boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5)', border: '2px solid rgba(212, 175, 55, 0.3)' }}>
                 <Image src="/dream-cake.png" alt="Signature Dessert" fill style={{ objectFit: 'cover', transform: 'scale(1.05)' }} priority />
               </div>

               {/* Elegant Floating Glass Badge */}
               <motion.div 
                 initial={{ y: 30, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ duration: 1, delay: 1 }}
                 style={{ position: 'absolute', bottom: '20px', left: '-30px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)', padding: '16px 24px', borderRadius: '16px', zIndex: 3, display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Star size={24} fill="#D4AF37" color="#D4AF37" />
                 </div>
                 <div>
                   <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-cream)', fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>Customer Favorite</div>
                   <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 400 }}>Rated 4.9/5</div>
                 </div>
               </motion.div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 2. FEATURED CATEGORIES */}
      <section className="pad-mobile" style={{ padding: '120px 0', background: 'var(--color-cream)' }}>
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="section-header">
            <motion.h2 variants={fadeUp} style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--color-plum)', textAlign: 'center', marginBottom: '60px' }}>
              Indulge in Our Collections
            </motion.h2>
          </motion.div>
          
          {loadingMenu ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '40px' }}>
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(74, 13, 51, 0.06)' }} />
                  <div style={{ width: '90px', height: '18px', borderRadius: '8px', background: 'rgba(74, 13, 51, 0.08)', marginTop: '20px' }} />
                </div>
              ))}
            </div>
          ) : liveCategories.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '40px' }}>
              {liveCategories.map((cat, i) => (
                <Link href={cat.href} key={cat.id || i}>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    whileHover={{ scale: 1.05, y: -10 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ width: '160px', height: '160px', borderRadius: '50%', overflow: 'hidden', position: 'relative', boxShadow: `0 10px 30px rgba(0,0,0,0.1)`, border: `2px solid ${cat.color}`, padding: '4px' }}>
                      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                        <Image 
                          src={cat.image} 
                          alt={cat.name} 
                          fill 
                          sizes="(max-width: 768px) 50vw, 25vw" 
                          unoptimized={Boolean(cat.image && cat.image.startsWith('http'))}
                          style={{ objectFit: 'cover' }} 
                        />
                        <motion.div whileHover={{ opacity: 1 }} initial={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(217,79,138,0.3)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s ease' }}>
                          <span style={{ color: 'white', fontWeight: 600 }}>Explore</span>
                        </motion.div>
                      </div>
                    </div>
                    <h3 style={{ marginTop: '20px', fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--color-plum)', textAlign: 'center' }}>{cat.name}</h3>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.7)', borderRadius: '24px', maxWidth: '600px', margin: '0 auto' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginBottom: '20px' }}>
                Handcrafted luxury desserts. Made fresh, served daily.
              </p>
              <Link href="/menu" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Explore Menu <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 3. TODAY'S SIGNATURE DESSERT */}
      {signature.is_active && (
        <section className="pad-mobile" style={{ padding: '120px 0', background: 'var(--gradient-hero)' }}>
          <div className="container">
            <div className="flex-col-mobile text-center-mobile gap-mobile-sm" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ flex: 1, minWidth: '280px', position: 'relative', width: '100%' }}>
                <div style={{ maxWidth: '300px', margin: '0 auto', width: '100%' }}>
                  <div style={{ position: 'relative', paddingBottom: '100%', borderRadius: '32px', overflow: 'hidden', border: '4px solid var(--color-plum)', boxShadow: 'var(--shadow-xl)', background: 'white' }}>
                    <Image
                      src={signature.image_url || '/vintage-hot-chocolate.png'}
                      alt={signature.title || 'The Signature Sip'}
                      fill
                      unoptimized={signature.image_url?.startsWith('http')}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} style={{ flex: 1, minWidth: '280px', textAlign: 'center' }}>
                {signature.badge && (
                  <div style={{ color: 'var(--color-berry)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>
                    {signature.badge}
                  </div>
                )}
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'var(--color-plum)', lineHeight: 1.1, marginBottom: '24px' }}>
                  {signature.title || 'The Signature Sip'}
                </h2>
                <p style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: '32px', fontWeight: 700 }}>
                  {signature.description}
                </p>
                
                <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {signature.rating_text && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Star fill="var(--color-gold)" color="var(--color-gold)" size={20} />
                      <span style={{ fontWeight: 800 }}>{signature.rating_text}</span>
                    </div>
                  )}
                  {signature.tag_text && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-plum)', fontWeight: 800 }}>
                      <Award color="var(--color-berry)" size={20} />
                      <span>{signature.tag_text}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {signature.price && (
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-plum)' }}>
                      {signature.price}
                    </div>
                  )}
                  <Link href={signature.button_link || '/menu'} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    {signature.button_text || 'View Menu'}
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* 4. BEST SELLERS / CUSTOMER FAVORITES */}
      <section className="pad-mobile" style={{ padding: '120px 0', background: 'var(--color-cream)' }}>
        <div className="container">
          <div className="flex-col-mobile text-center-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '60px', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--color-plum)' }}>Customer Favorites</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '1.1rem' }}>The most loved items from our live menu.</p>
            </div>
            <Link href="/menu" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-berry)', fontWeight: 600, fontSize: '1.1rem' }}>
              View All <ArrowRight size={20} />
            </Link>
          </div>

          {loadingMenu ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '32px' }}>
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} style={{ background: 'var(--color-white)', borderRadius: '24px', overflow: 'hidden', padding: '24px', height: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ width: '100%', height: '220px', borderRadius: '16px', background: 'rgba(74, 13, 51, 0.05)' }} />
                  <div style={{ width: '60%', height: '24px', borderRadius: '8px', background: 'rgba(74, 13, 51, 0.08)' }} />
                  <div style={{ width: '90%', height: '16px', borderRadius: '6px', background: 'rgba(74, 13, 51, 0.05)' }} />
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ width: '30%', height: '28px', borderRadius: '8px', background: 'rgba(74, 13, 51, 0.08)' }} />
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(74, 13, 51, 0.05)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : liveFavorites.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '32px' }}>
              {liveFavorites.map((item, i) => (
                <motion.div 
                  key={item.id || i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  whileHover={{ y: -12, boxShadow: '0 30px 60px rgba(0,0,0,0.12)' }}
                  style={{ 
                    background: 'var(--color-white)', 
                    borderRadius: '24px', 
                    overflow: 'hidden', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)', 
                    border: '1px solid rgba(0,0,0,0.03)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Heart Button */}
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                    <Heart size={20} color="var(--color-berry)" />
                  </motion.div>

                  {/* Image Section */}
                  <div style={{ position: 'relative', paddingBottom: '100%', overflow: 'hidden' }}>
                    <motion.div whileHover={{ scale: 1.08 }} transition={{ duration: 0.8, ease: "easeOut" }} style={{ position: 'absolute', inset: 0 }}>
                      <Image 
                        src={item.img} 
                        alt={item.name} 
                        fill 
                        unoptimized={Boolean(item.img && item.img.startsWith('http'))}
                        style={{ objectFit: 'cover' }} 
                      />
                    </motion.div>
                  </div>

                  {/* Content Section */}
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-cream)', padding: '6px 12px', borderRadius: '20px' }}>
                        <Star size={14} fill="var(--color-gold)" color="var(--color-gold)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-plum)' }}>{item.rating}</span>
                      </div>
                    </div>
                    
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-plum)', fontWeight: 600, marginBottom: '8px', lineHeight: 1.2 }}>{item.name}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginBottom: '24px', flex: 1 }}>{item.description}</p>
                    
                    {/* Footer (Price & Action) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-plum)' }}>{item.price}</span>
                      <Link href={`/menu?category=${encodeURIComponent(item.category || 'all')}`}>
                        <motion.div 
                          whileHover={{ scale: 1.05, backgroundColor: 'var(--color-plum)', color: 'white' }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-cream)', color: 'var(--color-plum)', transition: 'all 0.3s' }}
                        >
                          <ArrowRight size={22} />
                        </motion.div>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', maxWidth: '640px', margin: '0 auto' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--color-plum)', marginBottom: '12px' }}>
                Handcrafted Menu Updates
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '28px' }}>
                Our artisanal dessert menu is freshly crafted every morning. Explore our live catalog to discover all our sweet creations.
              </p>
              <Link href="/menu" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px' }}>
                Explore Menu <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </section>



      {/* 6. BRAND STORY */}
      <section className="pad-mobile" style={{ padding: '120px 0', background: 'white', overflow: 'hidden' }}>
        <div className="container">
          <div className="flex-col-mobile text-center-mobile gap-mobile-sm" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '80px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1 }} style={{ flex: '1 1 500px', width: '100%' }}>
              <div style={{ maxWidth: '350px', margin: '0 auto', width: '100%' }}>
                <div style={{ position: 'relative', paddingBottom: '120%', borderRadius: '40px', overflow: 'hidden', border: '4px solid var(--color-plum)', boxShadow: 'var(--shadow-xl)' }}>
                  <Image src="/hot-chocolate.png" alt="Brand Story" fill style={{ objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(62,39,35,0.4), transparent)' }} />
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ flex: '1 1 400px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'var(--color-plum)', lineHeight: 1.1, marginBottom: '32px' }}>
                Baking Memories Since 2025.
              </h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: '24px', textAlign: 'justify' }}>
                At Thirst, we believe that desserts are more than just food; they are an experience, an emotion, a memory in the making. What started as a small passion project has blossomed into a premium dessert boutique loved by millions.
              </p>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: '40px', textAlign: 'justify' }}>
                Every ingredient is carefully selected, and every recipe is crafted with meticulous attention to detail. We invite you to taste the art of pure luxury.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. INSTAGRAM GALLERY */}
      <section style={{ padding: '120px 0', background: 'var(--color-cream)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--color-plum)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <Camera size={36} color="var(--color-berry)" /> @thirst_fresh
            </h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
            {instagramPosts.map((img, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{ marginBottom: '20px', borderRadius: '24px', overflow: 'hidden', position: 'relative', cursor: 'pointer', breakInside: 'avoid' }}
                onClick={() => setSelectedImg(img)}
              >
                <div style={{ position: 'relative', width: '100%', paddingBottom: i % 2 === 0 ? '120%' : '100%' }}>
                  <Image src={img} alt="Instagram" fill style={{ objectFit: 'cover' }} />
                  <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, background: 'rgba(74,13,51,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={32} color="white" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTAGRAM MODAL */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setSelectedImg(null)}
          >
            <button style={{ position: 'absolute', top: '40px', right: '40px', color: 'white' }} onClick={() => setSelectedImg(null)}><X size={32} /></button>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} style={{ position: 'relative', width: '90%', maxWidth: '600px', paddingBottom: '100%', borderRadius: '24px', overflow: 'hidden' }}>
              <Image src={selectedImg} alt="Popup" fill style={{ objectFit: 'contain' }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. CUSTOMER TESTIMONIALS */}
      <section style={{ padding: '120px 0', background: 'linear-gradient(135deg, #F8ECF7 0%, #FFF7EE 100%)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <Quote size={48} color="var(--color-berry)" style={{ opacity: 0.3, margin: '0 auto 40px' }} />
          <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', minHeight: '250px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeReview}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                  {[...Array(reviews[activeReview].rating)].map((_, i) => <Star key={i} size={24} fill="var(--color-gold)" color="var(--color-gold)" />)}
                </div>
                <p style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontFamily: 'var(--font-heading)', color: 'var(--color-plum)', lineHeight: 1.4, marginBottom: '32px', fontStyle: 'italic' }}>
                  &quot;{reviews[activeReview].text}&quot;
                </p>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-berry)' }}>
                  — {reviews[activeReview].name}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '40px' }}>
            {reviews.map((_, i) => (
              <div key={i} onClick={() => setActiveReview(i)} style={{ width: '12px', height: '12px', borderRadius: '50%', background: i === activeReview ? 'var(--color-berry)' : 'rgba(217,79,138,0.3)', cursor: 'pointer', transition: '0.3s' }} />
            ))}
          </div>
        </div>
      </section>

      {/* 9. ACHIEVEMENTS */}
      <section style={{ padding: '100px 0', background: 'var(--color-plum)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
            {[
              { value: 1, suffix: '★', label: 'Flagship Store' },
              { value: 10, suffix: 'k+', label: 'Happy Customers' },
              { value: totalProductsCount > 0 ? totalProductsCount : 35, suffix: '+', label: 'Menu Items' },
              { value: 4.9, suffix: '★', label: 'Average Rating' },
            ].map((s, i) => <Counter key={i} value={s.value} suffix={s.suffix} label={s.label} />)}
          </div>
        </div>
      </section>

      {/* 10. FRANCHISE SECTION */}
      <section style={{ position: 'relative', padding: '160px 0', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Image src="/franchise-bg.png" alt="Franchise" fill style={{ objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(26,10,18,0.9) 0%, rgba(26,10,18,0.4) 100%)' }} />
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'white', lineHeight: 1.1, marginBottom: '24px' }}>
              Own a Piece of <span style={{ color: 'var(--color-gold)' }}>Luxury.</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.2rem', lineHeight: 1.8, marginBottom: '40px' }}>
              Join India&apos;s fastest-growing premium dessert brand. High ROI, comprehensive support, and a brand loved by millions.
            </p>
            <div className="flex-col-mobile" style={{ display: 'flex' }}>
              <Link href="/franchise" className="btn text-center-mobile" style={{ background: 'var(--color-gold)', color: 'var(--color-plum)', padding: '16px 24px', fontSize: '1.1rem', borderRadius: '50px', fontWeight: 700, boxShadow: '0 0 40px rgba(244,201,93,0.3)', justifyContent: 'center', maxWidth: '100%' }}>
                Apply for Franchise
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 11. LOCATION */}
      <section style={{ padding: '120px 0', background: 'var(--color-cream)', borderTop: '4px solid var(--color-plum)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'var(--color-plum)', textTransform: 'uppercase' }}>Find Thirst Near You</h2>
          </div>
          <div style={{ borderRadius: '16px', overflow: 'hidden', height: '500px', position: 'relative', border: '4px solid var(--color-plum)', boxShadow: 'var(--shadow-xl)', background: 'var(--color-white)' }}>
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15545.986!2d79.912!3d13.136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a528e1d51f28b49%3A0x6a0a0385fcb79606!2sKakkalur%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade">
            </iframe>
            
            <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'var(--color-white)', padding: '24px', borderRadius: '16px', width: 'calc(100% - 40px)', maxWidth: '350px', border: '4px solid var(--color-plum)', boxShadow: 'var(--shadow-md)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-plum)', marginBottom: '24px', textTransform: 'uppercase' }}>Store Locator</h3>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input type="text" placeholder="Enter city or pin code" style={{ flex: 1, minWidth: 0, padding: '12px 16px', borderRadius: '8px', border: '4px solid var(--color-plum)', outline: 'none', background: 'var(--color-cream)' }} />
                <button style={{ flexShrink: 0, background: 'var(--color-berry)', color: 'white', padding: '0 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', border: '4px solid var(--color-plum)' }}><MapPin size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', paddingBottom: '16px' }}>
                  <MapPin color="var(--color-berry)" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--color-plum)', marginBottom: '8px', textTransform: 'uppercase' }}>{settings.city || 'Thiruvallur'} Flagship</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{formattedAddress || 'NO.01, Siva Vishnu kovil street, kakkalur, Thiruvallur, TN - 602001'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

