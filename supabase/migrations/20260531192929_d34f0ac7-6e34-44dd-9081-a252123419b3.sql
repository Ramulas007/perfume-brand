-- Extend products table for AI content
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
ADD COLUMN IF NOT EXISTS highlights TEXT[],
ADD COLUMN IF NOT EXISTS features TEXT[],
ADD COLUMN IF NOT EXISTS care_instructions TEXT,
ADD COLUMN IF NOT EXISTS delivery_info TEXT,
ADD COLUMN IF NOT EXISTS return_policy TEXT,
ADD COLUMN IF NOT EXISTS care_info TEXT,
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];

-- Log table for AI generations
CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    prompt_used TEXT,
    result_status TEXT, -- success, failure
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for logs
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view AI logs" ON public.ai_generation_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
GRANT ALL ON public.ai_generation_logs TO authenticated;
GRANT ALL ON public.ai_generation_logs TO service_role;
