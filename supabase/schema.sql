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
  category TEXT NOT NULL CHECK (category IN ('cakes', 'ice-cream', 'special-desserts')),
  price NUMERIC(10,2) NOT NULL,
  image TEXT,
  description TEXT,
  stock INTEGER DEFAULT 0,
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
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'card', 'split')),
  bill_no TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
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
-- SEED DATA — PRODUCTS
-- ============================================================
INSERT INTO products (name, category, price, description, stock, is_available) VALUES
  ('Rose Velvet Cake', 'cakes', 850, 'Delicate rose-infused red velvet with berry cream frosting and edible gold.', 12, true),
  ('Midnight Cheesecake', 'cakes', 1200, 'New York style cheesecake with wild berry compote and lotus biscuit base.', 8, true),
  ('Golden Tiramisu Cake', 'cakes', 950, 'Classic Italian tiramisu elevated with gold dusted cream and espresso sponge.', 6, true),
  ('Berry Blast Scoop', 'ice-cream', 320, 'Three scoops of hand-churned berry ice cream with rose petals and gold dust.', 48, true),
  ('Plum Royale Cone', 'ice-cream', 280, 'Deep plum sorbet in premium Belgian waffle cone with white chocolate drizzle.', 36, true),
  ('Saffron Kulfi Cup', 'ice-cream', 220, 'Traditional saffron kulfi with pistachio crumble and rose water syrup.', 52, true),
  ('Gold Parfait Glass', 'special-desserts', 480, 'Layered berry mousse, gold crumble, fresh berries and edible gold leaf.', 18, true),
  ('Plum Mousse Cup', 'special-desserts', 380, 'Velvety plum mousse with hazelnut praline and a mirror glaze finish.', 14, true),
  ('Waffles Royale', 'special-desserts', 540, 'Belgian waffles with berry compote, whipped cream, macaron and gold drizzle.', 20, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA — STORE LOCATIONS
-- ============================================================
INSERT INTO store_locations (name, address, city, phone, hours, is_active) VALUES
  ('Thirst. Bandra — Flagship', '12 Sweet Lane, Bandra West', 'Mumbai', '+91 98765 43210', '2:00 PM – 12:00 AM', true),
  ('Thirst. Andheri', '45 Versova Road, Andheri West', 'Mumbai', '+91 98765 43211', '2:00 PM – 12:00 AM', true),
  ('Thirst. Connaught Place', 'Block A, Connaught Place', 'New Delhi', '+91 98765 43212', '2:00 PM – 12:00 AM', true),
  ('Thirst. Koramangala', '7th Block, Koramangala', 'Bangalore', '+91 98765 43213', '9:00 AM – 11:00 PM', true),
  ('Thirst. Jubilee Hills', 'Road No. 10, Jubilee Hills', 'Hyderabad', '+91 98765 43214', '2:00 PM – 12:00 AM', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Enable RLS on sensitive tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_applications ENABLE ROW LEVEL SECURITY;

-- Public read access for products, gallery, offers, locations, notifications
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products" ON products FOR SELECT TO anon USING (is_available = true);

ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read gallery" ON gallery FOR SELECT TO anon USING (is_active = true);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read offers" ON offers FOR SELECT TO anon USING (is_active = true);

ALTER TABLE store_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read locations" ON store_locations FOR SELECT TO anon USING (is_active = true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read notifications" ON notifications FOR SELECT TO anon USING (is_active = true);

-- Franchise applications: allow anon insert (for public form)
CREATE POLICY "Public franchise insert" ON franchise_applications FOR INSERT TO anon WITH CHECK (true);

-- Admin full access (authenticated users)
CREATE POLICY "Admin full access orders" ON orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access customers" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access staff" ON staff FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access franchise" ON franchise_applications FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access products" ON products FOR ALL TO authenticated USING (true);
