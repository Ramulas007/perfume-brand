
-- Create latest_showcase table
CREATE TABLE public.latest_showcase (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  image_url TEXT NOT NULL,
  product_link TEXT NOT NULL DEFAULT '/shop',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.latest_showcase ENABLE ROW LEVEL SECURITY;

-- Anyone can view active showcases
CREATE POLICY "Anyone can view active showcases"
ON public.latest_showcase
FOR SELECT
USING (is_active = true);

-- Admins can manage showcases
CREATE POLICY "Admins can manage showcases"
ON public.latest_showcase
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_latest_showcase_updated_at
BEFORE UPDATE ON public.latest_showcase
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
