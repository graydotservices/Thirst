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

-- Insert default row if not exists
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

-- RLS policies
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read company settings" ON company_settings;
CREATE POLICY "Public read company settings" ON company_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update company settings" ON company_settings;
CREATE POLICY "Admins can update company settings" ON company_settings FOR ALL USING (true);
