-- ============================================================
-- FIX CATEGORY CONSTRAINT IN SUPABASE
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ecmwqikinlmmrsgjdbbd/sql
-- ============================================================

-- 1. Drop the outdated constraint restricting categories to cakes/ice-cream
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;

-- 2. Add flexible constraint allowing any category (e.g. Hot Beverages, Waffles, Shakes, Crushers)
ALTER TABLE public.products ADD CONSTRAINT products_category_check 
  CHECK (length(btrim(category)) BETWEEN 1 AND 100);

-- 3. Refresh PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
