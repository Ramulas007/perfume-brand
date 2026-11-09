ALTER TABLE public.coupons
ADD COLUMN IF NOT EXISTS applicable_product_ids uuid[] DEFAULT NULL;

COMMENT ON COLUMN public.coupons.applicable_product_ids IS 'If NULL or empty, coupon applies to all products. Otherwise restricted to listed product ids.';