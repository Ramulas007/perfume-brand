
-- Seed a public tracking_settings row from existing api_settings (tracking-only fields)
INSERT INTO public.site_settings (key, value)
SELECT
  'tracking_settings',
  jsonb_strip_nulls(jsonb_build_object(
    'google_analytics_id', value->>'google_analytics_id',
    'google_ads_id',       value->>'google_ads_id',
    'facebook_pixel_id',   value->>'facebook_pixel_id',
    'google_tag_manager_id', value->>'google_tag_manager_id'
  ))
FROM public.site_settings
WHERE key = 'api_settings'
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = now();

-- Replace permissive public read policy so api_settings is admin-only
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;

CREATE POLICY "Public can view non-sensitive site settings"
ON public.site_settings
FOR SELECT
USING (key <> 'api_settings');

CREATE POLICY "Admins can view all site settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
