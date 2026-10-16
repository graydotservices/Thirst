-- ============================================================
-- THIRST. — SIGNATURE SETTINGS TABLE & PERMISSIONS
-- Run this in your Supabase SQL editor:
-- https://supabase.com/dashboard/project/ecmwqikinlmmrsgjdbbd/sql
-- ============================================================

-- 1. Create signature_settings table
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

-- 2. Insert default row if not exists
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

-- 3. Row Level Security policies
ALTER TABLE public.signature_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read signature settings" ON public.signature_settings;
DROP POLICY IF EXISTS "public_signature_settings" ON public.signature_settings;
CREATE POLICY "Public read signature settings" ON public.signature_settings 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated update signature settings" ON public.signature_settings;
DROP POLICY IF EXISTS "management_access_signature" ON public.signature_settings;
CREATE POLICY "Authenticated update signature settings" ON public.signature_settings 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Grant schema permissions
GRANT SELECT ON public.signature_settings TO anon, authenticated;
GRANT ALL ON public.signature_settings TO authenticated, service_role;

-- 5. Notify PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';
