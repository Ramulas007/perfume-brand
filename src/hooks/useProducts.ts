import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import { fetchLocalPerfumeCatalog, isLocalPerfumeCatalogEnabled } from '@/data/perfumeCatalog';

export interface DatabaseProduct {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  discount: number | null;
  image_url: string | null;
  supplementary_images: string[] | null;
  category_id: string | null;
  colors: string[] | null;
  sizes: string[] | null;
  sku: string | null;
  in_stock: boolean | null;
  description: string | null;
  stock_quantity?: number | null;
  low_stock_threshold?: number | null;
  badge_text?: string | null;
  badge_color?: string | null;
  badge_type?: string | null;
  enable_sizes?: boolean | null;
  enable_colors?: boolean | null;
  enable_volumes?: boolean | null;
  created_at?: string;
  volumes?: Array<{ value: string; price: number }>;
  brand?: string;
  fragrance_type?: string;
  gender?: string;
  fragrance_family?: string;
  top_notes?: string[];
  heart_notes?: string[];
  base_notes?: string[];
  seasons?: string[];
  occasions?: string[];
  performance?: string;
}

export interface DatabaseCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  parent_id?: string | null;
  section_banner_url?: string | null;
  display_order?: number | null;
}

export const transformProduct = (
  dbProduct: DatabaseProduct,
  categories: DatabaseCategory[],
  isNew = false,
): Product => {
  const category = categories.find((c) => c.id === dbProduct.category_id);
  const computedDiscount =
    dbProduct.discount ??
    (dbProduct.original_price && dbProduct.original_price > dbProduct.price
      ? Math.round(((dbProduct.original_price - dbProduct.price) / dbProduct.original_price) * 100)
      : undefined);

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    price: dbProduct.price,
    originalPrice: dbProduct.original_price ?? undefined,
    discount: computedDiscount,
    image: dbProduct.image_url || '/placeholder.svg',
    description: dbProduct.description ?? undefined,
    brand: dbProduct.brand,
    fragranceType: dbProduct.fragrance_type,
    gender: dbProduct.gender,
    fragranceFamily: dbProduct.fragrance_family,
    topNotes: dbProduct.top_notes,
    heartNotes: dbProduct.heart_notes,
    baseNotes: dbProduct.base_notes,
    seasons: dbProduct.seasons,
    occasions: dbProduct.occasions,
    performance: dbProduct.performance,
    supplementaryImages: dbProduct.supplementary_images ?? undefined,
    category: category?.name || 'Uncategorized',
    categoryId: dbProduct.category_id ?? undefined,
    colors: dbProduct.colors ?? undefined,
    sizes: dbProduct.sizes ?? undefined,
    sku: dbProduct.sku ?? undefined,
    inStock: dbProduct.in_stock ?? true,
    stockQuantity: dbProduct.stock_quantity ?? undefined,
    lowStockThreshold: dbProduct.low_stock_threshold ?? undefined,
    badgeType: (dbProduct.badge_type as any) ?? null,
    badgeText: dbProduct.badge_text ?? null,
    badgeColor: dbProduct.badge_color ?? null,
    isNew,
    enableSizes: dbProduct.enable_sizes ?? false,
    enableColors: dbProduct.enable_colors ?? false,
    enableVolumes: dbProduct.enable_volumes ?? false,
    volumes: dbProduct.volumes,
  };
};

const FIVE_MINUTES = 5 * 60 * 1000;

async function fetchProductsAndCategories(): Promise<{
  products: DatabaseProduct[];
  categories: DatabaseCategory[];
}> {
  if (isLocalPerfumeCatalogEnabled()) {
    return fetchLocalPerfumeCatalog();
  }

  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('display_order').order('name'),
  ]);
  if (productsRes.error) throw productsRes.error;
  if (categoriesRes.error) throw categoriesRes.error;
  return {
    products: (productsRes.data as DatabaseProduct[]) || [],
    categories: (categoriesRes.data as DatabaseCategory[]) || [],
  };
}

export const useProducts = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products-categories'],
    queryFn: fetchProductsAndCategories,
    staleTime: FIVE_MINUTES,
  });

  const products = data?.products ?? [];
  const categories = data?.categories ?? [];

  const newIds = useMemo(() => new Set(products.slice(0, 5).map((p) => p.id)), [products]);

  const transformedProducts = useMemo(
    () => products.map((p) => transformProduct(p, categories, newIds.has(p.id))),
    [products, categories, newIds],
  );

  const getCategoryTree = (mainCategoryId: string): string[] => {
    const children = categories.filter((c) => c.parent_id === mainCategoryId).map((c) => c.id);
    return [mainCategoryId, ...children];
  };

  const getProductsForMainCategory = (mainCategoryId: string): Product[] => {
    const ids = new Set(getCategoryTree(mainCategoryId));
    return transformedProducts.filter((p) => p.categoryId && ids.has(p.categoryId));
  };

  return {
    products: transformedProducts,
    categories,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    rawProducts: products,
    getCategoryTree,
    getProductsForMainCategory,
  };
};

export const useCategories = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products-categories'],
    queryFn: fetchProductsAndCategories,
    staleTime: FIVE_MINUTES,
  });

  return {
    categories: data?.categories ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
  };
};
