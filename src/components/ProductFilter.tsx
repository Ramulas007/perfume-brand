import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FilterState {
  categories: string[];
  colors: string[];
  sizes: string[];
  volumes: string[];
  priceRange: [number, number];
}

interface ProductFilterProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categoryOptions?: string[];
  colorOptions?: string[];
  sizeOptions?: string[];
  volumeOptions?: string[];
  maxPrice?: number;
}

// Color mapping for visual display
const colorMap: Record<string, string> = {
  olive: '#6b8e23',
  navy: '#1e3a5f',
  teal: '#008080',
  black: '#000000',
  white: '#ffffff',
  gray: '#808080',
  red: '#dc2626',
  blue: '#2563eb',
  green: '#16a34a',
  yellow: '#eab308',
  orange: '#ea580c',
  pink: '#ec4899',
  purple: '#9333ea',
  brown: '#92400e',
  beige: '#d2b48c',
  cream: '#fffdd0',
};

export const ProductFilter = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange,
  categoryOptions = [],
  colorOptions = [],
  sizeOptions = [],
  volumeOptions = [],
  maxPrice = 10000,
}: ProductFilterProps) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleCategoryChange = (category: string, checked: boolean) => {
    const updated = checked
      ? [...localFilters.categories, category]
      : localFilters.categories.filter(c => c !== category);
    setLocalFilters({ ...localFilters, categories: updated });
  };

  const handleColorChange = (color: string, checked: boolean) => {
    const updated = checked
      ? [...localFilters.colors, color]
      : localFilters.colors.filter(c => c !== color);
    setLocalFilters({ ...localFilters, colors: updated });
  };

  const handleSizeChange = (size: string, checked: boolean) => {
    const updated = checked
      ? [...localFilters.sizes, size]
      : localFilters.sizes.filter(s => s !== size);
    setLocalFilters({ ...localFilters, sizes: updated });
  };

  const handleVolumeChange = (volume: string, checked: boolean) => {
    const updated = checked
      ? [...localFilters.volumes, volume]
      : localFilters.volumes.filter((item) => item !== volume);
    setLocalFilters({ ...localFilters, volumes: updated });
  };

  const handlePriceChange = (value: number[]) => {
    setLocalFilters({ ...localFilters, priceRange: [value[0], value[1]] });
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const clearFilters = () => {
    const cleared: FilterState = {
      categories: [],
      colors: [],
      sizes: [],
      volumes: [],
      priceRange: [0, maxPrice],
    };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  const getColorStyle = (color: string) => {
    const lowerColor = color.toLowerCase();
    return colorMap[lowerColor] || lowerColor;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="lg:hidden fixed inset-0 bg-foreground/50 z-40"
        onClick={onClose}
      />

      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        className="fixed lg:sticky left-0 top-0 lg:top-24 h-full lg:h-auto w-72 bg-background z-50 lg:z-0 border-r lg:border-r-0 lg:border border-border rounded-none lg:rounded-lg overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-semibold">Filter</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Categories */}
          {categoryOptions.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Categories</h3>
              <div className="space-y-3">
                {categoryOptions.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Checkbox
                      checked={localFilters.categories.includes(category)}
                      onCheckedChange={(checked) =>
                        handleCategoryChange(category, checked as boolean)
                      }
                    />
                    <span className="text-sm">{category}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {colorOptions.length > 0 && (
            <div className="mb-6 border-t border-border pt-6">
              <h3 className="font-semibold mb-3">Colors</h3>
              <div className="space-y-3">
                {colorOptions.map((color) => (
                  <label
                    key={color}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Checkbox
                      checked={localFilters.colors.includes(color)}
                      onCheckedChange={(checked) =>
                        handleColorChange(color, checked as boolean)
                      }
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: getColorStyle(color) }}
                    />
                    <span className="text-sm">{color}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {sizeOptions.length > 0 && (
            <div className="mb-6 border-t border-border pt-6">
              <h3 className="font-semibold mb-3">Size</h3>
              <div className="space-y-3">
                {sizeOptions.map((size) => (
                  <label
                    key={size}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Checkbox
                      checked={localFilters.sizes.includes(size)}
                      onCheckedChange={(checked) =>
                        handleSizeChange(size, checked as boolean)
                      }
                    />
                    <span className="text-sm">{size}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Price Range */}
          {volumeOptions.length > 0 && (
            <div className="mb-6 border-t border-border pt-6">
              <h3 className="font-semibold mb-3">Available volumes</h3>
              <div className="space-y-3">
                {volumeOptions.map((volume) => (
                  <label key={volume} className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={localFilters.volumes.includes(volume)}
                      onCheckedChange={(checked) => handleVolumeChange(volume, checked as boolean)}
                    />
                    <span className="text-sm">{volume}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div className="mb-6 border-t border-border pt-6">
            <h3 className="font-semibold mb-3">Price Range</h3>
            <Slider
              value={[localFilters.priceRange[0], localFilters.priceRange[1]]}
              onValueChange={handlePriceChange}
              max={maxPrice}
              step={50}
              className="mb-3"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>৳ {localFilters.priceRange[0]}</span>
              <span>৳ {localFilters.priceRange[1]}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-4 border-t border-border">
            <Button onClick={applyFilters} className="w-full btn-primary">
              Apply Filters
            </Button>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full"
            >
              Clear All
            </Button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export { type FilterState };
