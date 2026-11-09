-- Add supplementary_images column to products table for storing additional product images
ALTER TABLE public.products 
ADD COLUMN supplementary_images text[] NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.products.supplementary_images IS 'Array of URLs for additional product images (gallery/side views)';