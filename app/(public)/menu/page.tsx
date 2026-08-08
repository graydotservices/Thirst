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
  { id: 'snacks', label: 'Snacks & Bites', icon: Coffee },
  { id: 'combos', label: 'Combos', icon: Gift },
];

const menuItems = [
  // THIRST SPECIAL
  { id: 1, name: 'Classic hot chocolate', category: 'special', price: 49, description: 'Smooth steamed milk blended with premium hot chocolate powder for a rich, comforting cocoa experience. Simple, timeless, and satisfying.', image: '/hot-chocolate.png', isNew: false, isBestSeller: true },
  { id: 2, name: 'Mallow Crown', category: 'special', price: 59, description: 'Soft marshmallows resting like royalty on rich hot chocolate — comfort at its finest. Only at Thirst. One for Living.', image: '/hot-chocolate.png', isNew: false, isBestSeller: false },
  { id: 3, name: 'Cocoa Kick', category: 'special', price: 69, description: 'A bold burst of Milo stirred into silky hot chocolate — fuel for your fire.', image: '/hot-chocolate.png', isNew: false, isBestSeller: false },
  { id: 4, name: 'Paris Crackle', category: 'special', price: 79, description: 'Smooth hot chocolate meets the buttery crunch of French biscuits — a sip of Paris in every sip.', image: '/hot-chocolate.png', isNew: false, isBestSeller: false },
  { id: 5, name: 'The Signature Sip', category: 'special', price: 99, description: 'Hot chocolate with Milo, marshmallows, biscuit crunch, and a chocolate roll — all in one perfect sip.', image: '/hot-chocolate.png', isNew: false, isBestSeller: true },

  // CRUSHERS & DOUBLE SHADE
  { id: 6, name: 'Mango', category: 'crushers', price: 50, description: 'Refreshing mango crushed ice drink.', image: '/blue-crusher.png', isNew: false, isBestSeller: false },
  { id: 7, name: 'Litchi', category: 'crushers', price: 50, description: 'Refreshing litchi crushed ice drink.', image: '/blue-crusher.png', isNew: false, isBestSeller: false },
  { id: 8, name: 'Pineapple', category: 'crushers', price: 50, description: 'Refreshing pineapple crushed ice drink.', image: '/blue-crusher.png', isNew: false, isBestSeller: false },
  { id: 9, name: 'Orange', category: 'crushers', price: 50, description: 'Refreshing orange crushed ice drink.', image: '/blue-crusher.png', isNew: false, isBestSeller: false },
  { id: 10, name: 'Strawberry', category: 'crushers', price: 50, description: 'Refreshing strawberry crushed ice drink.', image: '/blue-crusher.png', isNew: false, isBestSeller: true },
  { id: 11, name: 'Blackcurrent', category: 'crushers', price: 60, description: 'Refreshing blackcurrent crushed ice drink.', image: '/blue-crusher.png', isNew: false, isBestSeller: false },
  { id: 12, name: 'Kiwi', category: 'crushers', price: 50, description: 'Refreshing kiwi crushed ice drink.', image: '/blue-crusher.png', isNew: false, isBestSeller: false },
  { id: 13, name: 'Cindrella Double Shade', category: 'crushers', price: 60, description: 'Double shaded magical crusher.', image: '/blue-crusher.png', isNew: true, isBestSeller: false },
  { id: 14, name: 'Strawlitchi Double Shade', category: 'crushers', price: 60, description: 'Strawberry and Litchi shaded crusher.', image: '/blue-crusher.png', isNew: true, isBestSeller: false },
  { id: 15, name: 'Fruit Fiesta Double Shade', category: 'crushers', price: 60, description: 'A refreshing mix of fruits.', image: '/blue-crusher.png', isNew: true, isBestSeller: false },

  // THICK SHAKES & BOBA
  { id: 16, name: 'Vanilla Frappe Shake', category: 'shakes', price: 99, description: 'Classic vanilla blended thick with a cool frappe twist', image: '/thick-shake.png', isNew: false, isBestSeller: false },
  { id: 17, name: 'Chocolate Fudge Shake', category: 'shakes', price: 99, description: 'Thick chocolate blended deep with rich fudge — pure indulgence in every sip.', image: '/thick-shake.png', isNew: false, isBestSeller: true },
  { id: 18, name: 'Rosemilk Shake', category: 'shakes', price: 50, description: 'Old-school rose with a thick twist — smooth, sweet, and chill.', image: '/thick-shake.png', isNew: false, isBestSeller: false },
  { id: 19, name: 'Vanilla Boba Shake', category: 'shakes', price: 119, description: 'Rich chocolate meets chewy boba — thick, bold, and crave-worthy.', image: '/thick-shake.png', isNew: true, isBestSeller: false },
  { id: 20, name: 'Chocolate Boba Shake', category: 'shakes', price: 119, description: 'Creamy vanilla blended thick, with boba in every soft, sweet sip.', image: '/thick-shake.png', isNew: true, isBestSeller: false },
  { id: 21, name: 'Boba Love', category: 'shakes', price: 119, description: 'The ultimate boba experience.', image: '/thick-shake.png', isNew: true, isBestSeller: true },
  { id: 22, name: 'Protein Shake', category: 'shakes', price: 150, description: 'Whether you aim to bulk up or slim down, our shakes are blended for your body goals.', image: '/thick-shake.png', isNew: false, isBestSeller: false },
  { id: 23, name: 'Cold Milo', category: 'shakes', price: 120, description: 'The classic cold milo thickshake.', image: '/thick-shake.png', isNew: false, isBestSeller: false },
  { id: 24, name: 'Lotus Biscoff Shake', category: 'shakes', price: 140, description: 'Loaded with biscoff goodness.', image: '/thick-shake.png', isNew: false, isBestSeller: true },
  { id: 25, name: 'Oreo Thickshake', category: 'shakes', price: 110, description: 'Classic oreo thickshake.', image: '/thick-shake.png', isNew: false, isBestSeller: false },
  { id: 26, name: 'Nutella Shake', category: 'shakes', price: 120, description: 'Rich nutella blended into a smooth shake.', image: '/thick-shake.png', isNew: false, isBestSeller: false },

  // THIRST TREATS & CAKES
  { id: 27, name: 'Classic Brownie', category: 'treats', price: 70, description: 'Soft, rich, and fudgy — the OG that never fails.', image: '/dream-cake.png', isNew: false, isBestSeller: true },
  { id: 28, name: 'Triple Chocolate Brownie', category: 'treats', price: 129, description: 'Dark, milk, and white — three layers of chocolate chaos.', image: '/dream-cake.png', isNew: false, isBestSeller: false },
  { id: 29, name: 'London Strawberry', category: 'treats', price: 159, description: 'Fresh cream and sweet strawberries, layered with a British twist.', image: '/dream-cake.png', isNew: false, isBestSeller: false },
  { id: 30, name: '5 Layer Torte Cake Cup', category: 'treats', price: 139, description: 'Five decadent layers stacked in a cup — every spoon, a surprise.', image: '/dream-cake.png', isNew: false, isBestSeller: false },
  { id: 31, name: 'Brownie Kebab', category: 'treats', price: 139, description: 'Skewered with brownie, marshmallow, and dripping chocolate — dessert, but fun.', image: '/dream-cake.png', isNew: true, isBestSeller: false },
  { id: 32, name: 'Kinder JoyBurst Cake', category: 'treats', price: 180, description: 'Made for the child in you, crafted for the taste you crave.', image: '/dream-cake.png', isNew: true, isBestSeller: true },
  { id: 33, name: 'Thirst Dream Cake', category: 'treats', price: 199, description: 'Must Try signature dream cake.', image: '/dream-cake.png', isNew: false, isBestSeller: true },
  { id: 34, name: 'Hot Choco Brownie', category: 'treats', price: 139, description: 'Warm brownie meets creamy hot chocolate — rich, fudgy, and heart-melting. Must Try!', image: '/dream-cake.png', isNew: false, isBestSeller: true },

  // WAFFLES
  { id: 35, name: 'Belgium Dark Waffle', category: 'waffles', price: 99, description: 'Rich dark chocolate over classic Belgian crisp.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: true },
  { id: 36, name: 'Belgium White Waffle', category: 'waffles', price: 99, description: 'Smooth white chocolate drizzle on golden waffles', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 37, name: 'Belgium Milk Waffle', category: 'waffles', price: 99, description: 'Creamy milk chocolate melted over a Belgian base.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 38, name: 'Nutella Delight Waffle', category: 'waffles', price: 119, description: 'Warm waffle layered with Nutella — simple, sweet, divine.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: true },
  { id: 39, name: 'Strawberry Delight Waffle', category: 'waffles', price: 109, description: 'Fresh strawberries and cream on a crisp waffle kiss.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 40, name: 'Cookie & Cream Waffle', category: 'waffles', price: 109, description: 'Crunchy cookies collide with creamy bliss.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 41, name: 'Cotton Candy Waffle', category: 'waffles', price: 109, description: 'Fluffy pink sugar spun into a dreamy dessert ride.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 42, name: 'Choco Rocher Waffle', category: 'waffles', price: 119, description: 'Hazelnut chocolate, crunchy layers, and luxury in every bite.', image: '/biscoff-waffle.png', isNew: true, isBestSeller: true },
  { id: 43, name: 'Malai Kulfi Waffle', category: 'waffles', price: 119, description: 'Desi kulfi meets warm waffle — chilled meets crisp.', image: '/biscoff-waffle.png', isNew: true, isBestSeller: false },
  { id: 44, name: 'Cookie Crunch Waffle', category: 'waffles', price: 119, description: 'Crunchy cookie bits loaded on a warm base — fun in every fork.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 45, name: 'Double Chocolate Waffle', category: 'waffles', price: 129, description: 'Twice the chocolate, double the mood.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 46, name: 'Triple Chocolate Waffle', category: 'waffles', price: 139, description: 'Dark, milk, and white — all melted into one rich waffle.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 47, name: 'Lotus Biscoff Waffle', category: 'waffles', price: 150, description: 'Not your average waffle. This one’s Biscoff-loaded.', image: '/biscoff-waffle.png', isNew: true, isBestSeller: true },

  // PANCAKES / DORAYAKI
  { id: 48, name: 'Belgium Dark Pancake', category: 'waffles', price: 109, description: 'Dive into deep, bold chocolate that melts your soul with richness', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 49, name: 'Belgium White Pancake', category: 'waffles', price: 109, description: 'A silky, sweet embrace that whispers elegance in every single bite', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 50, name: 'Belgium Milk Pancake', category: 'waffles', price: 109, description: 'Smooth and creamy, the timeless chocolate comfort you always crave.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 51, name: 'Cookies & Cream Pancake', category: 'waffles', price: 119, description: 'Crunchy cookies collide with creamy bliss, creating the perfect dream bite.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 52, name: 'Cotton Candy Pancake', category: 'waffles', price: 119, description: 'Fluffy sweetness spun inside, a magical cloud of happiness awaits.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 53, name: 'Cookie Crunch Pancake', category: 'waffles', price: 119, description: 'Crunchy surprises in every bite, making your heart smile instantly', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 54, name: 'Double Chocolate Pancake', category: 'waffles', price: 129, description: 'Twice the chocolate, endless joy, and double layers of sweetness', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
  { id: 55, name: 'Death by Chocolate Pancake', category: 'waffles', price: 139, description: 'An overdose of chocolate madness, only for fearless chocoholics inside', image: '/biscoff-waffle.png', isNew: true, isBestSeller: true },
  { id: 56, name: 'Nutella Pancake', category: 'waffles', price: 139, description: 'Smooth hazelnut and chocolate blend, creating a creamy, heavenly filling everyone loves.', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },

  // SNACKS
  { id: 57, name: 'Veg Maggie', category: 'snacks', price: 40, description: 'Hot and spicy veg maggie.', image: '/hot-chocolate.png', isNew: false, isBestSeller: false },
  { id: 58, name: 'Cheese Maggie', category: 'snacks', price: 60, description: 'Cheesy, hot, and spicy maggie.', image: '/hot-chocolate.png', isNew: false, isBestSeller: true },

  // COMBOS
  { id: 59, name: 'Vanilla Thickshake + Belgium Dark', category: 'combos', price: 169, description: 'Dreamy Combo: Vanilla Thickshake + Belgium Dark Waffle', image: '/thick-shake.png', isNew: false, isBestSeller: true },
  { id: 60, name: 'Nutella Thickshake + Classic Brownie', category: 'combos', price: 159, description: 'Dreamy Combo: Nutella Thickshake + Classic Brownie', image: '/thick-shake.png', isNew: false, isBestSeller: false },
  { id: 61, name: 'Biscoff Shake + Belgium White', category: 'combos', price: 199, description: 'Dreamy Combo: Biscoff Shake + Belgium White Waffle', image: '/thick-shake.png', isNew: false, isBestSeller: true },
  { id: 62, name: 'Triple Choco Brownie + 15pcs Pancake', category: 'combos', price: 199, description: 'Dreamy Combo: Triple Chocolate Brownie + 15 pcs Pancake (Any Flavor)', image: '/dream-cake.png', isNew: false, isBestSeller: false },
  { id: 63, name: 'Classic Hot Chocolate + Kinder Cake', category: 'combos', price: 189, description: 'Dreamy Combo: Classic Hot Chocolate + kinder joy Cake', image: '/hot-chocolate.png', isNew: false, isBestSeller: true },
  { id: 64, name: 'Cold Milo + Double Choco Waffle', category: 'combos', price: 199, description: 'Dreamy Combo: Cold Milo + Double Chocolate Waffle', image: '/biscoff-waffle.png', isNew: false, isBestSeller: false },
];

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
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
            Handcrafted luxury desserts. From our viral Hot Chocolate to decadent Waffles and Dream Cakes.
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
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--color-cream)';
                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--color-white)';
                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)';
                      }
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
                      <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} loading="lazy" />
                      
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
