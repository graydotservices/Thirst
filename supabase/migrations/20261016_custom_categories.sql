-- ============================================================
-- ALLOW CUSTOM PRODUCT CATEGORIES MIGRATION
-- ============================================================
-- Drop existing hardcoded check constraint on products.category
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

-- Add flexible category check ensuring non-empty text up to 100 characters
ALTER TABLE public.products ADD CONSTRAINT products_category_check 
  CHECK (length(btrim(category)) BETWEEN 1 AND 100);
