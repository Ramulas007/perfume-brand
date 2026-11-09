import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type DesignSettings = {
  // Layout - grid columns
  grid: {
    category: { mobile: number; tablet: number; desktop: number };
    products: { mobile: number; tablet: number; desktop: number };
    featured: { mobile: number; tablet: number; desktop: number };
    newArrivals: { mobile: number; tablet: number; desktop: number };
    related: { mobile: number; tablet: number; desktop: number };
  };
  // Border radii (px)
  radius: {
    product: number;
    category: number;
    banner: number;
    button: number;
    base: number; // global --radius (rem * 16)
  };
  categoryImageShape: 'square' | 'rounded' | 'circle' | 'custom';
  categoryImageRadius: number;

  // Header
  header: {
    logoPos: 'left' | 'center' | 'right';
    searchPos: 'left' | 'center' | 'right';
    menuPos: 'left' | 'center' | 'right';
    height: number; // px
    sticky: boolean;
    transparent: boolean;
    padding: number; // px
  };

  // Buttons
  button: {
    size: 'sm' | 'md' | 'lg';
    style: 'square' | 'rounded' | 'pill';
  };

  // Typography
  typography: {
    fontBody: string;
    fontHeading: string;
    fontSize: number; // px
    fontWeight: number; // 300-800
    headingScale: number; // multiplier
  };

  // Product card toggles
  productCard: {
    showRating: boolean;
    showPrice: boolean;
    showDiscount: boolean;
    showWishlist: boolean;
    showQuickView: boolean;
    showAddToCart: boolean;
  };

  // Spacing (px)
  spacing: {
    section: number;
    card: number;
    grid: number;
    headerPadding: number;
  };

  // Colors (hex)
  colors: {
    primary: string;
    secondary: string;
    background: string;
    button: string;
    text: string;
  };

  // Mobile bottom navigation
  mobileNav: {
    enabled: boolean;
    headerMode: 'header' | 'bottom-only' | 'both' | 'none';
    showOn: 'mobile' | 'mobile-tablet' | 'all';
    position: 'fixed' | 'floating' | 'dock';
    style: 'modern' | 'minimal' | 'premium' | 'glass' | 'ios' | 'android';
    showLabels: boolean;
    iconsOnly: boolean;
    autoHideOnScroll: boolean;
    sticky: boolean;
    shadow: boolean;
    blur: boolean;
    height: number;
    iconSize: number;
    labelSize: number;
    radius: number;
    bgColor: string;
    activeColor: string;
    inactiveColor: string;
    items: { id: string; label: string; icon: string; href: string }[];
    safeArea: {
      adjustFooter: boolean;
      adjustWhatsapp: boolean;
      adjustFloating: boolean;
    };
  };
};

export const DEFAULT_DESIGN: DesignSettings = {
  grid: {
    category: { mobile: 3, tablet: 4, desktop: 6 },
    products: { mobile: 2, tablet: 4, desktop: 5 },
    featured: { mobile: 2, tablet: 3, desktop: 4 },
    newArrivals: { mobile: 2, tablet: 3, desktop: 4 },
    related: { mobile: 2, tablet: 3, desktop: 4 },
  },
  radius: { product: 12, category: 12, banner: 24, button: 10, base: 8 },
  categoryImageShape: 'rounded',
  categoryImageRadius: 12,
  header: {
    logoPos: 'left', searchPos: 'center', menuPos: 'right',
    height: 72, sticky: true, transparent: false, padding: 16,
  },
  button: { size: 'md', style: 'rounded' },
  typography: {
    fontBody: 'Outfit', fontHeading: 'Space Grotesk',
    fontSize: 16, fontWeight: 400, headingScale: 1,
  },
  productCard: {
    showRating: true, showPrice: true, showDiscount: true,
    showWishlist: true, showQuickView: true, showAddToCart: true,
  },
  spacing: { section: 64, card: 16, grid: 16, headerPadding: 16 },
  colors: {
    primary: '#141414', secondary: '#E8E1D6', background: '#FFFFFF',
    button: '#141414', text: '#1F1A1A',
  },
  mobileNav: {
    enabled: true,
    headerMode: 'both',
    showOn: 'mobile',
    position: 'fixed',
    style: 'modern',
    showLabels: true,
    iconsOnly: false,
    autoHideOnScroll: false,
    sticky: true,
    shadow: true,
    blur: true,
    height: 64,
    iconSize: 20,
    labelSize: 10,
    radius: 0,
    bgColor: '#FFFFFF',
    activeColor: '#141414',
    inactiveColor: '#8A8A8A',
    items: [
      { id: 'home', label: 'Home', icon: 'Home', href: '/' },
      { id: 'categories', label: 'Categories', icon: 'LayoutGrid', href: '/shop' },
      { id: 'search', label: 'Search', icon: 'Search', href: '/shop' },
      { id: 'cart', label: 'Cart', icon: 'ShoppingCart', href: '/checkout' },
      { id: 'account', label: 'Account', icon: 'User', href: '/profile' },
    ],
    safeArea: {
      adjustFooter: true,
      adjustWhatsapp: true,
      adjustFloating: true,
    },
  },
};

// ---- Theme presets ----
export const THEME_PRESETS: Record<string, Partial<DesignSettings>> = {
  Modern: {
    radius: { product: 16, category: 16, banner: 24, button: 12, base: 10 },
    colors: { primary: '#0F172A', secondary: '#F1F5F9', background: '#FFFFFF', button: '#0F172A', text: '#0F172A' },
    typography: { fontBody: 'Inter', fontHeading: 'Inter', fontSize: 16, fontWeight: 400, headingScale: 1.05 },
    button: { size: 'md', style: 'rounded' },
  },
  Minimal: {
    radius: { product: 4, category: 4, banner: 8, button: 4, base: 4 },
    colors: { primary: '#111111', secondary: '#F5F5F5', background: '#FFFFFF', button: '#111111', text: '#111111' },
    typography: { fontBody: 'Inter', fontHeading: 'Inter', fontSize: 15, fontWeight: 400, headingScale: 1 },
    button: { size: 'md', style: 'square' },
  },
  Premium: {
    radius: { product: 20, category: 20, banner: 32, button: 14, base: 12 },
    colors: { primary: '#1A1A1A', secondary: '#EFE9DD', background: '#FAFAF7', button: '#1A1A1A', text: '#1A1A1A' },
    typography: { fontBody: 'Outfit', fontHeading: 'Playfair Display', fontSize: 16, fontWeight: 400, headingScale: 1.1 },
    button: { size: 'lg', style: 'rounded' },
  },
  Luxury: {
    radius: { product: 8, category: 8, banner: 16, button: 999, base: 6 },
    colors: { primary: '#3F0A14', secondary: '#F1E7D0', background: '#FFFDF8', button: '#C9A14A', text: '#2A0A12' },
    typography: { fontBody: 'Cormorant Garamond', fontHeading: 'Playfair Display', fontSize: 17, fontWeight: 400, headingScale: 1.2 },
    button: { size: 'lg', style: 'pill' },
  },
  Ecommerce: {
    radius: { product: 10, category: 10, banner: 16, button: 8, base: 8 },
    colors: { primary: '#1E40AF', secondary: '#EFF6FF', background: '#FFFFFF', button: '#1E40AF', text: '#0F172A' },
    typography: { fontBody: 'Inter', fontHeading: 'Inter', fontSize: 15, fontWeight: 400, headingScale: 1 },
    button: { size: 'md', style: 'rounded' },
  },
  Dark: {
    radius: { product: 14, category: 14, banner: 24, button: 12, base: 10 },
    colors: { primary: '#FFFFFF', secondary: '#1F1F23', background: '#0A0A0B', button: '#FFFFFF', text: '#F4F4F5' },
    typography: { fontBody: 'Inter', fontHeading: 'Inter', fontSize: 16, fontWeight: 400, headingScale: 1 },
    button: { size: 'md', style: 'rounded' },
  },
};

export const FONT_OPTIONS = [
  'Outfit', 'Inter', 'Space Grotesk', 'Sora', 'Playfair Display',
  'Cormorant Garamond', 'Roboto', 'Poppins', 'Montserrat', 'DM Sans',
  'Manrope', 'Lora', 'Work Sans', 'Nunito', 'Raleway',
];

// ---- Helpers ----
const hexToHsl = (hex: string): string => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hh = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hh = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hh = (b - r) / d + 2; break;
      case b: hh = (r - g) / d + 4; break;
    }
    hh /= 6;
  }
  return `${Math.round(hh * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const loadGoogleFont = (family: string) => {
  if (!family) return;
  const id = `gf-${family.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id; link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
};

// Deep merge
const mergeDeep = <T,>(base: T, patch: any): T => {
  if (!patch) return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...base };
  for (const k of Object.keys(patch)) {
    const v = patch[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object') {
      out[k] = mergeDeep(out[k], v);
    } else if (v !== undefined) out[k] = v;
  }
  return out;
};

// ---- Context ----
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

type Ctx = {
  settings: DesignSettings;
  loading: boolean;
  update: (patch: DeepPartial<DesignSettings> | ((s: DesignSettings) => DesignSettings)) => void;
  save: () => Promise<void>;
  reset: () => void;
  applyPreset: (name: keyof typeof THEME_PRESETS) => void;
  dirty: boolean;
};

const DesignContext = createContext<Ctx | null>(null);

export const DesignSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<DesignSettings>(DEFAULT_DESIGN);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'design_settings')
          .maybeSingle();
        if (data?.value) {
          setSettings(mergeDeep(DEFAULT_DESIGN, data.value));
        }
      } catch (e) { console.error('design load', e); }
      finally { setLoading(false); }
    })();
  }, []);

  // Apply to :root whenever settings change
  useEffect(() => {
    const r = document.documentElement.style;
    const s = settings;
    // Colors → HSL tokens override
    r.setProperty('--primary', hexToHsl(s.colors.primary));
    r.setProperty('--ring', hexToHsl(s.colors.primary));
    r.setProperty('--secondary', hexToHsl(s.colors.secondary));
    r.setProperty('--background', hexToHsl(s.colors.background));
    r.setProperty('--foreground', hexToHsl(s.colors.text));
    r.setProperty('--btn-bg', s.colors.button);
    // Radii
    r.setProperty('--radius', `${s.radius.base}px`);
    r.setProperty('--radius-product', `${s.radius.product}px`);
    r.setProperty('--radius-category', `${s.radius.category}px`);
    r.setProperty('--radius-banner', `${s.radius.banner}px`);
    r.setProperty('--radius-button',
      s.button.style === 'pill' ? '9999px' :
      s.button.style === 'square' ? '0px' : `${s.radius.button}px`);
    // Category image shape
    const catR = s.categoryImageShape === 'square' ? 0
      : s.categoryImageShape === 'circle' ? 9999
      : s.categoryImageShape === 'rounded' ? 12
      : s.categoryImageRadius;
    r.setProperty('--radius-cat-image', `${catR}px`);
    // Header
    r.setProperty('--header-h', `${s.header.height}px`);
    r.setProperty('--header-pad', `${s.header.padding}px`);
    // Spacing
    r.setProperty('--gap-section', `${s.spacing.section}px`);
    r.setProperty('--gap-card', `${s.spacing.card}px`);
    r.setProperty('--gap-grid', `${s.spacing.grid}px`);
    // Typography
    loadGoogleFont(s.typography.fontBody);
    loadGoogleFont(s.typography.fontHeading);
    r.setProperty('--font-body', `'${s.typography.fontBody}', sans-serif`);
    r.setProperty('--font-heading', `'${s.typography.fontHeading}', sans-serif`);
    r.setProperty('--fs-base', `${s.typography.fontSize}px`);
    r.setProperty('--fw-base', String(s.typography.fontWeight));
    r.setProperty('--heading-scale', String(s.typography.headingScale));
    document.body.style.fontSize = `${s.typography.fontSize}px`;
    document.body.style.fontWeight = String(s.typography.fontWeight);
    // Button size base
    const btnSize = s.button.size === 'sm' ? '0.875rem' : s.button.size === 'lg' ? '1.05rem' : '0.95rem';
    r.setProperty('--btn-fs', btnSize);
    // Grid columns vars
    const g = s.grid;
    Object.entries(g).forEach(([k, v]) => {
      r.setProperty(`--cols-${k}-m`, String(v.mobile));
      r.setProperty(`--cols-${k}-t`, String(v.tablet));
      r.setProperty(`--cols-${k}-d`, String(v.desktop));
    });
    // Product card visibility
    Object.entries(s.productCard).forEach(([k, v]) => {
      r.setProperty(`--pc-${k}`, v ? '1' : '0');
    });
    // Mobile nav body attrs (used by Header + MobileBottomNav)
    document.body.dataset.navMode = s.mobileNav?.headerMode || 'both';
    document.body.dataset.navShow = s.mobileNav?.showOn || 'mobile';
    document.body.dataset.navEnabled = s.mobileNav?.enabled ? '1' : '0';
    // Safe-area: compute mobile bottom nav reserved height
    const mn = s.mobileNav;
    const navActiveOnMobile =
      !!mn?.enabled && mn.headerMode !== 'header' && mn.headerMode !== 'none';
    const sa = mn?.safeArea || { adjustFooter: true, adjustWhatsapp: true, adjustFloating: true };
    const extra = mn?.position === 'fixed' ? 8 : 24; // floating/dock has gap
    const reserved = navActiveOnMobile ? (mn.height || 64) + extra : 0;
    r.setProperty('--mobile-nav-safe-h', `${reserved}px`);
    document.body.dataset.navActive = navActiveOnMobile ? '1' : '0';
    document.body.dataset.saFooter = sa.adjustFooter ? '1' : '0';
    document.body.dataset.saWhatsapp = sa.adjustWhatsapp ? '1' : '0';
    document.body.dataset.saFloating = sa.adjustFloating ? '1' : '0';
  }, [settings]);

  const update = useCallback((patch: any) => {
    setDirty(true);
    setSettings(prev => typeof patch === 'function' ? patch(prev) : mergeDeep(prev, patch));
  }, []);

  const save = useCallback(async () => {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'design_settings', value: settings as any }, { onConflict: 'key' });
    if (error) throw error;
    setDirty(false);
  }, [settings]);

  const reset = useCallback(() => { setSettings(DEFAULT_DESIGN); setDirty(true); }, []);
  const applyPreset = useCallback((name: keyof typeof THEME_PRESETS) => {
    setDirty(true);
    setSettings(prev => mergeDeep(prev, THEME_PRESETS[name]));
  }, []);

  return (
    <DesignContext.Provider value={{ settings, loading, update, save, reset, applyPreset, dirty }}>
      {children}
    </DesignContext.Provider>
  );
};

export const useDesignSettings = () => {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error('useDesignSettings must be used inside DesignSettingsProvider');
  return ctx;
};
