import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useCategories } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { OptimizedImage } from './OptimizedImage';

export const CategorySection = () => {
  const { categories, loading } = useCategories();

  if (loading) {
    return (
      <section className="py-3 md:py-5">
        <div className="container mx-auto px-3 md:px-4">
          <Skeleton className="h-8 w-48 mb-5 mx-auto" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/2] rounded-xl md:rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  const visibleCategories = categories.filter(c => !c.parent_id).slice(0, 12);

  return (
    <section className="py-3 md:py-5 relative">
      <div className="container mx-auto px-3 md:px-4 relative z-10">
        <motion.div
          className="flex flex-col items-center text-center mb-4 md:mb-6"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground tracking-tight">
            Shop by Category
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {visibleCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
            >
              <Link to={category.name === 'Custom Products' || category.slug === 'custom-products' ? '/customize' : `/category/${category.slug}`} className="group block">
                <div className="relative overflow-hidden aspect-[3/2] bg-muted shadow-md hover:shadow-xl transition-all duration-500 flex items-center justify-center">
                  {category.image_url ? (
                    <OptimizedImage
                      src={category.image_url}
                      alt={category.name}
                      aspectRatio="auto"
                      width={600}
                      containerClassName="w-full h-full bg-transparent"
                      className="w-full h-full object-contain transition-none"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <span className="text-5xl font-bold text-primary/30">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 bg-white rounded-tr-lg shadow-lg pt-1 pr-1 pl-0 pb-0">
                    <h3 className="bg-black text-white text-xs md:text-sm font-semibold px-3 py-1 md:py-1.5 rounded-md whitespace-nowrap m-0">

                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>


        <div className="md:hidden mt-5 flex justify-center">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            View All Categories <ArrowUpRight size={14} />
          </Link>
        </div>

      </div>
    </section>
  );
};
