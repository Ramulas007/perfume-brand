import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Product, isCustomProduct, resolveProductBadge } from '@/types/product';
import { useCart } from '@/context/CartContext';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowDotsButton } from '@/components/ui/arrow-dots-button';
import { useToast } from '@/hooks/use-toast';
import { OptimizedImage } from './OptimizedImage';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const ProductCard = ({ product, onQuickView }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const isMobile = window.innerWidth < 768;
        // Threshold: 210px is roughly where "Add To Cart" might start to feel cramped or overflow
        setIsNarrow(isMobile || entry.contentRect.width < 210);
      }
    });

    observer.observe(cardRef.current);
    
    // Initial check
    const isMobile = window.innerWidth < 768;
    setIsNarrow(isMobile || (cardRef.current?.offsetWidth || 0) < 210);

    return () => observer.disconnect();
  }, []);

  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const { user } = useAuth();
  const { toast } = useToast();

  
  const hasOptions =
    (product.sizes && product.sizes.length > 0) ||
    (product.colors && product.colors.length > 0) ||
    (product.volumes && product.volumes.length > 0);
  const badge = resolveProductBadge(product);
  const isOut = (product.stockQuantity ?? 0) <= 0 || product.inStock === false;

  const handleAddToCart = () => {
    if (hasOptions) {
      onQuickView(product);
    } else {
      addToCart(product, 1);
      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
      });
    }
  };

  const handleOrderNow = () => {
    if (hasOptions) {
      navigate(isCustomProduct(product) ? '/customize' : `/product/${product.id}`);
    } else {
      // Add to cart first, then navigate after a small delay to ensure state updates
      addToCart(product, 1);
      setTimeout(() => {
        navigate('/checkout');
      }, 100);
    }
  };


  return (
    <motion.div
      ref={cardRef}
      className="card-product group relative"
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest('a, button')) return;
        navigate(isCustomProduct(product) ? '/customize' : `/product/${product.id}`);
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container */}
      <Link to={isCustomProduct(product) ? '/customize' : `/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-transparent rounded-t-md">
          <OptimizedImage
            src={product.image}
            alt={product.name}
            aspectRatio="square"
            width={400}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${product.supplementaryImages?.[0] && isHovered ? 'opacity-0' : 'opacity-100'} ${isOut ? 'grayscale-[0.4]' : ''}`}
          />
          {product.supplementaryImages?.[0] && (
            <OptimizedImage
              src={product.supplementaryImages[0]}
              alt={product.name}
              aspectRatio="square"
              width={400}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
          {/* Glass Shine Effect */}
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
            <div 
              className={`absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-25deg] transition-transform duration-[800ms] ease-in-out ${isHovered ? 'translate-x-[400%]' : ''}`}
            />
          </div>

          {/* Single badge — Out of Stock overrides everything */}
          {badge && (
            <div className="absolute top-2 left-2 z-10">
              <span
                className="text-[10px] md:text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm text-white tracking-wide"
                style={{ backgroundColor: badge.color }}
              >
                {badge.label}
              </span>
            </div>
          )}

          {/* Hover actions */}
          <div
            className={`absolute top-2 right-2 flex flex-col gap-1.5 transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}
          >
            <motion.button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="p-1.5 md:p-2 bg-background/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-background hover:scale-110 transition-all duration-300"
              whileTap={{ scale: 0.9 }}
            >
              <Eye size={14} className="md:w-4 md:h-4" />
            </motion.button>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-2 md:p-4">
        <Link to={isCustomProduct(product) ? '/customize' : `/product/${product.id}`}>
          <h3 className="font-medium text-foreground line-clamp-2 mb-0.5 md:mb-1 text-xs md:text-sm leading-tight hover:text-primary transition-colors capitalize">
            {product.name}
          </h3>
        </Link>
        {product.brand && (
          <p className="text-[10px] md:text-xs text-muted-foreground mb-1 truncate">
            {product.brand} · {product.gender || 'Unisex'}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center gap-1 mb-2 md:mb-3">
          <span className="price-sale text-sm md:text-lg font-bold">৳ {product.price}</span>
          {product.originalPrice && (
            <span className="text-xs md:text-sm line-through text-red-600">৳ {product.originalPrice}</span>
          )}
        </div>

        {/* Buttons */}
        <div className={`mt-2 md:mt-3 w-full h-9 grid gap-2 ${isNarrow ? 'grid-cols-[1fr_36px]' : 'grid-cols-2'}`}>
          <ArrowDotsButton
            onClick={handleOrderNow}
            disabled={isOut}
            label={isOut ? 'Out of Stock' : 'Order Now'}
            className="b05-sm w-full"
          />
          
          <Button
            onClick={handleAddToCart}
            disabled={isOut}
            aria-label="Add to cart"
            size={isNarrow ? "icon" : "default"}
            className="w-full h-9 rounded-[6px] flex items-center justify-center bg-secondary text-foreground hover:bg-secondary/80 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-50 group/btn2 relative overflow-hidden"
          >
            {isNarrow ? (
              <span className="text-lg font-medium leading-none transition-transform group-hover/btn2:rotate-90 duration-300">+</span>
            ) : (
              <span className="relative z-10 whitespace-nowrap text-xs">Add To Cart</span>
            )}
            <span className="pointer-events-none hidden md:block absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover/btn2:translate-x-full transition-transform duration-700 ease-out" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
