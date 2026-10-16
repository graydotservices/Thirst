-- ============================================================
-- PRODUCTION LAUNCH CLEANUP — CLEAR ALL DEMO & TEST DATA
-- Run this in your Supabase SQL editor to start clean
-- ============================================================

BEGIN;

-- 1. Wipe all test & demo orders
DELETE FROM public.orders;

-- 2. Wipe all test & demo customer CRM records
DELETE FROM public.customers;

-- 3. Wipe all test franchise inquiries
DELETE FROM public.franchise_applications;

-- 4. Wipe demo offers, notifications, and gallery test items
DELETE FROM public.offers;
DELETE FROM public.notifications;
DELETE FROM public.gallery;

-- 5. Wipe demo seed products (leaves any real products you added)
DELETE FROM public.products WHERE name IN (
  'Rose Velvet Cake',
  'Midnight Cheesecake',
  'Golden Tiramisu Cake',
  'Berry Blast Scoop',
  'Plum Royale Cone',
  'Saffron Kulfi Cup',
  'Gold Parfait Glass',
  'Plum Mousse Cup',
  'Waffles Royale'
);

-- 6. Clean out fake demo store locations (Mumbai, Delhi, Bangalore, Hyderabad)
DELETE FROM public.store_locations 
WHERE city IN ('Mumbai', 'New Delhi', 'Bangalore', 'Hyderabad')
   OR name ILIKE '%Bandra%' 
   OR name ILIKE '%Connaught%' 
   OR name ILIKE '%Koramangala%' 
   OR name ILIKE '%Jubilee%';

-- Ensure real flagship store in Thiruvallur exists
INSERT INTO public.store_locations (name, address, city, phone, hours, is_active)
SELECT 'Thirst. Thiruvallur — Flagship', 'NO.01, Siva Vishnu kovil street, kakkalur', 'Thiruvallur', '+91 87548 81546', '2:00 PM – 12:00 AM', true
WHERE NOT EXISTS (SELECT 1 FROM public.store_locations WHERE city = 'Thiruvallur');

-- 7. Reset temporary API rate limit counters
TRUNCATE TABLE public.api_rate_limits;

COMMIT;
