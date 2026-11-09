import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OptimizedImage } from './OptimizedImage';

interface ShowcaseItem {
  id: string;
  title: string | null;
  image_url: string;
  product_link: string;
  display_order: number;
  is_active: boolean;
}

export const LatestShowcase = () => {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    fetchShowcase();
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length]);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const updateWidth = () => setContainerWidth(el.offsetWidth);
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    window.addEventListener('resize', updateWidth);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, [loading, items.length]);

  const fetchShowcase = async () => {
    try {
      const { data, error } = await supabase
        .from('latest_showcase')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching showcase:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-3 md:py-5 bg-secondary/30">
        <div className="container mx-auto px-3 md:px-4">
          <div className="h-8 w-48 bg-secondary rounded-lg mx-auto mb-8 animate-pulse" />
          <div className="flex gap-4 justify-center overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-52 md:w-64 aspect-[3/4] bg-secondary rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  // Triple the array for seamless infinite loop
  const displayItems = [...items, ...items, ...items];
  const centerOffset = items.length;

  // Card dimensions (must match the className width)
  const isMobile = containerWidth < 768;
  const cardWidth = isMobile ? 144 : 256; // w-36 = 144px, w-64 = 256px
  const gap = isMobile ? 12 : 20;         // gap-3 = 12px, gap-5 = 20px
  const slideWidth = cardWidth + gap;

  // Translate so the active card sits in the middle of the container
  const translateX =
    containerWidth / 2 - cardWidth / 2 - (currentIndex + centerOffset) * slideWidth;

  return (
    <section className="py-3 md:py-5 bg-secondary/30 overflow-hidden">
      <div className="container mx-auto px-3 md:px-4">
        {/* Section Header — matches Category style */}
        <motion.div
          className="flex flex-col items-center text-center mb-2.5 md:mb-4"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="h-px w-6 md:w-10 bg-gradient-to-r from-transparent to-primary" />
            <p className="text-[10px] md:text-xs font-semibold tracking-[0.25em] text-primary uppercase">
              Editorial Picks
            </p>
            <span className="h-px w-6 md:w-10 bg-gradient-to-l from-transparent to-primary" />
          </div>
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground tracking-tight">
            Latest Showcase
          </h2>
        </motion.div>

        {/* Carousel */}
        <div
          className="relative py-6 md:py-10"
          ref={containerRef}
          style={{
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
            maskImage:
              'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
          }}
        >
          <motion.div
            className="flex gap-3 md:gap-5"
            animate={{ x: translateX }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {displayItems.map((item, index) => {
              const realIndex = index % items.length;
              const isCurrent = realIndex === currentIndex;

              return (
                <Link
                  key={`${item.id}-${index}`}
                  to={item.product_link}
                  className="flex-shrink-0 w-36 md:w-64 group"
                >
                  <motion.div
                    className="relative aspect-[3/4] rounded-2xl overflow-hidden"
                    animate={{
                      scale: isCurrent ? 1 : 0.85,
                      opacity: isCurrent ? 1 : 0.5,
                    }}
                    transition={{ duration: 0.5 }}
                    style={{
                      boxShadow: isCurrent
                        ? '0 20px 50px rgba(0,0,0,0.28)'
                        : '0 5px 15px rgba(0,0,0,0.08)',
                    }}
                    >
                      <OptimizedImage
                        src={item.image_url}
                        alt={item.title || 'Showcase'}
                        aspectRatio="auto"
                        width={500}
                        containerClassName="absolute inset-0 w-full h-full"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />


                      {/* Glass Shine Effect */}
                      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                        <div 
                          className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-25deg] transition-transform duration-[800ms] ease-in-out group-hover:translate-x-[400%]"
                        />
                      </div>


                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5">
                      {item.title && (
                        <h3 className="text-white font-bold text-sm md:text-lg mb-1 drop-shadow-lg">
                          {item.title}
                        </h3>
                      )}
                      <div className="flex items-center gap-1 text-white/90 text-xs md:text-sm font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        Shop Now <ArrowRight size={14} />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>
        </div>

        {/* Dots — outside mask so they stay visible */}
        {items.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? 'w-6 h-2 bg-primary'
                    : 'w-2 h-2 bg-primary/30 hover:bg-primary/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
