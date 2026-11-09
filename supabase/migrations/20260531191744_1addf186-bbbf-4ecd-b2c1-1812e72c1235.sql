-- Create apk_management table
CREATE TABLE IF NOT EXISTS public.apk_management (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apk_url TEXT NOT NULL,
    version TEXT NOT NULL,
    release_notes TEXT,
    file_size BIGINT,
    is_active BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Grant permissions
GRANT SELECT ON public.apk_management TO anon, authenticated;
GRANT ALL ON public.apk_management TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.apk_management TO authenticated;

-- Enable RLS
ALTER TABLE public.apk_management ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active APKs" 
ON public.apk_management 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage APKs" 
ON public.apk_management 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create Storage Bucket for APKs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('apks', 'apks', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public can download APKs"
ON storage.objects FOR SELECT
USING (bucket_id = 'apks');

CREATE POLICY "Admins can upload APKs"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'apks' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);