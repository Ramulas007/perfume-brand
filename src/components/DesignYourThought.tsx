import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useDesignYourThought } from '@/hooks/useDesignYourThought';
import { OptimizedImage } from './OptimizedImage';

export const DesignYourThought = () => {
  const { settings, loading } = useDesignYourThought();

  if (loading || !settings.enabled) return null;

  const link = settings.primary_button_link || settings.secondary_button_link || '/shop';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Link to={link} className="group block">
        <div className="relative overflow-hidden aspect-[3/1] md:aspect-[6/1] bg-muted shadow-md hover:shadow-xl transition-all duration-500">
          {settings.image_url ? (
            <OptimizedImage
              src={settings.image_url}
              alt="Custom Product"
              aspectRatio="banner"
              width={1200}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
          )}

          <div className="absolute bottom-0 left-0 bg-white rounded-tr-lg shadow-lg pt-1 pr-1 pl-0 pb-0">
            <div className="bg-black text-white text-sm md:text-base font-semibold px-4 py-2 rounded-md whitespace-nowrap">
              Custom Product
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
