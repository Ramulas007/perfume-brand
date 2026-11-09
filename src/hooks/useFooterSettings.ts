import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isLocalPerfumeCatalogEnabled } from '@/data/perfumeCatalog';

interface FooterSettings {
  tagline: string;
  phone: string;
  email: string;
  address: string;
  copyright: string;
}

interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  linkedin: string;
}

interface PaymentMethods {
  bkash: boolean;
  nagad: boolean;
  roket: boolean;
  cod: boolean;
}

export const useFooterSettings = () => {
  const [footerContent, setFooterContent] = useState<FooterSettings>({
    tagline: 'Authentic perfumes and fragrances delivered across Bangladesh.',
    phone: '09617827080',
    email: 'support@helpfulperfumes.com',
    address: 'Rajshahi, Bangladesh',
    copyright: 'Helpful Perfumes',
  });

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    facebook: '',
    instagram: '',
    youtube: '',
    linkedin: '',
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>({
    bkash: true,
    nagad: true,
    roket: true,
    cod: true,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (isLocalPerfumeCatalogEnabled()) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['footer_content', 'social_links', 'payment_methods']);

      if (error) throw error;

      data?.forEach((setting) => {
        if (setting.key === 'footer_content') {
          const content = setting.value as unknown as FooterSettings;
          if (content) {
            setFooterContent({
              tagline: content.tagline || 'Premium fashion and lifestyle since 2024.',
              phone: content.phone || '09617827080',
              email: content.email || 'support@staticvibes.com',
              address: content.address || 'Dhaka, BD',
              copyright: content.copyright || 'Helpful Perfumes',
            });
          }
        }
        if (setting.key === 'social_links') {
          const links = setting.value as unknown as SocialLinks;
          if (links) {
            setSocialLinks({
              facebook: links.facebook || '',
              instagram: links.instagram || '',
              youtube: links.youtube || '',
              linkedin: links.linkedin || '',
            });
          }
        }
        if (setting.key === 'payment_methods') {
          const methods = (setting.value as string[]) || [];
          setPaymentMethods({
            bkash: methods.includes('bkash'),
            nagad: methods.includes('nagad'),
            roket: methods.includes('roket'),
            cod: methods.includes('cod'),
          });
        }
      });
    } catch (error) {
      console.error('Error fetching footer settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { footerContent, socialLinks, paymentMethods, loading };
};
