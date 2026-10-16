BEGIN;
-- ============================================================
-- THIRST. DATABASE SCHEMA
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (length(btrim(category)) BETWEEN 1 AND 100),
  price NUMERIC(10,2) NOT NULL,
  image TEXT,
  description TEXT,
  stock INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  barcode TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CUSTOMERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  birthday DATE,
  loyalty_points INTEGER DEFAULT 0,
  total_purchase NUMERIC(12,2) DEFAULT 0,
  last_visit TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STAFF TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  gst NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'card', 'split', 'online')),
  payment_ref TEXT,
  bill_no TEXT NOT NULL UNIQUE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  billed_by TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FRANCHISE APPLICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS franchise_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  budget TEXT NOT NULL,
  experience TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GALLERY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- OFFERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  discount_percent INTEGER,
  code TEXT,
  valid_until TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'offer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STORE LOCATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS store_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT,
  hours TEXT,
  lat NUMERIC,
  lng NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INITIAL STORE LOCATION (REAL THIRUVALLUR FLAGSHIP)
-- ============================================================
INSERT INTO store_locations (name, address, city, phone, hours, is_active) VALUES
  ('Thirst. Thiruvallur — Flagship', 'NO.01, Siva Vishnu kovil street, kakkalur', 'Thiruvallur', '+91 87548 81546', '2:00 PM – 12:00 AM', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- COMPANY SETTINGS TABLE & INITIAL VALUES
-- ============================================================
CREATE TABLE IF NOT EXISTS company_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  name TEXT NOT NULL DEFAULT 'Thirst.',
  tagline TEXT DEFAULT 'India''s Premium Luxury Dessert Boutique',
  address_line1 TEXT NOT NULL DEFAULT 'NO.01, Siva Vishnu kovil street',
  address_line2 TEXT DEFAULT 'kakkalur',
  city TEXT NOT NULL DEFAULT 'Thiruvallur',
  state TEXT NOT NULL DEFAULT 'Tamil Nadu',
  pincode TEXT NOT NULL DEFAULT '602001',
  phone TEXT NOT NULL DEFAULT '+91 87548 81546',
  alt_phone TEXT DEFAULT '+91 98765 43210',
  email TEXT NOT NULL DEFAULT 'thirst.freshchennai@gmail.com',
  gstin TEXT DEFAULT '33AABCT0000A1Z5',
  fssai TEXT DEFAULT '22425478001152',
  opening_hours TEXT DEFAULT 'Mon–Sun: 2:00 PM – 12:00 AM',
  google_maps_url TEXT DEFAULT 'https://maps.google.com/?q=NO.01,+Siva+Vishnu+kovil+street,+kakkalur,+Thiruvallur',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO company_settings (
  id, name, tagline, address_line1, address_line2, city, state, pincode, phone, email, gstin, fssai, opening_hours
) VALUES (
  'primary',
  'Thirst.',
  'India''s Premium Luxury Dessert Boutique',
  'NO.01, Siva Vishnu kovil street',
  'kakkalur',
  'Thiruvallur',
  'Tamil Nadu',
  '602001',
  '+91 87548 81546',
  'thirst.freshchennai@gmail.com',
  '33AABCT0000A1Z5',
  '22425478001152',
  'Mon–Sun: 2:00 PM – 12:00 AM'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SIGNATURE SETTINGS TABLE & INITIAL VALUES
-- ============================================================
CREATE TABLE IF NOT EXISTS signature_settings (
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

INSERT INTO signature_settings (
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



-- Apply after the earlier migrations, before deploying the updated application.
-- No session/inactivity timeout is introduced. Access follows current staff status.

REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
UPDATE public.staff s SET auth_user_id = u.id FROM auth.users u
WHERE s.auth_user_id IS NULL AND lower(s.email) = lower(u.email) AND u.email_confirmed_at IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS staff_auth_user_id_unique ON public.staff(auth_user_id);

CREATE OR REPLACE FUNCTION public.current_staff_role() RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT s.role FROM public.staff s JOIN auth.users u ON u.id = s.auth_user_id
  WHERE s.auth_user_id = auth.uid() AND s.status = 'active'
    AND u.email_confirmed_at IS NOT NULL AND (u.banned_until IS NULL OR u.banned_until < now())
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.current_staff_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_staff_role() TO authenticated;

-- Replace all existing policies on application tables. Permissive policies OR together,
-- so leaving an older "USING (true)" policy would defeat the restrictive policy.
DO $$ DECLARE p RECORD; BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN
      ('products','customers','orders','staff','franchise_applications','gallery','offers','notifications','store_locations','company_settings','signature_settings')
  LOOP EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename); END LOOP;
END $$;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.products, public.customers, public.orders, public.staff,
  public.franchise_applications, public.gallery, public.offers, public.notifications,
  public.store_locations, public.company_settings, public.signature_settings FROM anon, authenticated;
GRANT SELECT ON public.products, public.gallery, public.offers, public.notifications,
  public.store_locations, public.company_settings, public.signature_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products, public.gallery, public.offers,
  public.notifications, public.store_locations, public.signature_settings TO authenticated;
GRANT SELECT ON public.staff, public.customers, public.orders, public.franchise_applications TO authenticated;
GRANT INSERT (name, phone, email, birthday), UPDATE (name, phone, email, birthday) ON public.customers TO authenticated;
GRANT UPDATE (status, budget) ON public.franchise_applications TO authenticated;
GRANT INSERT, UPDATE ON public.company_settings, public.signature_settings TO authenticated;
GRANT ALL ON public.products, public.customers, public.orders, public.staff,
  public.franchise_applications, public.gallery, public.offers, public.notifications,
  public.store_locations, public.company_settings, public.signature_settings TO service_role;

CREATE POLICY public_products ON public.products FOR SELECT TO anon, authenticated USING (is_available = true);
CREATE POLICY public_gallery ON public.gallery FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY public_offers ON public.offers FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY public_notifications ON public.notifications FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY public_locations ON public.store_locations FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY public_company_settings ON public.company_settings FOR SELECT TO anon, authenticated USING (id = 'primary');
CREATE POLICY public_signature_settings ON public.signature_settings FOR SELECT TO anon, authenticated USING (id = 'primary');

DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['products','gallery','offers','notifications','store_locations','signature_settings'] LOOP
    EXECUTE format('CREATE POLICY management_access ON public.%I FOR ALL TO authenticated USING ((SELECT public.current_staff_role()) IN (''admin'',''manager'')) WITH CHECK ((SELECT public.current_staff_role()) IN (''admin'',''manager''))', t);
  END LOOP;
END $$;
CREATE POLICY customer_management ON public.customers FOR ALL TO authenticated
  USING ((SELECT public.current_staff_role()) IN ('admin','manager')) WITH CHECK ((SELECT public.current_staff_role()) IN ('admin','manager'));
CREATE POLICY order_management_read ON public.orders FOR SELECT TO authenticated USING ((SELECT public.current_staff_role()) IN ('admin','manager'));
CREATE POLICY staff_self_read ON public.staff FOR SELECT TO authenticated USING (auth_user_id = (SELECT auth.uid()));
CREATE POLICY staff_admin_read ON public.staff FOR SELECT TO authenticated USING ((SELECT public.current_staff_role()) = 'admin');
CREATE POLICY franchise_management ON public.franchise_applications FOR ALL TO authenticated
  USING ((SELECT public.current_staff_role()) IN ('admin','manager')) WITH CHECK ((SELECT public.current_staff_role()) IN ('admin','manager'));
CREATE POLICY company_admin_write ON public.company_settings FOR ALL TO authenticated
  USING ((SELECT public.current_staff_role()) = 'admin' AND id = 'primary')
  WITH CHECK ((SELECT public.current_staff_role()) = 'admin' AND id = 'primary');

-- NOT VALID avoids breaking existing records; all new/changed rows must satisfy these.
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_safe_values;
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_safe_values;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_safe_values;
ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_safe_values;
ALTER TABLE public.gallery DROP CONSTRAINT IF EXISTS gallery_safe_values;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_safe_values;
ALTER TABLE public.store_locations DROP CONSTRAINT IF EXISTS locations_safe_values;
ALTER TABLE public.company_settings DROP CONSTRAINT IF EXISTS company_safe_values;
ALTER TABLE public.products ADD CONSTRAINT products_safe_values CHECK (
  price >= 0 AND price <= 1000000 AND stock >= 0 AND low_stock_threshold >= 0
  AND length(btrim(name)) BETWEEN 1 AND 200 AND length(coalesce(description,'')) <= 2000
) NOT VALID;
ALTER TABLE public.customers ADD CONSTRAINT customers_safe_values CHECK (
  loyalty_points >= 0 AND total_purchase >= 0 AND length(btrim(name)) BETWEEN 1 AND 200
  AND phone ~ '^[6-9][0-9]{9}$' AND length(coalesce(email,'')) <= 254
) NOT VALID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS request_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS orders_request_id_unique ON public.orders(request_id);
ALTER TABLE public.orders ADD CONSTRAINT orders_safe_values CHECK (
  subtotal >= 0 AND discount >= 0 AND discount <= subtotal AND gst >= 0 AND total >= 0
  AND total = subtotal - discount + gst AND jsonb_typeof(items) = 'array'
) NOT VALID;
ALTER TABLE public.offers ADD CONSTRAINT offers_safe_values CHECK (
  length(btrim(title)) BETWEEN 1 AND 200 AND coalesce(discount_percent,0) BETWEEN 0 AND 100
  AND length(coalesce(description,'')) <= 2000 AND length(coalesce(code,'')) <= 50
) NOT VALID;
ALTER TABLE public.gallery ADD CONSTRAINT gallery_safe_values CHECK (
  length(image_url) BETWEEN 1 AND 2048 AND image_url !~* '^(blob:|data:|javascript:)'
  AND length(coalesce(caption,'')) <= 500
) NOT VALID;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_safe_values CHECK (
  length(btrim(title)) BETWEEN 1 AND 200 AND length(btrim(message)) BETWEEN 1 AND 2000
) NOT VALID;
ALTER TABLE public.store_locations ADD CONSTRAINT locations_safe_values CHECK (
  length(btrim(name)) BETWEEN 1 AND 200 AND length(btrim(address)) BETWEEN 1 AND 1000
  AND length(city) <= 200 AND length(coalesce(phone,'')) <= 30 AND length(coalesce(hours,'')) <= 200
) NOT VALID;
ALTER TABLE public.company_settings ADD CONSTRAINT company_safe_values CHECK (
  id = 'primary' AND length(btrim(name)) BETWEEN 1 AND 200 AND length(tagline) <= 500
  AND length(address_line1) BETWEEN 1 AND 500 AND length(coalesce(address_line2,'')) <= 500
  AND length(city) BETWEEN 1 AND 200 AND length(state) BETWEEN 1 AND 200
  AND pincode ~ '^[0-9]{6}$' AND length(phone) BETWEEN 10 AND 30
  AND length(email) BETWEEN 3 AND 254 AND length(coalesce(gstin,'')) <= 30
  AND length(coalesce(fssai,'')) <= 30 AND length(coalesce(opening_hours,'')) <= 200
  AND (google_maps_url IS NULL OR google_maps_url = '' OR google_maps_url ~ '^https://(www\.)?(google\.com/maps|maps\.google\.com|maps\.app\.goo\.gl)(/|\?|$)')
) NOT VALID;

-- Persistent rate buckets work across application instances. They do not expire sessions.
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  key TEXT PRIMARY KEY, window_started TIMESTAMPTZ NOT NULL, hits INTEGER NOT NULL CHECK (hits > 0)
);
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.api_rate_limits FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.take_rate_limit(p_key TEXT, p_limit INTEGER, p_seconds INTEGER) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE n INTEGER; BEGIN
  INSERT INTO public.api_rate_limits AS r (key, window_started, hits) VALUES (p_key, now(), 1)
  ON CONFLICT (key) DO UPDATE SET
    hits = CASE WHEN r.window_started <= now() - make_interval(secs => p_seconds) THEN 1 ELSE r.hits + 1 END,
    window_started = CASE WHEN r.window_started <= now() - make_interval(secs => p_seconds) THEN now() ELSE r.window_started END
  RETURNING hits INTO n;
  DELETE FROM public.api_rate_limits WHERE window_started < now() - interval '2 days';
  RETURN n <= p_limit;
END; $$;
REVOKE ALL ON FUNCTION public.take_rate_limit(TEXT,INTEGER,INTEGER) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_api_rate_limit(p_action TEXT) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF public.current_staff_role() IS NULL THEN RAISE EXCEPTION 'Staff access required' USING ERRCODE = '42501'; END IF;
  IF p_action NOT IN ('read','write') THEN RAISE EXCEPTION 'Invalid action'; END IF;
  RETURN public.take_rate_limit('staff:' || auth.uid()::TEXT || ':' || p_action, CASE WHEN p_action = 'read' THEN 300 ELSE 60 END, 60);
END; $$;
REVOKE ALL ON FUNCTION public.consume_api_rate_limit(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.billing_customers() RETURNS TABLE (
  id UUID, name TEXT, phone TEXT, loyalty_points INTEGER, total_purchase NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF public.current_staff_role() IS NULL THEN RAISE EXCEPTION 'Staff access required' USING ERRCODE = '42501'; END IF;
  IF NOT public.take_rate_limit('billing-read:' || auth.uid()::TEXT,300,60) THEN RAISE EXCEPTION 'Too many requests' USING ERRCODE = 'P0001'; END IF;
  RETURN QUERY SELECT c.id,c.name,c.phone,c.loyalty_points,c.total_purchase FROM public.customers c
    ORDER BY c.last_visit DESC NULLS LAST LIMIT 100;
END; $$;
REVOKE ALL ON FUNCTION public.billing_customers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.billing_customers() TO authenticated;

-- Remove the old function signature so it cannot bypass validated checkout.
DROP FUNCTION IF EXISTS public.place_order_atomic(TEXT,TEXT,UUID,JSONB,NUMERIC,NUMERIC,NUMERIC,NUMERIC,TEXT,TEXT,TEXT,UUID,TEXT);
CREATE SEQUENCE IF NOT EXISTS public.bill_number_sequence;
REVOKE ALL ON SEQUENCE public.bill_number_sequence FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.place_order_atomic(
  p_items JSONB, p_customer_name TEXT, p_customer_phone TEXT,
  p_discount_percent NUMERIC, p_payment_method TEXT, p_request_id UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_staff public.staff%ROWTYPE; v_existing public.orders%ROWTYPE; v_order public.orders%ROWTYPE;
  v_product public.products%ROWTYPE; v_item JSONB; v_items JSONB := '[]'::JSONB;
  v_product_id UUID; v_qty INTEGER; v_customer UUID; v_subtotal NUMERIC := 0;
  v_discount NUMERIC; v_total NUMERIC; v_bill TEXT; v_phone TEXT; v_name TEXT;
BEGIN
  IF public.current_staff_role() IS NULL THEN RAISE EXCEPTION 'Staff access required' USING ERRCODE = '42501'; END IF;
  SELECT * INTO STRICT v_staff FROM public.staff WHERE auth_user_id = auth.uid() AND status = 'active';
  IF p_request_id IS NULL THEN RAISE EXCEPTION 'Request ID required' USING ERRCODE = '22023'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::TEXT, 0));
  SELECT * INTO v_existing FROM public.orders WHERE request_id = p_request_id;
  IF FOUND THEN
    IF v_existing.staff_id IS DISTINCT FROM v_staff.id THEN RAISE EXCEPTION 'Request belongs to another staff member' USING ERRCODE = '42501'; END IF;
    RETURN to_jsonb(v_existing);
  END IF;
  IF NOT public.take_rate_limit('checkout:' || auth.uid()::TEXT,60,60) THEN RAISE EXCEPTION 'Too many requests' USING ERRCODE = 'P0001'; END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 100
    OR p_discount_percent IS NULL OR p_discount_percent NOT BETWEEN 0 AND 100
    OR p_payment_method IS NULL OR p_payment_method NOT IN ('cash','upi','card')
    OR p_customer_name IS NULL OR length(btrim(p_customer_name)) > 200 THEN
    RAISE EXCEPTION 'Invalid order' USING ERRCODE = '22023';
  END IF;
  v_phone := coalesce(p_customer_phone,'');
  IF v_phone <> '' AND v_phone !~ '^[6-9][0-9]{9}$' THEN RAISE EXCEPTION 'Invalid phone' USING ERRCODE = '22023'; END IF;
  v_name := coalesce(nullif(btrim(p_customer_name),''),'Walk-in Customer');
  IF (SELECT count(DISTINCT x->>'product_id') FROM jsonb_array_elements(p_items) x) <> jsonb_array_length(p_items) THEN
    RAISE EXCEPTION 'Duplicate products are not allowed' USING ERRCODE = '22023';
  END IF;
  -- Fixed ordering avoids deadlocks between carts containing the same products.
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) ORDER BY value->>'product_id' LOOP
    IF jsonb_typeof(v_item) IS DISTINCT FROM 'object' OR (v_item->>'qty') IS NULL OR (v_item->>'qty') !~ '^[1-9][0-9]{0,3}$' THEN
      RAISE EXCEPTION 'Invalid order item' USING ERRCODE = '22023';
    END IF;
    v_product_id := (v_item->>'product_id')::UUID; v_qty := (v_item->>'qty')::INTEGER;
    SELECT * INTO v_product FROM public.products WHERE id = v_product_id FOR UPDATE;
    IF NOT FOUND OR NOT coalesce(v_product.is_available,false) OR coalesce(v_product.stock,0) < v_qty THEN
      RAISE EXCEPTION 'A product is unavailable or has insufficient stock' USING ERRCODE = 'P0001';
    END IF;
    IF v_item ? 'price' AND (v_item->>'price')::NUMERIC IS DISTINCT FROM v_product.price THEN
      RAISE EXCEPTION 'Product price changed. Refresh the menu before billing.' USING ERRCODE = 'P0001';
    END IF;
    v_subtotal := v_subtotal + v_product.price * v_qty;
    v_items := v_items || jsonb_build_array(jsonb_build_object('product_id',v_product.id,'name',v_product.name,'price',v_product.price,'qty',v_qty,'total',v_product.price * v_qty));
    UPDATE public.products SET stock = stock - v_qty WHERE id = v_product.id;
  END LOOP;
  IF v_subtotal > 99999999.99 THEN RAISE EXCEPTION 'Order amount is too large' USING ERRCODE = '22023'; END IF;
  v_discount := round(v_subtotal * p_discount_percent / 100); v_total := v_subtotal - v_discount;
  IF v_phone <> '' THEN
    INSERT INTO public.customers (name,phone,last_visit) VALUES (v_name,v_phone,now())
    ON CONFLICT (phone) DO UPDATE SET name = CASE WHEN nullif(btrim(p_customer_name),'') IS NULL THEN customers.name ELSE EXCLUDED.name END, last_visit = now()
    RETURNING id INTO v_customer;
    UPDATE public.customers SET loyalty_points = coalesce(loyalty_points,0) + floor(v_total / 100),
      total_purchase = coalesce(total_purchase,0) + v_total WHERE id = v_customer;
  END IF;
  v_bill := 'TH-' || to_char(now() AT TIME ZONE 'Asia/Kolkata','YYYYMMDD') || '-' || lpad(nextval('public.bill_number_sequence')::TEXT, 8, '0');
  INSERT INTO public.orders (customer_id,customer_name,customer_phone,items,subtotal,discount,gst,total,payment_method,bill_no,staff_id,billed_by,status,request_id)
  VALUES (v_customer,v_name,coalesce(nullif(v_phone,''),'0000000000'),v_items,v_subtotal,v_discount,0,v_total,p_payment_method,v_bill,v_staff.id,v_staff.name || ' (' || v_staff.role || ')','completed',p_request_id)
  RETURNING * INTO v_order;
  RETURN to_jsonb(v_order);
END; $$;
REVOKE ALL ON FUNCTION public.place_order_atomic(JSONB,TEXT,TEXT,NUMERIC,TEXT,UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order_atomic(JSONB,TEXT,TEXT,NUMERIC,TEXT,UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_order_atomic(p_order_id UUID) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_order public.orders%ROWTYPE; v_item JSONB; BEGIN
  IF public.current_staff_role() IS NULL OR public.current_staff_role() NOT IN ('admin','manager') THEN
    RAISE EXCEPTION 'Management access required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002'; END IF;
  IF v_order.status = 'cancelled' THEN RETURN to_jsonb(v_order); END IF;
  IF v_order.status = 'completed' THEN
    FOR v_item IN SELECT value FROM jsonb_array_elements(v_order.items) ORDER BY value->>'product_id' LOOP
      IF (v_item->>'product_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND (v_item->>'qty') ~ '^[1-9][0-9]{0,3}$' THEN
        UPDATE public.products SET stock = stock + (v_item->>'qty')::INTEGER WHERE id = (v_item->>'product_id')::UUID;
      END IF;
    END LOOP;
    UPDATE public.customers SET loyalty_points = greatest(0,coalesce(loyalty_points,0) - floor(v_order.total / 100)),
      total_purchase = greatest(0,coalesce(total_purchase,0) - v_order.total) WHERE id = v_order.customer_id;
  END IF;
  UPDATE public.orders SET status = 'cancelled' WHERE id = p_order_id RETURNING * INTO v_order;
  RETURN to_jsonb(v_order);
END; $$;
REVOKE ALL ON FUNCTION public.cancel_order_atomic(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order_atomic(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_franchise_application(p_payload JSONB, p_rate_key TEXT) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_rate_key IS NULL OR length(p_rate_key) <> 64 THEN RAISE EXCEPTION 'Invalid rate key'; END IF;
  IF NOT public.take_rate_limit('franchise:' || p_rate_key,5,3600) THEN RETURN false; END IF;
  INSERT INTO public.franchise_applications (name,phone,email,city,budget,experience,message,status)
  VALUES (p_payload->>'name',p_payload->>'phone',p_payload->>'email',p_payload->>'city',p_payload->>'budget',p_payload->>'experience',p_payload->>'message','pending');
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.submit_franchise_application(JSONB,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_franchise_application(JSONB,TEXT) TO service_role;

-- Only server-side staff administration can mutate staff. Protect the last admin
-- even if two administrators act concurrently.
CREATE OR REPLACE FUNCTION public.protect_last_admin() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(83120261013::BIGINT);
  IF OLD.role = 'admin' AND OLD.status = 'active' AND (TG_OP = 'DELETE' OR NEW.role <> 'admin' OR NEW.status <> 'active') THEN
    IF NOT EXISTS (SELECT 1 FROM public.staff WHERE role = 'admin' AND status = 'active' AND auth_user_id IS NOT NULL AND id <> OLD.id) THEN
      RAISE EXCEPTION 'The last active administrator cannot be removed' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.protect_last_admin() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS staff_last_admin_guard ON public.staff;
CREATE TRIGGER staff_last_admin_guard BEFORE UPDATE OR DELETE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.protect_last_admin();

CREATE OR REPLACE FUNCTION public.manage_staff_secure(p_actor UUID,p_operation TEXT,p_target UUID,p_details JSONB) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_actor public.staff%ROWTYPE; v_target public.staff%ROWTYPE; BEGIN
  PERFORM pg_advisory_xact_lock(83120261013::BIGINT);
  SELECT s.* INTO v_actor FROM public.staff s JOIN auth.users u ON u.id=s.auth_user_id
    WHERE s.auth_user_id=p_actor AND s.role='admin' AND s.status='active'
      AND u.email_confirmed_at IS NOT NULL AND (u.banned_until IS NULL OR u.banned_until<now());
  IF NOT FOUND THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501'; END IF;
  IF p_operation='create' THEN
    INSERT INTO public.staff(id,auth_user_id,name,phone,email,role,status)
    VALUES(p_target,p_target,p_details->>'name',p_details->>'phone',p_details->>'email',p_details->>'role',p_details->>'status')
    RETURNING * INTO v_target;
  ELSE
    SELECT * INTO v_target FROM public.staff WHERE id=p_target FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Staff member not found' USING ERRCODE='P0002'; END IF;
    IF v_target.id=v_actor.id AND (p_operation='delete' OR p_details->>'role'<>'admin' OR p_details->>'status'<>'active') THEN
      RAISE EXCEPTION 'Cannot remove your own administrator access' USING ERRCODE='23514';
    END IF;
    IF p_operation='update' THEN
      UPDATE public.staff SET name=p_details->>'name',phone=p_details->>'phone',role=p_details->>'role',status=p_details->>'status'
      WHERE id=p_target RETURNING * INTO v_target;
    ELSIF p_operation='delete' THEN DELETE FROM public.staff WHERE id=p_target;
    ELSE RAISE EXCEPTION 'Invalid staff action' USING ERRCODE='22023'; END IF;
  END IF;
  RETURN to_jsonb(v_target);
END; $$;
REVOKE ALL ON FUNCTION public.manage_staff_secure(UUID,TEXT,UUID,JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.manage_staff_secure(UUID,TEXT,UUID,JSONB) TO service_role;

INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('product-images','product-images',true,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS "Public view product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Management upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Management update product images" ON storage.objects;
DROP POLICY IF EXISTS "Management delete product images" ON storage.objects;
DROP POLICY IF EXISTS product_images_anon_insert_guard ON storage.objects;
DROP POLICY IF EXISTS product_images_anon_update_guard ON storage.objects;
DROP POLICY IF EXISTS product_images_anon_delete_guard ON storage.objects;
DROP POLICY IF EXISTS product_images_insert_guard ON storage.objects;
DROP POLICY IF EXISTS product_images_update_guard ON storage.objects;
DROP POLICY IF EXISTS product_images_delete_guard ON storage.objects;
-- Restrictive guards prevent an unrelated legacy permissive storage policy from
-- reopening this bucket. They leave other buckets' policy decisions unchanged.
CREATE POLICY product_images_anon_insert_guard ON storage.objects AS RESTRICTIVE FOR INSERT TO anon
  WITH CHECK (bucket_id <> 'product-images');
CREATE POLICY product_images_anon_update_guard ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon
  USING (bucket_id <> 'product-images') WITH CHECK (bucket_id <> 'product-images');
CREATE POLICY product_images_anon_delete_guard ON storage.objects AS RESTRICTIVE FOR DELETE TO anon
  USING (bucket_id <> 'product-images');
CREATE POLICY product_images_insert_guard ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (bucket_id <> 'product-images' OR ((SELECT public.current_staff_role()) IN ('admin','manager') AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp')));
CREATE POLICY product_images_update_guard ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (bucket_id <> 'product-images' OR (SELECT public.current_staff_role()) IN ('admin','manager'))
  WITH CHECK (bucket_id <> 'product-images' OR ((SELECT public.current_staff_role()) IN ('admin','manager') AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp')));
CREATE POLICY product_images_delete_guard ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
  USING (bucket_id <> 'product-images' OR (SELECT public.current_staff_role()) IN ('admin','manager'));
CREATE POLICY "Public view product images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Management upload product images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND (SELECT public.current_staff_role()) IN ('admin','manager') AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp'));
CREATE POLICY "Management update product images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND (SELECT public.current_staff_role()) IN ('admin','manager'))
  WITH CHECK (bucket_id = 'product-images' AND (SELECT public.current_staff_role()) IN ('admin','manager') AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp'));
CREATE POLICY "Management delete product images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND (SELECT public.current_staff_role()) IN ('admin','manager'));

COMMIT;
