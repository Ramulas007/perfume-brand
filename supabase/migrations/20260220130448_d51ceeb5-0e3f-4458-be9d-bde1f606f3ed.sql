
-- Create products storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone to view product images
DROP POLICY IF EXISTS "Public product images" ON storage.objects;
CREATE POLICY "Public product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Allow authenticated admins to upload product images
DROP POLICY IF EXISTS "Admin upload product images" ON storage.objects;
CREATE POLICY "Admin upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products');

-- Allow authenticated users to update product images
DROP POLICY IF EXISTS "Admin update product images" ON storage.objects;
CREATE POLICY "Admin update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products');

-- Allow authenticated users to delete product images
DROP POLICY IF EXISTS "Admin delete product images" ON storage.objects;
CREATE POLICY "Admin delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'products');
