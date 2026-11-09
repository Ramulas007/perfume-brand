ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_code TEXT,
ADD COLUMN IF NOT EXISTS courier_status TEXT,
ADD COLUMN IF NOT EXISTS courier_name TEXT;

-- Update existing policies if necessary (usually not needed for simple column additions)
-- Ensure service_role can access these columns (already true by default)
