
-- 1. Profiles: restrict public read
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. APK management: only expose active rows publicly
DROP POLICY IF EXISTS "Anyone can view active APKs" ON public.apk_management;

CREATE POLICY "Anyone can view active APKs"
ON public.apk_management
FOR SELECT
USING (is_active = true);

-- 3. Storage: remove permissive product-image policies (admin-role-checked ones already exist)
DROP POLICY IF EXISTS "Admin delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload product images" ON storage.objects;
