import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isLocalPerfumeCatalogEnabled } from '@/data/perfumeCatalog';

interface SiteSettings {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  loaderLogoUrl: string;
  headerPhone: string;
  headerTagline: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementLink: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
}

const SITE_SETTINGS_CACHE_KEY = 'static-vibes-site-settings';

const defaults: SiteSettings = {
  siteName: 'Helpful Perfumes',
  logoUrl: '/helpful-perfumes/helpful-perfumes-logo-transparent.png',
  faviconUrl: '/helpful-perfumes/helpful-perfumes-logo.jpg',
  loaderLogoUrl: '/helpful-perfumes/helpful-perfumes-logo-transparent.png',
  headerPhone: '0190990757',
  headerTagline: 'Free standard delivery on all orders.',
  announcementEnabled: false,
  announcementText: '',
  announcementLink: '',
  seoTitle: 'Helpful Perfumes | Bangladesh\'s Premium Perfume Store',
  seoDescription: 'Discover authentic perfumes, fragrances, attars, and decants from Helpful Perfumes with nationwide delivery across Bangladesh.',
  ogImage: '/helpful-perfumes/hero-section.jpg',
};

const getInitialSettings = (): SiteSettings => {
  if (typeof window === 'undefined') return defaults;

  try {
    const cached = window.localStorage.getItem(SITE_SETTINGS_CACHE_KEY);
    if (cached) {
      const settings = { ...defaults, ...JSON.parse(cached) };
      return isLocalPerfumeCatalogEnabled()
        ? { ...settings, siteName: defaults.siteName, logoUrl: defaults.logoUrl, faviconUrl: defaults.faviconUrl, loaderLogoUrl: defaults.loaderLogoUrl }
        : settings;
    }
  } catch (error) {
    console.error('Error reading cached site settings:', error);
  }

  return defaults;
};

const cacheSettings = (settings: SiteSettings) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(SITE_SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error caching site settings:', error);
  }
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(getInitialSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['logo', 'site_name', 'favicon', 'header_content', 'announcement_bar', 'loader_settings', 'seo_settings']);

      if (error) throw error;

      const updated = { ...defaults };
      data?.forEach((setting) => {
        if (setting.key === 'site_name') {
          const val = setting.value as unknown as { name?: string };
          updated.siteName = val?.name || defaults.siteName;
        }
        if (setting.key === 'logo') {
          const val = setting.value as unknown as { url?: string };
          updated.logoUrl = val?.url || '';
        }
        if (setting.key === 'favicon') {
          const val = setting.value as unknown as { url?: string };
          updated.faviconUrl = val?.url || '';
        }
        if (setting.key === 'header_content') {
          const val = setting.value as unknown as { phone?: string; tagline?: string };
          updated.headerPhone = val?.phone || defaults.headerPhone;
          updated.headerTagline = val?.tagline || defaults.headerTagline;
        }
        if (setting.key === 'announcement_bar') {
          const val = setting.value as unknown as { enabled?: boolean; text?: string; link?: string };
          updated.announcementEnabled = Boolean(val?.enabled);
          updated.announcementText = val?.text || '';
          updated.announcementLink = val?.link || '';
        }
        if (setting.key === 'loader_settings') {
          const val = setting.value as unknown as { loader_logo_url?: string };
          updated.loaderLogoUrl = val?.loader_logo_url || '';
        }
        if (setting.key === 'seo_settings') {
          const val = setting.value as unknown as { title?: string; description?: string; ogImage?: string };
          updated.seoTitle = val?.title || defaults.seoTitle;
          updated.seoDescription = val?.description || defaults.seoDescription;
          updated.ogImage = val?.ogImage || '';
        }
      });

      if (isLocalPerfumeCatalogEnabled()) {
        updated.siteName = defaults.siteName;
        updated.logoUrl = defaults.logoUrl;
        updated.faviconUrl = defaults.faviconUrl;
        updated.loaderLogoUrl = defaults.loaderLogoUrl;
        updated.headerTagline = defaults.headerTagline;
        updated.announcementEnabled = false;
        updated.announcementText = '';
        updated.announcementLink = '';
      }

      setSettings(updated);
      cacheSettings(updated);

      // Update favicon dynamically
      if (updated.faviconUrl) {
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (link) {
          link.href = updated.faviconUrl;
        } else {
          const newLink = document.createElement('link');
          newLink.rel = 'icon';
          newLink.href = updated.faviconUrl;
          document.head.appendChild(newLink);
        }
      }

      // NOTE: do not override document.title here — per-route <Helmet> owns the title
    } catch (error) {
      console.error('Error fetching site settings:', error);
      setSettings(defaults);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    const handleSettingsUpdated = (event: Event) => {
      const { detail } = event as CustomEvent<Partial<SiteSettings>>;
      if (!detail) return;

      setSettings((current) => {
        const updated = { ...current, ...detail };
        cacheSettings(updated);
        return updated;
      });
    };

    window.addEventListener('site-settings-updated', handleSettingsUpdated);

    return () => {
      window.removeEventListener('site-settings-updated', handleSettingsUpdated);
    };
  }, []);

  return { ...settings, loading, refetch: fetchSettings };
};
