import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DesignYourThoughtSettings {
  enabled: boolean;
  image_url: string;
  eyebrow: string;
  title_part_one: string;
  title_part_two: string;
  description: string;
  stat_one_value: string;
  stat_one_label: string;
  stat_two_value: string;
  stat_two_label: string;
  primary_button_text: string;
  primary_button_link: string;
  secondary_button_text: string;
  secondary_button_link: string;
}

export const defaultDYT: DesignYourThoughtSettings = {
  enabled: true,
  image_url:
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1600&q=80',
  eyebrow: 'Premium Collection',
  title_part_one: 'Design Your',
  title_part_two: 'Thought',
  description:
    'Customize premium tees with your unique style — bold, distinctive, and crafted exclusively for you.',
  stat_one_value: '1000+',
  stat_one_label: 'Designs',
  stat_two_value: '98%',
  stat_two_label: 'Happy',
  primary_button_text: 'Customize Now',
  primary_button_link: '/customize',
  secondary_button_text: 'View Collection',
  secondary_button_link: '/shop',
};

export const useDesignYourThought = () => {
  const [settings, setSettings] = useState<DesignYourThoughtSettings>(defaultDYT);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'design_your_thought')
        .maybeSingle();
      if (error) throw error;
      if (data?.value) {
        setSettings({ ...defaultDYT, ...(data.value as Partial<DesignYourThoughtSettings>) });
      }
    } catch (e) {
      console.error('Error fetching DYT settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, refetch: fetchSettings };
};
