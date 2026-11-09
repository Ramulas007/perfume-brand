import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { products } from '@/data/products';
import { Product, isCustomProduct } from '@/types/product';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchBar = ({ isOpen, onClose }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );

    setResults(filtered.slice(0, 6));
  }, [query]);

  const handleProductClick = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product && isCustomProduct(product)) {
      navigate('/customize');
    } else {
      navigate(`/product/${productId}`);
    }
    onClose();
    setQuery('');
  };

  const handleViewAll = () => {
    navigate(`/shop?search=${encodeURIComponent(query)}`);
    onClose();
    setQuery('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/50 z-50"
          />

          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 bg-background z-50 shadow-lg"
          >
            <div className="container mx-auto px-4 py-4">
              {/* Search Input */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-12 pr-4 py-3 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Search Results */}
              {results.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {results.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="flex flex-col cursor-pointer group"
                      >
                        <div className="aspect-square bg-secondary rounded-lg overflow-hidden mb-2">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-primary font-semibold text-sm">
                          ৳ {product.price}
                        </p>
                      </div>
                    ))}
                  </div>

                  {results.length >= 6 && (
                    <button
                      onClick={handleViewAll}
                      className="w-full mt-4 py-2 text-center text-primary hover:underline"
                    >
                      View all results for "{query}"
                    </button>
                  )}
                </div>
              )}

              {query.length >= 2 && results.length === 0 && (
                <div className="mt-4 border-t border-border pt-4 text-center text-muted-foreground py-8">
                  No products found for "{query}"
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
