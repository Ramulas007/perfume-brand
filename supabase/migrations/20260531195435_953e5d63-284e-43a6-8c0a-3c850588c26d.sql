ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS loader_logo_url TEXT,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Update the existing record if it exists
COMMENT ON COLUMN public.site_settings.loader_logo_url IS 'URL for the custom animated loader icon used on the loading screen';