import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Product, isCustomProduct, resolveProductBadge } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { OptimizedImage } from './OptimizedImage';
import { Button } from '@/components/ui/button';
import { ArrowDotsButton } from '@/components/ui/arrow-dots-button';

interface LatestPosterCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const LatestPosterCard = ({ product, onQuickView }: LatestPosterCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const isMobile = window.innerWidth < 768;
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
  

  const hasOptions = (product.sizes && product.sizes.length > 0) || (product.colors && product.colors.length > 0);

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView(product);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasOptions) {
      onQuickView(product);
    } else {
      addToCart(product, 1);
      toast.success(`${product.name} has been added to your cart.`);
    }
  };

  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasOptions) {
      onQuickView(product);
    } else {
      addToCart(product, 1);
      navigate('/checkout');
    }
  };

  const badge = resolveProductBadge(product);
  const isOut = (product.stockQuantity ?? 0) <= 0 || product.inStock === false;

  return (
    <div 
      ref={cardRef}
      className="group bg-card rounded-lg overflow-hidden border border-transparent hover:border-black transition-all duration-500 h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      <Link to={isCustomProduct(product) ? '/customize' : `/product/${product.id}`} className="block relative">
        <div className="relative aspect-square overflow-hidden bg-transparent">
          <OptimizedImage
            src={product.image}
            alt={product.name}
            aspectRatio="square"
            width={400}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${product.supplementaryImages?.[0] ? 'group-hover:opacity-0' : ''} ${isOut ? 'opacity-70' : ''}`}
          />
          {product.supplementaryImages?.[0] && (
            <OptimizedImage
              src={product.supplementaryImages[0]}
              alt={product.name}
              aspectRatio="square"
              width={400}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}

          {/* Glass Shine Effect */}
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
            <div 
              className={`absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-25deg] transition-transform duration-[800ms] ease-in-out ${isHovered ? 'translate-x-[400%]' : ''}`}
            />
          </div>
          {badge && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <span
                className="text-[10px] md:text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm text-white tracking-wide"
                style={{ backgroundColor: badge.color }}
              >
                {badge.label}
              </span>
            </div>
          )}

          {/* Hover icons — top right */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <button
              onClick={handleQuickView}
              aria-label="Quick view"
              className="w-9 h-9 rounded-full bg-background flex items-center justify-center shadow-md hover:scale-110 transition-transform"
            >
              <Eye size={16} className="text-foreground" />
            </button>
          </div>
        </div>
      </Link>

      <div className="p-3 md:p-4 flex flex-col flex-1">
        <Link to={isCustomProduct(product) ? '/customize' : `/product/${product.id}`}>
          <h3 className="font-heading text-xs md:text-sm font-semibold text-foreground line-clamp-2 leading-snug capitalize tracking-wide min-h-[2.25rem] md:min-h-[2.5rem]">
            {product.name.toLowerCase()}
          </h3>
        </Link>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-foreground font-bold text-sm md:text-base">৳ {product.price}</span>
          {product.originalPrice && (
            <span className="text-red-600 text-xs line-through">৳ {product.originalPrice}</span>
          )}
        </div>

        <div className={`mt-3 md:mt-4 w-full h-9 grid gap-2 ${isNarrow ? 'grid-cols-[1fr_36px]' : 'grid-cols-2'}`}>
          <ArrowDotsButton
            onClick={handleOrderNow}
            disabled={isOut}
            label={isOut ? 'Out of Stock' : 'Order Now'}
            className="b05-sm w-full"
          />
          
          
          <Button
            onClick={handleAdd}
            disabled={isOut}
            aria-label="Add to cart"
            size={isNarrow ? "icon" : "default"}
            className="w-full h-9 rounded-[4px] flex items-center justify-center bg-secondary text-foreground hover:bg-secondary/80 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-50 group/btn2 relative overflow-hidden"
          >
            {isNarrow ? (
              <span className="text-xl font-medium leading-none transition-transform group-hover/btn2:rotate-90 duration-300">+</span>
            ) : (
              <span className="relative z-10 whitespace-nowrap text-xs font-semibold">Add To Cart</span>
            )}
            <span className="pointer-events-none hidden md:block absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover/btn2:translate-x-full transition-transform duration-700 ease-out" />
          </Button>
        </div>
      </div>
    </div>
  );
};