-- ============================================================
-- THIRST. CAFE — DATABASE AUDIT FIXES & MIGRATION SCRIPT
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ecmwqikinlmmrsgjdbbd/sql
-- ============================================================

-- 1. Add low_stock_threshold to products table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'low_stock_threshold'
  ) THEN
    ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER DEFAULT 5;
  END IF;
END $$;

-- 2. Add billed_by, staff_id, and payment_ref to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'billed_by'
  ) THEN
    ALTER TABLE orders ADD COLUMN billed_by TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'staff_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_ref'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_ref TEXT;
  END IF;
END $$;

-- 3. Relax payment_method check constraint to allow standard methods cleanly
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method IN ('cash', 'upi', 'card', 'split', 'online'));

-- 4. Create public product-images storage bucket if missing
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies and order RPC are defined by 20261013_production_security.sql.
