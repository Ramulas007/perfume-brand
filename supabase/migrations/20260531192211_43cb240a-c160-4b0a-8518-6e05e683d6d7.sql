-- Notifications table for history and user notification center
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id), -- Null for guest/all users
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    image_url TEXT,
    target_url TEXT,
    is_read BOOLEAN DEFAULT false,
    type TEXT NOT NULL DEFAULT 'manual', -- manual, order, product, welcome, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Push subscriptions for storing browser/app tokens
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id), -- Optional for anonymous notifications
    subscription_data JSONB NOT NULL, -- Endpoint, keys, etc.
    device_type TEXT, -- web, android
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(subscription_data)
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed default settings
INSERT INTO public.notification_settings (key, enabled) VALUES
('new_product', true),
('offer_added', true),
('order_updates', true),
('welcome_message', true),
('back_in_stock', true),
('flash_sale', true)
ON CONFLICT (key) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO anon, authenticated;
GRANT SELECT ON public.notification_settings TO anon, authenticated;
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.push_subscriptions TO service_role;
GRANT ALL ON public.notification_settings TO service_role;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own notification status"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can register for push"
ON public.push_subscriptions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can manage their own subscriptions"
ON public.push_subscriptions FOR ALL
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view and manage all"
ON public.notifications FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Public can view settings"
ON public.notification_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update settings"
ON public.notification_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);