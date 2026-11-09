ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_products_display_order ON public.products(display_order);