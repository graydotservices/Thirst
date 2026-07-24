'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, ShoppingCart, Coffee, Cake, IceCream, Sparkles, Heart, Gift } from 'lucide-react';

const categories = [
  { id: 'all', label: 'All Items', icon: Sparkles },
  { id: 'special', label: 'Thirst Special', icon: Coffee },
  { id: 'crushers', label: 'Crushers', icon: IceCream },
  { id: 'shakes', label: 'Thick Shakes & Boba', icon: Coffee },
  { id: 'treats', label: 'Treats & Cakes', icon: Cake },
  { id: 'waffles', label: 'Waffles & Pancakes', icon: Heart },
  { id: 'combos', label: 'Combos & Offers', icon: Gift },
];

const menuItems = [
  // THIRST SPECIAL
  { id: 1, name: 'Classic hot chocolate', category: 'special', price: 49, description: 'Smooth steamed milk blended with premium hot chocolate powder.', image: '/hot-chocolate.png', isNew: false, isBestSeller: true },
  { id: 2, name: 'Mallow Crown', category: 'special', price: 59, description: 'Soft marshmallows resting like royalty on rich hot chocolate.', image: '/hot-chocolate.png', isNew: false, isBestSeller: false },
  { id: 3, name: 'Cocoa Kick', category: 'special', price: 69, description: 'A bold burst of Milo stirred into silky hot chocolate.', image: '/hot-chocolate.png', isNew: true, isBestSeller: false },
  { id: 4, name: 'Paris Crackle', category: 'special', price: 79, description: 'Smooth hot chocolate meets the buttery crunch of French biscuits.', image: '/hot-chocolate.png', isNew: false, isBestSeller: false },
  { id: 5, name: 'The Signature Sip', category: 'special', price: 99, description: 'Hot chocolate with Milo, marshmallows, biscuit crunch, and a chocolate roll.', image: '/thick-shake.png', isNew: false, isBestSeller: true },
  
  // CRUSHERS
  { id: 6, name: 'Mango Crusher', category: 'crushers', price: 50, description: 'Refreshing mango crushed ice drink.', image: '/blue-crusher.png', isNew: false, isBestSeller: false },
  { id: 7, name: 'Litchi Crusher', category: 'crushers', price: 50, description: 'Refreshing litchi crushed ice drink.', image: '/blue-crusher.png', isNew: false, isBestSeller: false },
  { id: 8, name: 'Pineapple Crusher', category: 'crushers', price: 50, description: 'Refreshing pineapple crushed ice drink.', image: '/blue-crusher.png', isNew: false, isBestSeller: false },
  { id: 9, name: 'Orange Crusher', category: 'crushers', price: 50, description: 'Refreshing orange crushed ice drink.', image: '/blue-crusher.png', isNew: false, isBestSeller: false },
  { id: 10, name: 'Strawberry Crusher', category: 'crushers', price: 50, description: 'Refreshing strawberry crushed ice drink.', image: '/blue-crusher.png', isNew: false, isBestSeller: true },
  { id: 11, name: 'Kiwi Crusher', category: 'crushers', price: 60, description: 'Refreshing kiwi crushed ice drink.', image: '/blue-crusher.png', isNew: false, isBestSeller: false },
  { id: 12, name: 'Cindrella Double Shade', category: 'crushers', price: 60, description: 'Double shaded magical crusher.', image: '/blue-crusher.png', isNew: true, isBestSeller: false },
  { id: 13, name: 'Strawlitchi Double Shade', category: 'crushers', price: 60, description: 'Strawberry and Litchi shaded crusher.', image: '/blue-crusher.png', isNew: true, isBestSeller: false },
  
  // THICK SHAKES & BOBA
  { id: 14, name: 'Vanilla Frappe Shake', category: 'shakes', price: 99, description: 'Classic vanilla blended thick with a cool frappe twist.', image: '/thick-shake.png', isNew: false, isBestSeller: false },
  { id: 15, name: 'Chocolate Fudge Shake', category: 'shakes', price: 99, description: 'Thick chocolate blended deep with rich fudge.', image: '/thick-shake.png', isNew: false, isBestSeller: true },
  { id: 16, name: 'Rosemilk Shake', category: 'shakes', price: 50, description: 'Old-school rose with a thick twist.', image: '/thick-shake.png', isNew: false, isBestSeller: false },
  { id: 17, name: 'Vanilla Boba Shake', category: 'shakes', price: 119, description: 'Creamy vanilla blended thick, with boba.', image: '/thick-shake.png', isNew: true, isBestSeller: false },
  { id: 18, name: 'Chocolate Boba Shake', category: 'shakes', price: 119, description: 'Rich chocolate meets chewy boba.', image: '/thick-shake.png', isNew: true, isBestSeller: true },
  
  // THIRST TREATS & CAKES
  { id: 19, name: 'Classic Brownie', category: 'treats', price: 70, description: 'Soft, rich, and fudgy — the OG that never fails.', image: '/dream-cake.png', isNew: false, isBestSeller: true },
  { id: 20, name: 'Triple Chocolate Brownie', category: 'treats', price: 129, description: 'Dark, milk, and white — three layers of chocolate chaos.', image: '/dream-cake.png', isNew: false, isBestSeller: true },
  { id: 21, name: 'London Strawberry', category: 'treats', price: 159, description: 'Fresh cream and sweet strawberries.', image: '/dream-cake.png', isNew: false, isBestSeller: false },
  { id: 22, name: '5 Layer Torte Cake Cup', category: 'treats', price: 139, description: 'Five decadent layers stacked in a cup.', image: '/dream-cake.png', isNew: false, isBestSeller: false },
  { id: 23, name: 'Brownie Kebab', category: 'treats', price: 139, description: 'Skewered with brownie, marshmallow, and dripping chocolate.', image: '/dream-cake.png', isNew: true, isBestSeller: false },
  { id: 24, name: 'Kinder JoyBurst Cake', category: 'treats', price: 180, description: 'Made for the child in you, crafted for the taste you crave.', image: '/dream-cake.png', isNew: true, isBestSeller: false },
  { id: 25, name: 'Thirst Dream Cake', category: 'treats', price: 199, description: 'Must Try signature dream cake.', image: '/dream-cake.png', isNew: false, isBestSeller: true },
  
  // WAFFLES & PANCAKES
  { id: 26, name: 'Belgium Dark Waffle', category: 'waffles', price: 99, description: 'Rich dark chocolate over classic Belgian crisp.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: true },
  { id: 27, name: 'Nutella Delight Waffle', category: 'waffles', price: 119, description: 'Warm waffle layered with Nutella.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: true },
  { id: 28, name: 'Cotton Candy Waffle', category: 'waffles', price: 109, description: 'Fluffy pink sugar spun into a dreamy dessert ride.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 29, name: 'Choco Rocher Waffle', category: 'waffles', price: 119, description: 'Hazelnut chocolate, crunchy layers.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 30, name: 'Lotus Biscoff Waffle', category: 'waffles', price: 150, description: 'Not your average waffle. Biscoff-loaded.', image: '/biscoff-waffle.png', isNew: true, isBestSeller: true },
  { id: 31, name: 'Death by Chocolate Pancake', category: 'waffles', price: 139, description: 'An overdose of chocolate madness.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: true },
  { id: 32, name: 'Cookies & Cream Pancake', category: 'waffles', price: 119, description: 'Crunchy cookies collide with creamy bliss.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  
  // COMBOS & OFFERS
  { id: 33, name: 'Cold Milo + Double Chocolate Waffle', category: 'combos', price: 199, description: 'A dreamy combo for chocolate lovers.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: true },
  { id: 34, name: 'Students Special Combo', category: 'combos', price: 99, description: '6 Pcs Pancake + Mini Brownie + 1 Crusher.', image: '/hot-chocolate.png', isNew: false, isBestSeller: true },
  { id: 35, name: 'Mini Waffle (Student Offer)', category: 'combos', price: 35, description: 'Mini waffle with any flavor.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
];

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<number[]>([]);

  const filtered = menuItems.filter(
    (item) =>
      (activeCategory === 'all' || item.category === activeCategory) &&
      item.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (id: number) => {
    setCart((prev) => [...prev, id]);
    setTimeout(() => setCart((prev) => prev.filter((c) => c !== id)), 1500);
  };

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
            Handcrafted luxury desserts. From our viral Hot Chocolate to decadent Waffles and Dream Cakes.
          </p>
        </div>
      </section>

      {/* FILTER + SEARCH BAR */}
      <section style={{ 
        background: 'rgba(250, 243, 232, 0.95)', 
        backdropFilter: 'blur(20px)',
        padding: '24px 0', 
        position: 'sticky', 
        top: 72, 
        zIndex: 100, 
        borderBottom: '2px dashed var(--color-lavender-dark)', 
        boxShadow: 'var(--shadow-sm)' 
      }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 100%', minWidth: '280px' }}>
              <div style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: 'var(--color-text-muted)' }}>
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '14px 20px 14px 52px', 
                  borderRadius: '50px', 
                  border: '2px solid var(--color-plum)',
                  background: 'var(--color-white)',
                  fontSize: '1rem',
                  outline: 'none',
                  color: 'var(--color-plum)',
                  transition: '0.3s',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-berry)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-plum)'}
              />
            </div>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: '1 1 100%' }}>
              {categories.map(({ id, label, icon: Icon }) => {
                const isActive = activeCategory === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveCategory(id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      borderRadius: '50px',
                      border: '2px solid var(--color-plum)',
                      background: isActive ? 'var(--color-berry)' : 'var(--color-white)',
                      color: isActive ? 'var(--color-white)' : 'var(--color-plum)',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: isActive ? '4px 4px 0px rgba(62,39,35,1)' : '2px 2px 0px rgba(62,39,35,0.5)',
                      transform: isActive ? 'translate(-2px, -2px)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--color-gold)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--color-white)';
                      }
                    }}
                  >
                    <Icon size={16} />
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
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <div style={{ display: 'inline-flex', padding: '24px', background: 'white', borderRadius: '50%', marginBottom: '20px', border: '4px dashed var(--color-soft-pink)' }}>
                <Search size={40} color="var(--color-text-muted)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-plum)', marginBottom: '8px' }}>No items found</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
                We couldn't find anything matching your search. Try a different term.
              </p>
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
                      <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} loading="lazy" />
                      
                      {/* Badges */}
                      <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: '8px', zIndex: 10 }}>
                        {item.isBestSeller && (
                          <span style={{ background: 'var(--color-plum)', color: 'white', padding: '4px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Must Try
                          </span>
                        )}
                        {item.isNew && (
                          <span style={{ background: 'var(--color-berry)', color: 'white', padding: '4px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            New
                          </span>
                        )}
                      </div>
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
                      
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px', minHeight: '45px' }}>
                        {item.description}
                      </p>
                      
                      <button
                        onClick={() => addToCart(item.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '14px',
                          borderRadius: '50px',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 700,
                          fontSize: '1rem',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          background: cart.includes(item.id) ? 'var(--color-success)' : 'var(--color-soft-pink)',
                          color: cart.includes(item.id) ? 'white' : 'var(--color-berry)',
                        }}
                        onMouseEnter={(e) => {
                          if (!cart.includes(item.id)) {
                            e.currentTarget.style.background = 'var(--color-berry)';
                            e.currentTarget.style.color = 'white';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!cart.includes(item.id)) {
                            e.currentTarget.style.background = 'var(--color-soft-pink)';
                            e.currentTarget.style.color = 'var(--color-berry)';
                          }
                        }}
                      >
                        <ShoppingCart size={18} />
                        {cart.includes(item.id) ? 'Added to Cart!' : 'Add to Cart'}
                      </button>
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
