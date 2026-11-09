import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AboutContent {
  heroSubtitle: string;
  heroTitle: string;
  heroDescription: string;
  storyTitle: string;
  storyDescription: string;
  mission: string;
  vision: string;
  stats: {
    customers: string;
    products: string;
    districts: string;
    years: string;
  };
  ctaTitle: string;
  ctaDescription: string;
}

export interface ContactContent {
  heroSubtitle: string;
  heroTitle: string;
  heroDescription: string;
  phones: string[];
  emails: string[];
  address: string[];
  workingHours: string[];
  whatsappNumber: string;
  whatsappEnabled?: boolean;
  mapEmbedUrl: string;
}

const defaultAbout: AboutContent = {
  heroSubtitle: 'Serving You Since 2020',
  heroTitle: 'About Us',
  heroDescription: "Bangladesh's Trusted Online Fashion Store",
  storyTitle: 'How Our Journey Began',
  storyDescription: 'Since 2020, we have been providing the best quality clothing and fashion items to the people of Bangladesh. Our goal is to deliver high-quality products at affordable prices.',
  mission: 'To deliver high-quality Islamic fashion products at affordable prices to everyone.',
  vision: 'To become the most trusted and preferred online fashion brand in Bangladesh.',
  stats: {
    customers: '10,000+',
    products: '500+',
    districts: '64',
    years: '5+',
  },
  ctaTitle: 'Start Shopping Today!',
  ctaDescription: 'Stay with us and get the best offers & discounts. Quality guarantee on every product.',
};

const defaultContact: ContactContent = {
  heroSubtitle: '24/7 Customer Support',
  heroTitle: 'Contact Us',
  heroDescription: "We're always ready to help you",
  phones: ['09617827080'],
  emails: ['staticvibesbd@gmail.com'],
  address: ['Dhaka, Bangladesh'],
  workingHours: ['Sat - Thu: 9AM - 9PM', 'Friday: Closed'],
  whatsappNumber: '880190990757',
  whatsappEnabled: true,
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.1234567890123!2d90.36789012345678!3d23.80123456789012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDQ4JzA0LjQiTiA5MMKwMjInMDQuNCJF!5e0!3m2!1sen!2sbd!4v1234567890123!5m2!1sen!2sbd',
};

export const usePageContent = () => {
  const [aboutContent, setAboutContent] = useState<AboutContent>(defaultAbout);
  const [contactContent, setContactContent] = useState<ContactContent>(defaultContact);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['about_content', 'contact_content']);

      if (error) throw error;

      data?.forEach((setting) => {
        if (setting.key === 'about_content') {
          const content = setting.value as unknown as AboutContent;
          if (content) {
            setAboutContent({ ...defaultAbout, ...content });
          }
        }
        if (setting.key === 'contact_content') {
          const content = setting.value as unknown as ContactContent;
          if (content) {
            setContactContent({ ...defaultContact, ...content });
          }
        }
      });
    } catch (error) {
      console.error('Error fetching page content:', error);
    } finally {
      setLoading(false);
    }
  };

  return { aboutContent, contactContent, loading };
};
