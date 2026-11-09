import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { LatestPosterCard } from '@/components/LatestPosterCard';
import { CategoryProductRow } from '@/components/CategoryProductRow';
import { ProductQuickView } from '@/components/ProductQuickView';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types/product';
import { Skeleton } from '@/components/ui/skeleton';

export const ProductGrid = () => {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const { products, categories, loading, getProductsForMainCategory } = useProducts();

  const latest = useMemo(() => products.slice(0, 20), [products]);

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
  }, [emblaApi, latest.length]);

  // Group products under MAIN categories only — aggregating from all subcategories
  const productsByMainCategory = useMemo(() => {
    const mainCats = categories.filter((c) => !c.parent_id);
    return mainCats
      .filter((c) => c.slug !== 'custom-products' && c.name !== 'Custom Products')
      .map((cat) => {
        const items = getProductsForMainCategory(cat.id);
        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          image: cat.section_banner_url || cat.image_url,
          items,
        };
      })
      .filter((c) => c.items.length > 0);
  }, [categories, getProductsForMainCategory]);

  if (loading) {
    return (
      <section className="py-3 md:py-5">
        <div className="container mx-auto px-3 md:px-4">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="flex gap-3 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-44 md:w-56 rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* ====== NEW ARRIVAL ====== */}
      <section className="py-3 md:py-5 bg-gradient-to-b from-background via-secondary/20 to-background">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex items-end justify-between mb-3 md:mb-4 pb-2 border-b border-border">
            <h2 className="font-heading text-xl md:text-3xl font-bold text-foreground tracking-tight">
              New Arrival
            </h2>
            <Link
              to="/shop"
              className="text-xs md:text-sm font-semibold text-emerald-600 bg-white border border-emerald-500 rounded-md px-4 py-1.5 hover:bg-emerald-50 transition-colors"
            >
              View All
            </Link>
          </div>

          {latest.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No products yet.</p>
          ) : (
            <>
              <div className="overflow-hidden -mx-1.5 py-2" ref={emblaRef}>
                <div className="flex">
                  {latest.map((product) => (
                    <div
                      key={product.id}
                      className="flex-[0_0_50%] md:flex-[0_0_33.3333%] lg:flex-[0_0_20%] xl:flex-[0_0_16.6667%] min-w-0 px-1.5"
                    >
                      <LatestPosterCard product={product} onQuickView={setQuickViewProduct} />
                    </div>
                  ))}
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
            </>
          )}
        </div>
      </section>

      {/* ====== ONE SECTION PER MAIN CATEGORY (aggregates subcategory products) ====== */}
      {productsByMainCategory.map((cat) => (
        <CategoryProductRow
          key={cat.slug}
          title={cat.name}
          slug={cat.slug}
          bannerImage={cat.image}
          items={cat.items.slice(0, 20)}
          onQuickView={setQuickViewProduct}
        />
      ))}

      <ProductQuickView
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
};
