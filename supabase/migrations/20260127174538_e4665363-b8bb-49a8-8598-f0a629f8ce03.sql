-- Add payment_method and delivery_area columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cod';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_area text NOT NULL DEFAULT 'inside_dhaka';

-- Update shipping_cost default to reflect dynamic pricing
COMMENT ON COLUMN public.orders.shipping_cost IS 'Shipping cost: 80 for inside Dhaka, 130 for outside Dhaka';
COMMENT ON COLUMN public.orders.payment_method IS 'Payment method: cod, bkash, nagad';
COMMENT ON COLUMN public.orders.delivery_area IS 'Delivery area: inside_dhaka, outside_dhaka';