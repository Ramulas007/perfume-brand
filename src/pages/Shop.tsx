import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { Filter, Search, X, SlidersHorizontal, ArrowDownUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSidebar } from '@/components/CartSidebar';


import { ProductCard } from '@/components/ProductCard';
import { ProductQuickView } from '@/components/ProductQuickView';
import { ProductFilter, FilterState } from '@/components/ProductFilter';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/SEO';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug: routeSlug } = useParams<{ slug?: string }>();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'newest'>('featured');
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    colors: [],
    sizes: [],
    volumes: [],
    priceRange: [0, 10000],
  });

  const { products, categories, loading } = useProducts();

  // Get unique filter options from database products
  const filterOptions = useMemo(() => {
    const categoryNames = categories.map(c => c.name);
    const allColors = new Set<string>();
    const allSizes = new Set<string>();
    const allVolumes = new Set<string>();
    let maxPrice = 2000;

    products.forEach(p => {
      if (p.colors) p.colors.forEach(c => allColors.add(c));
      if (p.sizes) p.sizes.forEach(s => allSizes.add(s));
      if (p.volumes) p.volumes.forEach((volume) => allVolumes.add(volume.value));
      if (p.price > maxPrice) maxPrice = p.price;
    });

    return {
      categories: categoryNames,
      colors: Array.from(allColors),
      sizes: Array.from(allSizes),
      volumes: Array.from(allVolumes),
      maxPrice: Math.ceil(maxPrice / 100) * 100,
    };
  }, [products, categories]);

  // Sync search query and category filter from URL
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlCategory = routeSlug || searchParams.get('category');

    if (urlSearch) {
      setSearchQuery(urlSearch);
    }

    if (urlCategory) {
      const matchedCategory = categories.find(
        c => c.slug === urlCategory || c.name.toLowerCase() === urlCategory.toLowerCase()
      );
      if (matchedCategory) {
        setFilters(prev => ({
          ...prev,
          categories: [matchedCategory.name]
        }));
      }
    }
  }, [searchParams, categories, routeSlug]);

  const activeCategoryName = useMemo(() => {
    if (!routeSlug) return null;
    return categories.find(c => c.slug === routeSlug)?.name || routeSlug;
  }, [routeSlug, categories]);

  // Sub-category navigation: if current route is a MAIN category, show its children as chips
  const currentCategory = useMemo(
    () => (routeSlug ? categories.find(c => c.slug === routeSlug) : null),
    [routeSlug, categories],
  );
  const subCategoriesOfCurrent = useMemo(() => {
    if (!currentCategory || currentCategory.parent_id) return [];
    return categories.filter(c => c.parent_id === currentCategory.id);
  }, [currentCategory, categories]);
  const [activeSubSlug, setActiveSubSlug] = useState<string | null>(null);

  useEffect(() => {
    setActiveSubSlug(null);
  }, [routeSlug]);

  // For a main category route: aggregate products from main + all sub-categories
  const categoryScopedProducts = useMemo(() => {
    if (!currentCategory) return products;
    const allowedIds = new Set<string>([currentCategory.id]);
    if (!currentCategory.parent_id) {
      categories.filter(c => c.parent_id === currentCategory.id).forEach(c => allowedIds.add(c.id));
    }
    let scoped = products.filter(p => p.categoryId && allowedIds.has(p.categoryId));
    if (activeSubSlug) {
      const sub = categories.find(c => c.slug === activeSubSlug);
      if (sub) scoped = scoped.filter(p => p.categoryId === sub.id);
    }
    return scoped;
  }, [currentCategory, categories, products, activeSubSlug]);

  const filteredProducts = useMemo(() => {
    const filtered = categoryScopedProducts.filter((product) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        if (!matchesName && !matchesCategory) return false;
      }
      if (!routeSlug && filters.categories.length > 0 && !filters.categories.includes(product.category)) return false;
      if (filters.colors.length > 0) {
        const hasMatchingColor = product.colors?.some((color) =>
          filters.colors.some((fc) => color.toLowerCase().includes(fc.toLowerCase()))
        );
        if (!hasMatchingColor) return false;
      }
      if (filters.sizes.length > 0) {
        const hasMatchingSize = product.sizes?.some((size) => filters.sizes.includes(size));
        if (!hasMatchingSize) return false;
      }
      if (filters.volumes.length > 0) {
        const hasMatchingVolume = product.volumes?.some((volume) => filters.volumes.includes(volume.value));
        if (!hasMatchingVolume) return false;
      }
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'newest') return (b.id.localeCompare(a.id));
      return 0;
    });
  }, [filters, searchQuery, categoryScopedProducts, routeSlug, sortBy]);

  const activeFiltersCount =
    filters.categories.length +
    filters.colors.length +
    filters.sizes.length +
    filters.volumes.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < filterOptions.maxPrice ? 1 : 0);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
  };

  const seoTitle = activeCategoryName
    ? `${activeCategoryName} | Helpful Perfumes BD`.slice(0, 60)
    : 'Shop Premium Perfumes | Helpful Perfumes Bangladesh';
  const seoDesc = activeCategoryName
    ? `Shop ${activeCategoryName} at Helpful Perfumes. Premium quality ${activeCategoryName.toLowerCase()} with fast delivery across Bangladesh, COD, bKash & Nagad.`
    : 'Browse our catalog of premium perfumes. Filter by fragrance category and price with nationwide delivery across Bangladesh.';
  const seoPath = routeSlug ? `/category/${routeSlug}` : '/shop';

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={seoTitle}
        description={seoDesc}
        path={seoPath}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: activeCategoryName || 'Helpful Perfumes Shop',
          description: seoDesc,
          url: `https://staticvibes.lovable.app${seoPath}`,
        }}
      />
      <Header />
      <main className="flex-1 bg-secondary/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h1 className="font-heading text-3xl font-semibold">
              {searchQuery
                ? `Search: "${searchQuery}"`
                : activeCategoryName
                  ? activeCategoryName
                  : filters.categories.length === 1
                    ? filters.categories[0]
                    : 'All Products'}
            </h1>
            
            <div className="flex items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 md:w-64">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-8"
                />
                {searchQuery && (
                  <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                )}
              </div>
              
              {/* Filter toggle button - visible on ALL screens */}
              <Button
                variant={isFilterOpen ? 'default' : 'outline'}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="gap-2 flex-shrink-0"
              >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </div>
          </div>


          {/* Subcategory selection grid: when a main category has children and user hasn't chosen "view all" */}
          {subCategoriesOfCurrent.length > 0 && searchParams.get('view') !== 'all' ? (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-muted-foreground text-sm">
                  Choose a sub-category from <span className="font-medium text-foreground">{currentCategory?.name}</span>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchParams({ view: 'all' })}
                >
                  View all products
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {subCategoriesOfCurrent.map((sc) => (
                  <Link key={sc.id} to={`/category/${sc.slug}`} className="group block">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-secondary/50 border border-border relative">
                      {sc.image_url ? (
                        <img
                          src={sc.image_url}
                          alt={sc.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-heading text-muted-foreground">
                          {sc.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-white font-medium text-sm md:text-base text-center">
                          {sc.name}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}



          <div className={`flex gap-8 ${subCategoriesOfCurrent.length > 0 && searchParams.get('view') !== 'all' ? 'hidden' : ''}`}>
            {/* Sidebar Filter - conditionally shown */}
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 288, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hidden lg:block flex-shrink-0 overflow-hidden"
                >
                  <ProductFilter
                    isOpen={true}
                    onClose={() => setIsFilterOpen(false)}
                    filters={filters}
                    onFiltersChange={setFilters}
                    categoryOptions={filterOptions.categories}
                    colorOptions={filterOptions.colors}
                    sizeOptions={filterOptions.sizes}
                    volumeOptions={filterOptions.volumes}
                    maxPrice={filterOptions.maxPrice}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Filter */}
            <AnimatePresence>
              {isFilterOpen && (
                <div className="lg:hidden">
                  <ProductFilter
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    filters={filters}
                    onFiltersChange={setFilters}
                    categoryOptions={filterOptions.categories}
                    colorOptions={filterOptions.colors}
                    sizeOptions={filterOptions.sizes}
                    volumeOptions={filterOptions.volumes}
                    maxPrice={filterOptions.maxPrice}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-square w-full rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg">
                    {products.length === 0 ? 'No products available yet.' : 'No products match your filters.'}
                  </p>
                  {products.length > 0 && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setFilters({ categories: [], colors: [], sizes: [], volumes: [], priceRange: [0, filterOptions.maxPrice] })}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <p className="text-muted-foreground">
                      Showing {filteredProducts.length} products
                    </p>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ArrowDownUp size={15} />
                      <span className="sr-only">Sort products</span>
                      <select
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                        className="h-9 rounded-md border border-border bg-background px-2 text-foreground"
                      >
                        <option value="featured">Featured</option>
                        <option value="newest">Newest</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                      </select>
                    </label>
                  </div>
                  <motion.div
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6"
                  >
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onQuickView={setQuickViewProduct}
                      />
                    ))}
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>

        <ProductQuickView
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      </main>
      <CartSidebar />
      <Footer />
      
    </div>
  );
};

export default Shop;
