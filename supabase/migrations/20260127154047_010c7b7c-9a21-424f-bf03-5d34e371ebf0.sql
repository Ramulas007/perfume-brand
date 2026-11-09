-- Create app_role enum for admin system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Anyone can view categories" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create products table in database
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    discount INTEGER,
    image_url TEXT,
    category_id UUID REFERENCES public.categories(id),
    colors TEXT[],
    sizes TEXT[],
    sku TEXT,
    in_stock BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Anyone can view products" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage products" 
ON public.products 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create site_settings table for logo, payment methods, etc.
CREATE TABLE public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Site settings policies
CREATE POLICY "Anyone can view site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage site settings" 
ON public.site_settings 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create page_contents table for editable pages (return policy, privacy, terms)
CREATE TABLE public.page_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on page_contents
ALTER TABLE public.page_contents ENABLE ROW LEVEL SECURITY;

-- Page contents policies
CREATE POLICY "Anyone can view page contents" 
ON public.page_contents 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage page contents" 
ON public.page_contents 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_page_contents_updated_at
BEFORE UPDATE ON public.page_contents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update orders table to allow admin access
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all orders" 
ON public.orders 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Update order_items to allow admin access
CREATE POLICY "Admins can view all order items" 
ON public.order_items 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default page contents
INSERT INTO public.page_contents (slug, title, content) VALUES
('return-policy', 'Return & Exchange Policy', '# Return & Exchange Policy

## Overview
At One Ummah BD, we want you to be completely satisfied with your purchase.

## Return Window
- Items can be returned within 7 days of delivery
- Products must be unused and in original packaging

## Exchange Process
1. Contact us via phone or email
2. Provide your order number
3. We will arrange pickup and exchange

## Non-Returnable Items
- Undergarments
- Customized items
- Sale items

## Contact
Phone: 09617827080
Email: oneummahbd@gmail.com'),

('privacy-policy', 'Privacy Policy', '# Privacy Policy

## Information We Collect
- Name, email, phone number
- Shipping address
- Payment information

## How We Use Your Information
- Process and fulfill orders
- Send order updates
- Improve our services

## Data Security
We implement appropriate security measures to protect your personal information.

## Contact Us
Email: oneummahbd@gmail.com'),

('terms-conditions', 'Terms & Conditions', '# Terms & Conditions

## Acceptance of Terms
By using our website, you agree to these terms.

## Orders
- All orders are subject to availability
- Prices may change without notice
- We reserve the right to refuse service

## Payment
- Payment must be made at time of order
- We accept bKash, Nagad, Roket, and Cash on Delivery

## Shipping
- Standard delivery: 3-5 business days
- Delivery charges apply based on location

## Contact
Email: oneummahbd@gmail.com
Phone: 09617827080');

-- Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES
('logo', '{"url": null, "alt": "One Ummah BD"}'),
('payment_methods', '["bkash", "nagad", "roket", "cod"]'),
('theme', '{"mode": "light"}');