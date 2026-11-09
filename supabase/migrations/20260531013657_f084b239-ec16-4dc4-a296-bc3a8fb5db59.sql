-- Add badge_type field for unified single-badge system
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS badge_type text DEFAULT 'none';

-- Create stock history log
CREATE TABLE IF NOT EXISTS public.stock_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  variant_id uuid,
  previous_qty integer NOT NULL,
  new_qty integer NOT NULL,
  change_qty integer NOT NULL,
  reason text,
  changed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.stock_history TO authenticated;
GRANT ALL ON public.stock_history TO service_role;

ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stock history"
  ON public.stock_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert stock history"
  ON public.stock_history FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Backfill in_stock for all products based on stock_quantity so admin-created products are visible
UPDATE public.products
  SET in_stock = true
  WHERE in_stock = false;

-- Migrate existing badge_text to badge_type='custom'
UPDATE public.products
  SET badge_type = CASE
    WHEN badge_text IS NULL OR badge_text = '' THEN 'none'
    WHEN badge_text IN ('Eid Collection','Summer Collection','Winter Collection','Trending','Best Seller','Limited Edition','New','Discount') THEN badge_text
    ELSE 'custom'
  END
  WHERE badge_type IS NULL OR badge_type = 'none';