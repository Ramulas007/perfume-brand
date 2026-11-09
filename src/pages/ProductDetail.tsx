import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Star, ShoppingCart, ZoomIn, X, ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Product, isCustomProduct } from '@/types/product';
import { useCart } from '@/context/CartContext';

import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSidebar } from '@/components/CartSidebar';


import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { trackViewContent } from '@/lib/metaPixel';
import { SEO } from '@/components/SEO';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ArrowDotsButton } from '@/components/ui/arrow-dots-button';
import { getLocalPerfumeVariants, isLocalPerfumeCatalogEnabled } from '@/data/perfumeCatalog';

// ─── Lightbox Component ──────────────────────────────────────────────────────
const Lightbox = ({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) => {
  const [current, setCurrent] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + images.length) % images.length);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % images.length);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [images.length]);

  const toggleZoom = () => {
    if (zoom > 1) { setZoom(1); setPan({ x: 0, y: 0 }); }
    else setZoom(2.5);
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/95 backdrop-blur-md"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
          <span className="text-primary-foreground/70 text-sm font-medium">
            {current + 1} / {images.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleZoom}
              className={`p-2 rounded-xl text-sm font-medium transition-all ${zoom > 1 ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-destructive hover:text-destructive-foreground transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main image */}
        <div
          className={`relative w-full h-full flex items-center justify-center overflow-hidden ${zoom > 1 ? 'cursor-grab' : 'cursor-zoom-in'} ${isDragging ? 'cursor-grabbing' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={zoom <= 1 ? toggleZoom : undefined}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.2 }}
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transition: isDragging ? 'none' : 'transform 0.3s ease',
                maxHeight: '85vh',
                maxWidth: '90vw',
                userSelect: 'none',
              }}
              className="flex items-center justify-center w-full h-full"
            >
              <OptimizedImage
                src={images[current]}
                alt={`View ${current + 1}`}
                priority={true}
                className="object-contain"
                containerClassName="bg-transparent"
                width={1200}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-all backdrop-blur-sm"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-all backdrop-blur-sm"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-2xl">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); setZoom(1); setPan({ x: 0, y: 0 }); }}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-primary scale-110' : 'border-white/20 opacity-60 hover:opacity-100'}`}
              >
                <OptimizedImage src={img} alt="" className="w-full h-full object-contain" width={100} />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [baseImages, setBaseImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedVolume, setSelectedVolume] = useState('');
  const [variants, setVariants] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { addToCart } = useCart();
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { products: allProducts, loading: productsLoading } = useProducts();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      if (isLocalPerfumeCatalogEnabled() && productsLoading) return;
      try {
        setLoading(true);
        if (isLocalPerfumeCatalogEnabled()) {
          const localProduct = allProducts.find((item) => item.id === id);
          if (!localProduct) {
            setProduct(null);
            return;
          }
          const localVariants = getLocalPerfumeVariants(localProduct);
          setProduct(localProduct);
          setVariants(localVariants);
          setSelectedSize('');
          setSelectedColor('');
          setSelectedVolume(localVariants[0]?.value || '');
          setBaseImages([localProduct.image]);
          trackViewContent({
            content_ids: [localProduct.id],
            content_name: localProduct.name,
            value: localProduct.price,
          });
          return;
        }
        const [productRes, variantRes] = await Promise.all([
          supabase.from('products').select('*, categories(name)').eq('id', id).maybeSingle(),
          (supabase as any).from('product_variants').select('*').eq('product_id', id).order('display_order'),
        ]);
        if (productRes.error) throw productRes.error;
        const productData: any = productRes.data;
        if (productData) {
          const computedDiscount =
            productData.discount ??
            (productData.original_price && productData.original_price > productData.price
              ? Math.round(((productData.original_price - productData.price) / productData.original_price) * 100)
              : undefined);
          const transformed: Product = {
            id: productData.id,
            name: productData.name,
            price: productData.price,
            originalPrice: productData.original_price ?? undefined,
            discount: computedDiscount,
            image: productData.image_url || '/placeholder.svg',
            supplementaryImages: productData.supplementary_images ?? undefined,
            category: (productData.categories as any)?.name || 'Uncategorized',
            colors: productData.colors ?? undefined,
            sizes: productData.sizes ?? undefined,
            sku: productData.sku ?? undefined,
            inStock: productData.in_stock ?? true,
            stockQuantity: productData.stock_quantity ?? undefined,
            badgeText: productData.badge_text ?? null,
            badgeColor: productData.badge_color ?? null,
            enableSizes: productData.enable_sizes ?? false,
            enableColors: productData.enable_colors ?? false,
            enableVolumes: productData.enable_volumes ?? false,
            description: productData.description ?? undefined,
            highlights: productData.highlights ?? undefined,
            features: productData.features ?? undefined,
            care_instructions: productData.care_instructions ?? productData.care_info ?? undefined,
            delivery_info: productData.delivery_info ?? undefined,
          } as any;
          setProduct(transformed);
          if (isCustomProduct(transformed)) {
            navigate('/customize');
            return;
          }
          const vs = (variantRes as any)?.data || [];
          setVariants(vs);
          setSelectedSize(transformed.sizes?.[0] || '');
          setSelectedColor(transformed.colors?.[0] || '');
          setSelectedVolume('');
          const imgs = [transformed.image];
          if (transformed.supplementaryImages) imgs.push(...transformed.supplementaryImages);
          setBaseImages(imgs);
          trackViewContent({
            content_ids: [transformed.id],
            content_name: transformed.name,
            value: transformed.price,
          });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, allProducts, productsLoading]);

  // Derive size/color/volume options from variants if present, else fall back to legacy arrays
  const sizeVariants = variants.filter((v) => v.variant_type === 'size');
  const colorVariants = variants.filter((v) => v.variant_type === 'color');
  const volumeVariants = variants.filter((v) => v.variant_type === 'volume');

  const availableSizes = sizeVariants.length > 0 ? sizeVariants.map((v) => v.value) : product?.sizes || [];
  const availableColors = colorVariants.length > 0 ? colorVariants.map((v) => v.value) : product?.colors || [];
  const availableVolumes = volumeVariants.length > 0
    ? volumeVariants.map((v) => v.value)
    : product?.volumes?.map((volume) => volume.value) || [];

  const getVolumePrice = (value: string) => {
    const catalogVolume = product?.volumes?.find((volume) => volume.value === value);
    if (catalogVolume?.price != null) return Number(catalogVolume.price);
    const variant = volumeVariants.find((volume) => volume.value === value);
    return Number(variant?.sale_price ?? variant?.price ?? product?.price ?? 0);
  };

  // Compute active images: if selected color or volume has image_urls, use them; else base
  const allImages = useMemo(() => {
    const colorV = colorVariants.find((v) => v.value === selectedColor);
    const volumeV = volumeVariants.find((v) => v.value === selectedVolume);
    if (volumeV?.image_urls && volumeV.image_urls.length > 0) return volumeV.image_urls;
    if (colorV?.image_urls && colorV.image_urls.length > 0) return colorV.image_urls;
    return baseImages;
  }, [selectedColor, selectedVolume, colorVariants, volumeVariants, baseImages]);

  useEffect(() => {
    setSelectedImage(0);
  }, [allImages]);

  // Compute effective price from selected variant (priority: volume > color > size > product)
  const effectivePrice = useMemo(() => {
    if (!product) return 0;
    const vol = volumeVariants.find((v) => v.value === selectedVolume);
    const catalogVolumePrice = selectedVolume ? getVolumePrice(selectedVolume) : 0;
    if (selectedVolume && catalogVolumePrice > 0) return catalogVolumePrice;
    if (vol?.sale_price ?? vol?.price) return vol.sale_price ?? vol.price;
    const col = colorVariants.find((v) => v.value === selectedColor);
    if (col?.sale_price ?? col?.price) return col.sale_price ?? col.price;
    const sz = sizeVariants.find((v) => v.value === selectedSize);
    if (sz?.sale_price ?? sz?.price) return sz.sale_price ?? sz.price;
    return product.price;
  }, [product, selectedSize, selectedColor, selectedVolume, sizeVariants, colorVariants, volumeVariants]);

  // Compute effective stock based on selected variant
  const effectiveStock = useMemo(() => {
    if (!product) return 0;
    const vol = volumeVariants.find((v) => v.value === selectedVolume);
    if (vol) return vol.stock_quantity ?? 0;
    const col = colorVariants.find((v) => v.value === selectedColor);
    if (col) return col.stock_quantity ?? 0;
    const sz = sizeVariants.find((v) => v.value === selectedSize);
    if (sz) return sz.stock_quantity ?? 0;
    return product.stockQuantity ?? (product.inStock ? 999 : 0);
  }, [product, selectedSize, selectedColor, selectedVolume, sizeVariants, colorVariants, volumeVariants]);

  const isOut = effectiveStock <= 0;

  const handleAddToCart = () => {
    if (isOut) {
      toast({ title: 'Out of stock', description: 'This variant is currently unavailable.', variant: 'destructive' });
      return;
    }
    if (product) {
      const cartProduct = effectivePrice === product.price ? product : { ...product, price: effectivePrice };
      addToCart(cartProduct, quantity, selectedSize, selectedColor, selectedVolume);
      toast({ title: 'Added to cart', description: `${product.name} added successfully.` });
    }
  };

  const handleOrderNow = () => {
    if (isOut) {
      toast({ title: 'Out of stock', description: 'This variant is currently unavailable.', variant: 'destructive' });
      return;
    }
    if (product) {
      const cartProduct = effectivePrice === product.price ? product : { ...product, price: effectivePrice };
      addToCart(cartProduct, quantity, selectedSize, selectedColor, selectedVolume);
      navigate('/checkout');
    }
  };


  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const relatedProducts = allProducts
    .filter(p => p.category === product?.category && p.id !== product?.id)
    .slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-secondary/30">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto bg-background rounded-xl p-6 md:p-8 shadow-sm">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="aspect-square bg-secondary rounded-xl animate-pulse" />
                  <div className="flex gap-2">
                    {[...Array(4)].map((_, i) => <div key={i} className="w-16 h-16 bg-secondary rounded-lg animate-pulse" />)}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-8 bg-secondary rounded animate-pulse w-3/4" />
                  <div className="h-6 bg-secondary rounded animate-pulse w-1/4" />
                  <div className="h-4 bg-secondary rounded animate-pulse w-full" />
                  <div className="h-4 bg-secondary rounded animate-pulse w-5/6" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-lg mb-4">Product not found</p>
          <Link to="/shop" className="text-primary hover:underline">Back to shop</Link>
        </div>
      </div>
    );
  }

  
  const productImage = allImages[0] || product.image;
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: productImage ? [productImage] : undefined,
    description: (product as any).description || `${product.name} from Helpful Perfumes`,
    sku: product.sku || product.id,
    brand: { '@type': 'Brand', name: 'Helpful Perfumes' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BDT',
      price: product.price,
      availability: 'https://schema.org/InStock',
      url: `https://staticvibes.lovable.app/product/${product.id}`,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`${product.name} — Helpful Perfumes Bangladesh`}
        description={((product as any).description || `Buy ${product.name} at Helpful Perfumes — premium perfumes in Bangladesh with fast nationwide delivery.`).toString().slice(0, 160)}
        path={`/product/${product.id}`}
        image={productImage}
        type="product"
        jsonLd={productLd}
      />
      {lightboxOpen && (
        <Lightbox
          images={allImages}
          initialIndex={selectedImage}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
          {/* Breadcrumb */}
          <nav className="text-xs text-muted-foreground mb-6 flex flex-wrap items-center gap-1.5">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>›</span>
            <Link to="/shop" className="hover:text-primary">Shop</Link>
            <span>›</span>
            <Link to={`/category/${encodeURIComponent(product.category)}`} className="hover:text-primary">{product.category}</Link>
            <span>›</span>
            <span className="text-foreground font-medium truncate max-w-[260px]">{product.name}</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">

            {/* ─── Image Gallery (vertical thumbs + main) ─── */}
            <div className="flex gap-3">
              {/* Vertical thumbnails */}
              {allImages.length > 1 && (
                <div className="hidden sm:flex flex-col gap-2 w-16 flex-shrink-0">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-20 rounded-md overflow-hidden border transition-all ${
                        selectedImage === i
                          ? 'border-primary ring-1 ring-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <OptimizedImage
                        src={img}
                        alt={`view ${i + 1}`}
                        className="w-full h-full object-contain"
                        width={100}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="flex-1">
                <div
                  className="relative aspect-square bg-transparent rounded-md overflow-hidden cursor-zoom-in border border-border/50"
                  onMouseMove={handleMouseMove}
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                  onClick={() => setLightboxOpen(true)}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedImage}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="w-full h-full"
                    >
                      <OptimizedImage
                        src={allImages[selectedImage] || product.image}
                        alt={product.name}
                        priority={true}
                        width={800}
                        className="w-full h-full object-contain transition-transform duration-300"
                        style={
                          isZoomed
                            ? { transform: 'scale(1.15)', transformOrigin: `${mousePos.x}% ${mousePos.y}%` }
                            : {}
                        }
                      />
                    </motion.div>
                  </AnimatePresence>
                  {product.discount && (
                    <div className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded">
                      -{product.discount}%
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
                    aria-label="Zoom image"
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-foreground shadow-md flex items-center justify-center transition"
                  >
                    <ZoomIn size={18} />
                  </button>
                </div>

                {/* Horizontal thumbs on mobile */}
                {allImages.length > 1 && (
                  <div className="flex sm:hidden gap-2 mt-3 overflow-x-auto">
                    {allImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border ${
                          selectedImage === i ? 'border-primary' : 'border-border'
                        }`}
                      >
                        <OptimizedImage src={img} alt="" className="w-full h-full object-contain" width={100} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Product Info ─── */}
            <div className="space-y-5">
              <h1 className="font-heading text-2xl md:text-3xl font-semibold text-foreground uppercase leading-tight">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-2xl font-bold text-foreground">৳ {Number(effectivePrice).toLocaleString()}</span>
                {selectedVolume && (
                  <span className="text-sm font-medium text-primary">
                    {selectedVolume} decant price
                  </span>
                )}
                {product.originalPrice && product.originalPrice > effectivePrice && (
                  <span className="text-base line-through text-muted-foreground">৳ {product.originalPrice.toLocaleString()}</span>
                )}
                {product.discount && product.discount > 0 && (
                  <span className="text-sm font-bold text-destructive">-{product.discount}% OFF</span>
                )}
              </div>

              {/* Size Chart link */}
              {availableSizes.length > 0 && (
                <button className="text-sm text-foreground underline underline-offset-2 hover:text-primary">
                  View Size Chart
                </button>
              )}

              {/* Size selector */}
              {availableSizes.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-2">Size:</span>
                  <div className="flex gap-2 flex-wrap">
                    {availableSizes.map((size) => {
                      const v = sizeVariants.find((sv) => sv.value === size);
                      const outOfStock = v && v.stock_quantity <= 0;
                      return (
                        <button
                          key={size}
                          onClick={() => !outOfStock && setSelectedSize(size)}
                          disabled={outOfStock}
                          className={`min-w-[44px] px-3 py-2 border rounded text-sm font-medium transition-all ${
                            selectedSize === size
                              ? 'bg-foreground text-background border-foreground'
                              : 'border-border hover:border-foreground'
                          } ${outOfStock ? 'opacity-40 line-through cursor-not-allowed' : ''}`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Volume selector */}
              {availableVolumes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-sm text-muted-foreground">Choose your volume:</span>
                    {selectedVolume && (
                      <span className="text-sm font-semibold text-primary">
                        {selectedVolume} · ৳ {Number(effectivePrice).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {availableVolumes.map((vol) => {
                      const v = volumeVariants.find((vv) => vv.value === vol);
                      const outOfStock = v && v.stock_quantity <= 0;
                      return (
                        <button
                          key={vol}
                          onClick={() => !outOfStock && setSelectedVolume(vol)}
                          disabled={outOfStock}
                          className={`min-w-[60px] px-3 py-2 border rounded text-sm font-medium transition-all ${
                            selectedVolume === vol
                              ? 'bg-foreground text-background border-foreground'
                              : 'border-border hover:border-foreground'
                          } ${outOfStock ? 'opacity-40 line-through cursor-not-allowed' : ''}`}
                        >
                          <span>{vol}</span>
                          <span className="block text-[11px] font-normal opacity-80">
                            ৳ {getVolumePrice(vol).toLocaleString()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Which size should I choose?</p>
                    <p>5ml is ideal for testing, 10ml is travel-friendly, 30–50ml works for regular use, and 100ml is the best value for a signature scent.</p>
                    <p className="mt-2 text-primary">The displayed price updates to the exact price for your selected volume.</p>
                  </div>
                </div>
              )}

              {/* Color selector */}
              {availableColors.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Color:</span>
                  {availableColors.map((color) => {
                    const v = colorVariants.find((cv) => cv.value === color);
                    const hex = v?.color_hex ||
                      (color.toLowerCase() === 'olive' ? '#6b8e23'
                        : color.toLowerCase() === 'navy' ? '#1e3a5f'
                        : color.toLowerCase() === 'teal/cream' ? '#008080'
                        : color.toLowerCase());
                    const outOfStock = v && v.stock_quantity <= 0;
                    return (
                      <button
                        key={color}
                        onClick={() => !outOfStock && setSelectedColor(color)}
                        title={color}
                        disabled={outOfStock}
                        className={`w-7 h-7 rounded-full border transition-all ${
                          selectedColor === color ? 'ring-2 ring-foreground ring-offset-1' : 'border-border'
                        } ${outOfStock ? 'opacity-30' : ''}`}
                        style={{ backgroundColor: hex }}
                      />
                    );
                  })}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={isOut}
                  className="h-11 px-5 border border-border rounded text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add To Cart
                </button>
                <ArrowDotsButton
                  onClick={handleOrderNow}
                  disabled={isOut}
                  label={isOut ? 'Out of Stock' : 'Order Now'}
                />
              </div>

              {/* Meta info */}
              <div className="pt-4 border-t border-border space-y-2 text-sm">
                {product.brand && (
                  <p className="text-muted-foreground"><span className="text-foreground">Brand :</span> {product.brand}</p>
                )}
                {product.fragranceType && (
                  <p className="text-muted-foreground"><span className="text-foreground">Type :</span> {product.fragranceType}</p>
                )}
                {product.gender && (
                  <p className="text-muted-foreground"><span className="text-foreground">For :</span> {product.gender}</p>
                )}
                {product.fragranceFamily && (
                  <p className="text-muted-foreground"><span className="text-foreground">Fragrance family :</span> {product.fragranceFamily}</p>
                )}
                {product.seasons?.length && (
                  <p className="text-muted-foreground"><span className="text-foreground">Best season :</span> {product.seasons.join(', ')}</p>
                )}
                {product.occasions?.length && (
                  <p className="text-muted-foreground"><span className="text-foreground">Occasion :</span> {product.occasions.join(', ')}</p>
                )}
                {product.performance && (
                  <p className="text-muted-foreground"><span className="text-foreground">Performance :</span> {product.performance}</p>
                )}
                {product.sku && (
                  <p className="text-muted-foreground"><span className="text-foreground">SKU :</span> {product.sku}</p>
                )}
                <p className="text-muted-foreground"><span className="text-foreground">Category :</span> {product.category}</p>
                <p className="text-muted-foreground">
                  <span className="text-foreground">Availability :</span>{' '}
                  {isOut
                    ? <span className="text-destructive font-medium">Out of Stock</span>
                    : effectiveStock <= (product.lowStockThreshold ?? 5)
                      ? <span className="text-yellow-600 font-medium">Low Stock ({effectiveStock} left)</span>
                      : <span className="text-accent font-medium">In Stock</span>
                  }
                </p>
              </div>

              {/* Share */}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-foreground">Share :</span>
                <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-foreground">f</a>
                <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-foreground">𝕏</a>
                <a href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-foreground">in</a>
              </div>
            </div>
          </div>

          {/* Tabs: Description / Delivery / Video */}
          <ProductTabs product={product as any} />


          {/* Related Collections */}
          {relatedProducts.length > 0 && (
            <section className="mt-12">
              <h2 className="font-heading text-xl md:text-2xl font-semibold mb-6 pb-3 border-b border-border">
                Related Collections
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
                {relatedProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} onQuickView={() => {}} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <CartSidebar />
      <Footer />
      
    </div>
  );
};

// ─── Tabs section ──────────────────────────────────────────────────────
const ProductTabs = ({ product }: { product: any }) => {
  const [active, setActive] = useState<'description' | 'delivery' | 'care'>('description');
  const highlights: string[] = Array.isArray(product?.highlights) ? product.highlights : [];
  const features: string[] = Array.isArray(product?.features) ? product.features : [];
  const description: string = product?.description || '';
  const care: string = product?.care_instructions || product?.care_info || '';
  const delivery: string = product?.delivery_info || 'Inside Dhaka: ৳80 · Outside Dhaka: ৳130. Delivered within 2–5 business days.';

  return (
    <div className="mt-12">
      <div className="flex items-center gap-8 border-b border-border">
        {(['description', 'delivery', 'care'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`pb-3 text-sm font-medium capitalize transition-colors relative ${
              active === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
            {active === tab && <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-foreground" />}
          </button>
        ))}
      </div>
      <div className="py-6 text-sm text-muted-foreground leading-relaxed space-y-5">
        {active === 'description' && (
          <div className="space-y-5">
            {description ? (
              <p className="whitespace-pre-line">{description}</p>
            ) : (
              <p>Premium quality product, crafted with care.</p>
            )}
            {highlights.length > 0 && (
              <div>
                <h4 className="text-foreground font-semibold mb-2">Highlights</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {highlights.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </div>
            )}
            {features.length > 0 && (
              <div>
                <h4 className="text-foreground font-semibold mb-2">Features</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        {active === 'delivery' && <p className="whitespace-pre-line">{delivery}</p>}
        {active === 'care' && (
          <p className="whitespace-pre-line">{care || 'Machine wash cold. Do not bleach. Tumble dry low.'}</p>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
