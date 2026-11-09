import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { OptimizedImage } from './OptimizedImage';
import { isLocalPerfumeCatalogEnabled } from '@/data/perfumeCatalog';

interface Banner {
  id: string;
  image_url: string | null;
  button_link: string | null;
  is_active: boolean;
  display_order: number | null;
}

const localPerfumeBanners: Banner[] = [
  { id: 'helpful-perfumes-hero', image_url: '/helpful-perfumes/hero-section.jpg', button_link: '/shop', is_active: true, display_order: 0 },
  { id: 'helpful-perfumes-store', image_url: '/helpful-perfumes/slide-1.jpg', button_link: '/shop', is_active: true, display_order: 1 },
  { id: 'helpful-perfumes-showroom', image_url: '/helpful-perfumes/slide-2.jpg', button_link: '/shop', is_active: true, display_order: 2 },
  { id: 'helpful-perfumes-shelves', image_url: '/helpful-perfumes/slide-3.jpg', button_link: '/shop', is_active: true, display_order: 3 },
];

export const HeroBanner = () => {
  const [banners, setBanners] = useState<Banner[]>(() => {
    if (typeof window === 'undefined') return [];
    if (isLocalPerfumeCatalogEnabled()) return localPerfumeBanners;
    try {
      const cached = localStorage.getItem('sv_banners') || sessionStorage.getItem('sv_banners');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(banners.length === 0);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const fetchBanners = async () => {
    if (isLocalPerfumeCatalogEnabled()) {
      setBanners(localPerfumeBanners);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('id, image_url, button_link, is_active, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      const list = data || [];
      setBanners(list);
      try { localStorage.setItem('sv_banners', JSON.stringify(list)); } catch {}
      try { sessionStorage.setItem('sv_banners', JSON.stringify(list)); } catch {}

    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () =>
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  const goToNext = () =>
    setCurrentIndex((prev) => (prev + 1) % banners.length);

  if (loading) {
    return (
      <section className="w-full">
        <div className="w-full aspect-[3/1] md:aspect-[3/1] bg-secondary animate-pulse" />
      </section>
    );
  }

  if (banners.length === 0) {
    if (isLocalPerfumeCatalogEnabled()) {
      return (
        <section className="relative w-full">
          <Link to="/shop" className="block w-full">
            <div className="w-full aspect-[3/1] bg-gradient-to-r from-stone-950 via-stone-800 to-amber-900 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-black/20" />
              <OptimizedImage
                src="/perfumes/images/001-armaf-club-de-nuit-intense-edp-man.jpg"
                alt="Premium perfumes"
                priority
                aspectRatio="banner"
                width={1920}
                className="relative w-full h-full object-contain"
              />
            </div>
          </Link>
        </section>
      );
    }
    return (
      <section className="w-full">
        <div className="w-full aspect-[3/1] md:aspect-[3/1] bg-secondary flex items-center justify-center">
          <p className="text-muted-foreground">No banners available</p>
        </div>
      </section>
    );
  }


  return (
    <section className="relative w-full">
      <div className="w-full">
        <div className="relative group">
          {/* Banner stage — full image visible on all devices */}
          <div className="relative overflow-hidden bg-card aspect-[3/1]">


            {banners.map((b, i) => {
              const ImgTag = (
                <motion.div
                  className="absolute inset-0 w-full h-full"
                  initial={false}
                  animate={{ opacity: i === currentIndex ? 1 : 0, scale: i === currentIndex ? 1 : 1.02 }}
                  transition={{ opacity: { duration: 1.1, ease: [0.22, 1, 0.36, 1] }, scale: { duration: 1.4, ease: [0.22, 1, 0.36, 1] } }}
                >
                  <OptimizedImage
                    src={b.image_url || '/placeholder.svg'}
                    alt="Banner"
                    className={`w-full h-full ${b.id.startsWith('helpful-perfumes-') ? 'object-cover' : 'object-contain'}`}
                    priority={i === 0}
                    aspectRatio="banner"
                    width={1920}
                  />
                </motion.div>
              );
              return b.button_link ? (
                <Link key={b.id} to={b.button_link} className="absolute inset-0 block" style={{ pointerEvents: i === currentIndex ? 'auto' : 'none' }}>
                  {ImgTag}
                </Link>
              ) : (
                <div key={b.id} className="absolute inset-0" style={{ pointerEvents: i === currentIndex ? 'auto' : 'none' }}>
                  {ImgTag}
                </div>
              );
            })}

            {/* Hover navigation arrows — desktop only */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  aria-label="Previous slide"
                  className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-background/85 backdrop-blur-sm text-foreground shadow-sm opacity-0 group-hover:opacity-100 hover:bg-background hover:scale-105 transition-all z-10"
                >
                  <ChevronLeft className="w-5 h-5" strokeWidth={2} />
                </button>
                <button
                  onClick={goToNext}
                  aria-label="Next slide"
                  className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-background/85 backdrop-blur-sm text-foreground shadow-sm opacity-0 group-hover:opacity-100 hover:bg-background hover:scale-105 transition-all z-10"
                >
                  <ChevronRight className="w-5 h-5" strokeWidth={2} />
                </button>
              </>
            )}

            {/* Hairline progress at bottom */}
            {banners.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground/10 z-10">
                <motion.div
                  key={currentIndex}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className="h-full bg-foreground/70"
                />
              </div>
            )}
          </div>

          {/* Minimal pill indicators below — matches site's clean rounded UI */}
          {banners.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-3 md:mt-4">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`transition-all duration-500 rounded-full ${
                    index === currentIndex
                      ? 'w-7 md:w-9 h-1.5 bg-foreground'
                      : 'w-1.5 h-1.5 bg-foreground/25 hover:bg-foreground/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
