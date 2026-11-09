export type VariantType = 'size' | 'color' | 'volume';

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_type: VariantType;
  value: string;
  price: number | null;
  sale_price: number | null;
  stock_quantity: number;
  image_urls: string[] | null;
  color_hex: string | null;
  display_order: number;
}

export type BadgeType =
  | 'none'
  | 'New'
  | 'Discount'
  | 'Eid Collection'
  | 'Summer Collection'
  | 'Winter Collection'
  | 'Trending'
  | 'Best Seller'
  | 'Limited Edition'
  | 'custom';

export const BADGE_TYPE_OPTIONS: BadgeType[] = [
  'none',
  'New',
  'Discount',
  'Eid Collection',
  'Summer Collection',
  'Winter Collection',
  'Trending',
  'Best Seller',
  'Limited Edition',
  'custom',
];

export const BADGE_DEFAULT_COLORS: Record<string, string> = {
  'New': '#10b981',
  'Discount': '#dc2626',
  'Eid Collection': '#7c3aed',
  'Summer Collection': '#f59e0b',
  'Winter Collection': '#0ea5e9',
  'Trending': '#ec4899',
  'Best Seller': '#f97316',
  'Limited Edition': '#8B0000',
};

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  description?: string;
  brand?: string;
  fragranceType?: string;
  gender?: string;
  fragranceFamily?: string;
  topNotes?: string[];
  heartNotes?: string[];
  baseNotes?: string[];
  seasons?: string[];
  occasions?: string[];
  performance?: string;
  supplementaryImages?: string[];
  category: string;
  categoryId?: string;
  colors?: string[];
  sizes?: string[];
  sku?: string;
  inStock?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  badgeType?: BadgeType | null;
  badgeText?: string | null;
  badgeColor?: string | null;
  isNew?: boolean;
  enableSizes?: boolean;
  enableColors?: boolean;
  enableVolumes?: boolean;
  volumes?: Array<{ value: string; price: number }>;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedVolume?: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  slug: string;
}

export const isCustomProduct = (product: Product) =>
  product.category === 'Custom Products' || product.category === 'Custom' || product.category === 'custom-products';

export const getStockStatus = (qty: number, threshold = 5, inStock = true): 'in' | 'low' | 'out' => {
  if (!inStock || qty <= 0) return 'out';
  if (qty <= threshold) return 'low';
  return 'in';
};

/**
 * Returns the single badge to display for a product.
 * Out of stock overrides everything.
 */
export const resolveProductBadge = (
  product: Pick<Product, 'badgeType' | 'badgeText' | 'badgeColor' | 'stockQuantity' | 'inStock' | 'discount' | 'isNew'>
): { label: string; color: string } | null => {
  // Out of stock override
  const qty = product.stockQuantity ?? 0;
  if (product.inStock === false || qty <= 0) {
    return { label: 'OUT OF STOCK', color: '#7f1d1d' };
  }
  const t = product.badgeType;
  if (!t || t === 'none') return null;
  if (t === 'custom') {
    if (!product.badgeText) return null;
    return { label: product.badgeText, color: product.badgeColor || '#8B0000' };
  }
  if (t === 'New') return { label: 'NEW', color: BADGE_DEFAULT_COLORS['New'] };
  if (t === 'Discount') {
    const label = product.discount && product.discount > 0 ? `-${product.discount}% OFF` : 'SALE';
    return { label, color: BADGE_DEFAULT_COLORS['Discount'] };
  }
  return { label: t, color: BADGE_DEFAULT_COLORS[t] || product.badgeColor || '#8B0000' };
};
