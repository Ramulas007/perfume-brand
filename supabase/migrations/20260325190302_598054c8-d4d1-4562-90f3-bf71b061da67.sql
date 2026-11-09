
-- Coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'flat' CHECK (type IN ('flat', 'percentage', 'free_shipping')),
  value NUMERIC NOT NULL DEFAULT 0,
  min_order_value NUMERIC DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- Coupon usage tracking
CREATE TABLE public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.coupon_usage
  FOR SELECT TO public USING (auth.uid() = user_id);

CREATE POLICY "Users can insert usage" ON public.coupon_usage
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage coupon usage" ON public.coupon_usage
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- Add coupon fields to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- Page builder table
CREATE TABLE public.page_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.page_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published pages" ON public.page_layouts
  FOR SELECT TO public USING (is_published = true);

CREATE POLICY "Admins can manage page layouts" ON public.page_layouts
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_layouts_updated_at BEFORE UPDATE ON public.page_layouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
