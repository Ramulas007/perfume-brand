UPDATE public.products
SET supplementary_images = ARRAY['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80']
WHERE supplementary_images IS NULL OR array_length(supplementary_images, 1) IS NULL;