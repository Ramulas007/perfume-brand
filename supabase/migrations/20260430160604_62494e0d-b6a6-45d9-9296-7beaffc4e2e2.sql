INSERT INTO public.site_settings (key, value)
VALUES (
  'design_your_thought',
  '{
    "enabled": true,
    "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1600&q=80",
    "eyebrow": "Premium Collection",
    "title_part_one": "Design Your",
    "title_part_two": "Thought",
    "description": "Customize premium tees with your unique style — bold, distinctive, and crafted exclusively for you.",
    "stat_one_value": "1000+",
    "stat_one_label": "Designs",
    "stat_two_value": "98%",
    "stat_two_label": "Happy",
    "primary_button_text": "Customize Now",
    "primary_button_link": "/shop",
    "secondary_button_text": "View Collection",
    "secondary_button_link": "/shop"
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;