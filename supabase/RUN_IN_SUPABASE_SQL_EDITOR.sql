-- ============================================================
-- THIRST. — EXECUTE THIS SCRIPT IN SUPABASE SQL EDITOR
-- Run this in your Supabase SQL editor:
-- https://supabase.com/dashboard/project/ecmwqikinlmmrsgjdbbd/sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. THE SIGNATURE SECTION SETTINGS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.signature_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  is_active BOOLEAN DEFAULT true,
  badge TEXT DEFAULT 'Thirst Special',
  title TEXT DEFAULT 'The Signature Sip',
  description TEXT DEFAULT 'Hot chocolate with Milo, marshmallows, biscuit crunch, and a chocolate roll. A truly decadent experience handcrafted for chocolate lovers.',
  rating_text TEXT DEFAULT '5.0 (250+ reviews)',
  tag_text TEXT DEFAULT 'Best Seller',
  price TEXT DEFAULT '₹99',
  button_text TEXT DEFAULT 'View Menu',
  button_link TEXT DEFAULT '/menu',
  image_url TEXT DEFAULT '/vintage-hot-chocolate.png',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row if not exists
INSERT INTO public.signature_settings (
  id, is_active, badge, title, description, rating_text, tag_text, price, button_text, button_link, image_url
) VALUES (
  'primary',
  true,
  'Thirst Special',
  'The Signature Sip',
  'Hot chocolate with Milo, marshmallows, biscuit crunch, and a chocolate roll. A truly decadent experience handcrafted for chocolate lovers.',
  '5.0 (250+ reviews)',
  'Best Seller',
  '₹99',
  'View Menu',
  '/menu',
  '/vintage-hot-chocolate.png'
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for signature_settings
ALTER TABLE public.signature_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read signature settings" ON public.signature_settings;
DROP POLICY IF EXISTS "public_signature_settings" ON public.signature_settings;
CREATE POLICY "Public read signature settings" ON public.signature_settings 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated update signature settings" ON public.signature_settings;
DROP POLICY IF EXISTS "management_access_signature" ON public.signature_settings;
CREATE POLICY "Authenticated update signature settings" ON public.signature_settings 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON public.signature_settings TO anon, authenticated;
GRANT ALL ON public.signature_settings TO authenticated, service_role;

-- ------------------------------------------------------------
-- 2. ALLOW DYNAMIC / CUSTOM PRODUCT CATEGORIES IN INVENTORY
-- ------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.products'::regclass 
      AND contype = 'c' 
      AND pg_get_constraintdef(oid) LIKE '%category%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.products DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

ALTER TABLE public.products ADD CONSTRAINT products_category_check 
  CHECK (length(btrim(category)) BETWEEN 1 AND 100);

-- ------------------------------------------------------------
-- 3. SEED AUTHENTIC THIRST MENU ITEMS (35 ITEMS)
-- ------------------------------------------------------------
INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Classic hot chocolate', 'special', 49, 'Smooth steamed milk blended with premium hot chocolate powder.', '/hot-chocolate.png', 50, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Classic hot chocolate');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Mallow Crown', 'special', 59, 'Soft marshmallows resting like royalty on rich hot chocolate.', '/hot-chocolate.png', 40, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Mallow Crown');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Cocoa Kick', 'special', 69, 'A bold burst of Milo stirred into silky hot chocolate.', '/hot-chocolate.png', 40, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Cocoa Kick');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Paris Crackle', 'special', 79, 'Smooth hot chocolate meets the buttery crunch of French biscuits.', '/hot-chocolate.png', 35, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Paris Crackle');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'The Signature Sip', 'special', 99, 'Hot chocolate with Milo, marshmallows, biscuit crunch, and a chocolate roll.', '/thick-shake.png', 45, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'The Signature Sip');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Mango Crusher', 'crushers', 50, 'Refreshing mango crushed ice drink made with rich real pulp.', '/blue-crusher.png', 50, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Mango Crusher');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Litchi Crusher', 'crushers', 50, 'Refreshing litchi crushed ice drink with aromatic sweetness.', '/blue-crusher.png', 50, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Litchi Crusher');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Pineapple Crusher', 'crushers', 50, 'Tangy and tropical refreshing pineapple crushed ice drink.', '/blue-crusher.png', 40, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Pineapple Crusher');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Orange Crusher', 'crushers', 50, 'Citrus burst refreshing orange crushed ice drink.', '/blue-crusher.png', 40, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Orange Crusher');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Strawberry Crusher', 'crushers', 50, 'Sweet and tangy crushed ice beverage infused with strawberry nectar.', '/blue-crusher.png', 50, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Strawberry Crusher');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Kiwi Crusher', 'crushers', 60, 'Zesty green kiwi crushed ice drink with pure fruit essence.', '/blue-crusher.png', 40, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Kiwi Crusher');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Cindrella Double Shade', 'crushers', 60, 'Double shaded magical fruit crusher with layered exotic flavors.', '/blue-crusher.png', 35, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Cindrella Double Shade');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Strawlitchi Double Shade', 'crushers', 60, 'Layered strawberry and fragrant litchi shaded refresher.', '/blue-crusher.png', 35, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Strawlitchi Double Shade');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Vanilla Frappe Shake', 'shakes', 99, 'Classic velvety vanilla blended thick with a cool frappe twist.', '/thick-shake.png', 40, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Vanilla Frappe Shake');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Chocolate Fudge Shake', 'shakes', 99, 'Thick chocolate blended deep with rich dark chocolate fudge.', '/thick-shake.png', 50, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Chocolate Fudge Shake');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Rosemilk Shake', 'shakes', 50, 'Old-school fragrant rose milk crafted with a velvety thick twist.', '/thick-shake.png', 45, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Rosemilk Shake');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Vanilla Boba Shake', 'shakes', 119, 'Creamy Madagascar vanilla blended thick, paired with brown sugar boba.', '/thick-shake.png', 30, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Vanilla Boba Shake');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Chocolate Boba Shake', 'shakes', 119, 'Rich Belgian chocolate blended thick with chewy brown sugar boba pearls.', '/thick-shake.png', 35, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Chocolate Boba Shake');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Classic Brownie', 'treats', 70, 'Soft, rich, and fudgy dark cocoa brownie — the OG that never fails.', '/dream-cake.png', 35, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Classic Brownie');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Triple Chocolate Brownie', 'treats', 129, 'Dark, milk, and white chocolate — three layers of pure indulgence.', '/dream-cake.png', 30, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Triple Chocolate Brownie');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'London Strawberry', 'treats', 159, 'Fresh whipped cream and juicy strawberries nestled on delicate cake.', '/dream-cake.png', 25, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'London Strawberry');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT '5 Layer Torte Cake Cup', 'treats', 139, 'Five decadent layers of sponge, mousse, and ganache in a luxury dessert cup.', '/dream-cake.png', 30, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = '5 Layer Torte Cake Cup');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Brownie Kebab', 'treats', 139, 'Skewered with warm brownie bites, marshmallow, and dripping Belgian chocolate.', '/dream-cake.png', 25, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Brownie Kebab');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Kinder JoyBurst Cake', 'treats', 180, 'Made for the child in you, crafted with hazelnut cream and chocolate curls.', '/dream-cake.png', 20, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Kinder JoyBurst Cake');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Thirst Dream Cake', 'treats', 199, 'Our iconic 5-layer chocolate tin cake with molten center and cocoa dusting.', '/dream-cake.png', 30, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Thirst Dream Cake');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Belgium Dark Waffle', 'waffles', 99, 'Rich dark chocolate glaze smothered over golden crisp Belgian waffle.', '/biscoff-waffle.png', 40, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Belgium Dark Waffle');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Nutella Delight Waffle', 'waffles', 119, 'Warm freshly baked waffle generously layered with creamy hazelnut Nutella.', '/biscoff-waffle.png', 45, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Nutella Delight Waffle');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Cotton Candy Waffle', 'waffles', 109, 'Fluffy pink sugar spun over crispy sweet waffle with strawberry drizzle.', '/biscoff-waffle.png', 25, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Cotton Candy Waffle');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Choco Rocher Waffle', 'waffles', 119, 'Hazelnut chocolate cream, crushed roasted nuts, and crunchy wafer pieces.', '/biscoff-waffle.png', 30, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Choco Rocher Waffle');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Lotus Biscoff Waffle', 'waffles', 150, 'Crispy waffle slathered with melted Lotus Biscoff spread and biscuit crumb.', '/biscoff-waffle.png', 35, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Lotus Biscoff Waffle');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Death by Chocolate Pancake', 'waffles', 139, 'Stack of fluffy chocolate pancakes smothered in double fudge ganache.', '/biscoff-waffle.png', 25, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Death by Chocolate Pancake');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Cookies & Cream Pancake', 'waffles', 119, 'Golden pancakes layered with vanilla cream and crushed Oreo cookies.', '/biscoff-waffle.png', 30, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Cookies & Cream Pancake');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Cold Milo + Double Chocolate Waffle', 'combos', 199, 'The ultimate pairing: iced malt Milo beverage with a decadent double choc waffle.', '/hot-chocolate.png', 40, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Cold Milo + Double Chocolate Waffle');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Students Special Combo', 'combos', 99, 'Pocket-friendly combo: Mini waffle paired with a refreshing beverage.', '/hot-chocolate.png', 50, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Students Special Combo');

INSERT INTO public.products (name, category, price, description, image, stock, low_stock_threshold, is_available)
SELECT 'Mini Waffle (Student Offer)', 'combos', 35, 'Freshly baked single mini waffle dipped in milk chocolate.', '/biscoff-waffle.png', 60, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Mini Waffle (Student Offer)');

-- Ensure public can read all available products
GRANT SELECT ON public.products TO anon, authenticated;

-- ------------------------------------------------------------
-- 4. NOTIFY POSTGREST TO REFRESH SCHEMA CACHE IMMEDIATELY
-- ------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
