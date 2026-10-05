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

-- Bucket storage policies for product-images
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public view product images" ON storage.objects;
  CREATE POLICY "Public view product images" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'product-images');

  DROP POLICY IF EXISTS "Authenticated users upload product images" ON storage.objects;
  CREATE POLICY "Authenticated users upload product images" 
    ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'product-images');

  DROP POLICY IF EXISTS "Authenticated users update product images" ON storage.objects;
  CREATE POLICY "Authenticated users update product images" 
    ON storage.objects FOR UPDATE 
    TO authenticated 
    USING (bucket_id = 'product-images');

  DROP POLICY IF EXISTS "Authenticated users delete product images" ON storage.objects;
  CREATE POLICY "Authenticated users delete product images" 
    ON storage.objects FOR DELETE 
    TO authenticated 
    USING (bucket_id = 'product-images');
END $$;

-- 5. Atomic Order Placement & Inventory Deduction Stored Procedure (RPC)
CREATE OR REPLACE FUNCTION place_order_atomic(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_id UUID,
  p_items JSONB,
  p_subtotal NUMERIC,
  p_discount NUMERIC,
  p_gst NUMERIC,
  p_total NUMERIC,
  p_payment_method TEXT,
  p_payment_ref TEXT,
  p_bill_no TEXT,
  p_staff_id UUID,
  p_billed_by TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item JSONB;
  v_prod_id UUID;
  v_qty INTEGER;
  v_order_id UUID;
BEGIN
  -- Insert the order record cleanly
  INSERT INTO orders (
    customer_name, customer_phone, customer_id, items,
    subtotal, discount, gst, total,
    payment_method, payment_ref, bill_no,
    staff_id, billed_by, status
  ) VALUES (
    COALESCE(p_customer_name, 'Walk-in'),
    COALESCE(p_customer_phone, '0000000000'),
    p_customer_id,
    p_items,
    p_subtotal,
    COALESCE(p_discount, 0),
    COALESCE(p_gst, 0),
    p_total,
    p_payment_method,
    p_payment_ref,
    p_bill_no,
    p_staff_id,
    p_billed_by,
    'completed'
  ) RETURNING id INTO v_order_id;

  -- Deduct inventory stock atomically for each product item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      IF v_item->>'product_id' IS NOT NULL AND v_item->>'product_id' != 'meta_staff' THEN
        v_prod_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'qty')::INTEGER;
        IF v_prod_id IS NOT NULL AND v_qty > 0 THEN
          UPDATE products 
          SET stock = GREATEST(0, stock - v_qty) 
          WHERE id = v_prod_id;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Safely ignore non-UUID product IDs without failing the order
      NULL;
    END;
  END LOOP;

  -- Update customer loyalty & total spend atomically
  IF p_customer_id IS NOT NULL THEN
    UPDATE customers
    SET loyalty_points = loyalty_points + FLOOR(p_total / 100),
        total_purchase = total_purchase + p_total,
        last_visit = NOW()
    WHERE id = p_customer_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'order_id', v_order_id, 
    'bill_no', p_bill_no
  );
END;
$$;
