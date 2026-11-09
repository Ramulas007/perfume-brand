-- Create legal_pages table
CREATE TABLE public.legal_pages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grant permissions
GRANT SELECT ON public.legal_pages TO anon, authenticated;
GRANT ALL ON public.legal_pages TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.legal_pages TO authenticated;

-- Enable RLS
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Legal pages are viewable by everyone" 
ON public.legal_pages 
FOR SELECT 
USING (true);

-- Assuming we have an admin role check or similar. 
-- For now, allowing authenticated users to manage them as they are likely admins.
CREATE POLICY "Admins can manage legal pages" 
ON public.legal_pages 
FOR ALL
USING (auth.uid() IN (SELECT id FROM auth.users WHERE (raw_user_meta_data->>'role')::text = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE (raw_user_meta_data->>'role')::text = 'admin'));

-- Function for updated_at
CREATE TRIGGER update_legal_pages_updated_at
BEFORE UPDATE ON public.legal_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data
INSERT INTO public.legal_pages (title, slug, content, last_updated) VALUES 
('Privacy Policy', 'privacy-policy', 'We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information...', '2026-04-27'),
('Return & Exchange Policy', 'return-policy', '## Return Policy Overview At our store, we want you to be completely satisfied with your purchase. If you''re not happy with your order, we offer a hassle-free...', '2026-04-27'),
('Terms & Conditions', 'terms-conditions', 'Welcome to our store. By accessing and using our website, you agree to be bound by these Terms and Conditions...', '2026-04-27');