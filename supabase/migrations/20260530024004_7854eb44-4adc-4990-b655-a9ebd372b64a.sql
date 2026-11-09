
-- Add new columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS badge_text TEXT,
  ADD COLUMN IF NOT EXISTS badge_color TEXT DEFAULT '#8B0000',
  ADD COLUMN IF NOT EXISTS enable_sizes BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_colors BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_volumes BOOLEAN NOT NULL DEFAULT false;

-- Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_type TEXT NOT NULL CHECK (variant_type IN ('size','color','volume')),
  value TEXT NOT NULL,
  price NUMERIC,
  sale_price NUMERIC,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  image_urls TEXT[],
  color_hex TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_type ON public.product_variants(variant_type);

GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view variants"
  ON public.product_variants FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage variants"
  ON public.product_variants FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
