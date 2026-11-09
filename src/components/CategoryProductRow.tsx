import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { LatestPosterCard } from '@/components/LatestPosterCard';
import { Product } from '@/types/product';
import { OptimizedImage } from './OptimizedImage';

interface Props {
  title: string;
  slug: string;
  bannerImage?: string | null;
  items: Product[];
  onQuickView: (p: Product) => void;
}

export const CategoryProductRow = ({ title, slug, bannerImage, items, onQuickView }: Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: false, slidesToScroll: 2 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', () => {
      setScrollSnaps(emblaApi.scrollSnapList());
      setSelectedIndex(emblaApi.selectedScrollSnap());
    });
    onSelect();
  }, [emblaApi, items.length]);

  return (
    <section className="py-3 md:py-5 bg-background">
      <div className="container mx-auto px-3 md:px-4">
        <div className="flex items-end justify-between mb-3 md:mb-4 pb-2 border-b border-border">
          <h2 className="font-heading text-xl md:text-3xl font-bold text-foreground tracking-tight">
            {title}
          </h2>
          <Link
            to={`/category/${slug}`}
            className="text-xs md:text-sm font-semibold text-emerald-600 bg-white border border-emerald-500 rounded-md px-4 py-1.5 hover:bg-emerald-50 transition-colors"
          >
            View All
          </Link>
        </div>

        <div className="flex gap-2 md:gap-3">
          {/* Banner image — desktop only, ~2 card widths, 3:4 portrait, shine hover */}
          {bannerImage && (
            <Link
              to={`/category/${slug}`}
              className="hidden lg:block flex-[0_0_calc(20%-0.6rem)] xl:flex-[0_0_calc(16.6667%-0.6rem)] self-stretch relative overflow-hidden border border-border group shadow-sm my-2"
            >
              <OptimizedImage
                src={bannerImage}
                alt={title}
                aspectRatio="auto"
                width={800}
                containerClassName="absolute inset-0 w-full h-full"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Glass Shine Effect */}
              <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                <div 
                  className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-25deg] transition-transform duration-[800ms] ease-in-out group-hover:translate-x-[400%]"
                />
              </div>
            </Link>
          )}

          {/* Product slider */}
          <div className="flex-1 min-w-0 overflow-hidden -mx-1 py-2" ref={emblaRef}>
            <div className="flex">
              {items.map((product) => (
                <div
                  key={product.id}
                  className={`flex-[0_0_50%] md:flex-[0_0_33.3333%] ${
                    bannerImage ? 'lg:flex-[0_0_20%] xl:flex-[0_0_16.6667%]' : 'lg:flex-[0_0_20%] xl:flex-[0_0_16.6667%]'
                  } min-w-0 px-1`}
                >
                  <LatestPosterCard product={product} onQuickView={onQuickView} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {scrollSnaps.length > 1 && (
          <div className="mt-4 flex justify-center items-center gap-1.5 flex-wrap">
            {scrollSnaps.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all rounded-full ${
                  i === selectedIndex
                    ? 'w-2.5 h-2.5 bg-foreground'
                    : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
