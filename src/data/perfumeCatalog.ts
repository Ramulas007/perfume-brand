import { Product } from '@/types/product';
import type { DatabaseCategory, DatabaseProduct } from '@/hooks/useProducts';

interface CatalogEntry {
  name: string;
  price_bdt: number;
  local_image: string;
  source_page: number;
}

export const isLocalPerfumeCatalogEnabled = () =>
  import.meta.env.VITE_PERFUME_CATALOG === 'true';

const categoryDefinitions = [
  { id: 'perfume-men', name: "Men's Perfume", slug: 'mens-perfume' },
  { id: 'perfume-women', name: "Women's Perfume", slug: 'womens-perfume' },
  { id: 'perfume-unisex', name: 'Unisex Perfume', slug: 'unisex-perfume' },
  { id: 'perfume-arabic', name: 'Arabic Perfume', slug: 'arabic-perfume' },
  { id: 'perfume-designer', name: 'Designer Perfume', slug: 'designer-perfume' },
  { id: 'perfume-summer', name: 'Summer Fragrances', slug: 'summer-fragrances' },
  { id: 'perfume-winter', name: 'Winter Fragrances', slug: 'winter-fragrances' },
  { id: 'perfume-gifts', name: 'Gift & Special Events', slug: 'gift-special-events' },
];

const getCategory = (name: string, index: number) => {
  if (/lattafa|rasasi|afnan|armaf|arabian|oud|al /i.test(name)) return categoryDefinitions[3];
  if (/dior|versace|chanel|giorgio armani|dolce|prada|givenchy|tom ford|yves saint/i.test(name)) return categoryDefinitions[4];
  if (index % 17 === 0) return categoryDefinitions[7];
  if (/winter|oud|tobacco|spice|amber|intense|elixir|noir|khamrah/i.test(name) || index % 5 === 0) return categoryDefinitions[6];
  if (/cool|aqua|blue|fresh|light|citrus|eau fraiche/i.test(name) || index % 4 === 0) return categoryDefinitions[5];
  if (/women|woman|femme|britney|rihanna/i.test(name)) return categoryDefinitions[1];
  if (/men|pour homme|homme|him|male/i.test(name)) return categoryDefinitions[0];
  return categoryDefinitions[2];
};

const getBrand = (name: string) => name.split(/\s+/)[0];
const getFragranceType = (name: string) => /edt/i.test(name) ? 'Eau de Toilette' : /extrait/i.test(name) ? 'Extrait de Parfum' : /parfum/i.test(name) ? 'Parfum' : 'Eau de Parfum';
const getGender = (name: string) => /women|woman|femme/i.test(name) ? 'Women' : /men|homme|him|male/i.test(name) ? 'Men' : 'Unisex';
const getFamily = (name: string, index: number) => /oud|amber|tobacco|spice|noir|khamrah/i.test(name) ? 'Woody & Oriental' : index % 3 === 0 ? 'Fresh & Aquatic' : index % 3 === 1 ? 'Woody & Aromatic' : 'Floral & Sweet';
const getSeasons = (categoryId: string) => categoryId === 'perfume-summer' ? ['Summer', 'Spring'] : categoryId === 'perfume-winter' ? ['Winter', 'Autumn'] : ['All Season'];
const getOccasions = (categoryId: string) => categoryId === 'perfume-gifts' ? ['Gifts', 'Special Events'] : categoryId === 'perfume-summer' ? ['Daily Wear', 'Travel'] : ['Daily Wear', 'Date Night'];

const getImagePath = (localImage: string) =>
  `/${localImage.replace(/\\/g, '/').replace(/^bpib-images\//, 'perfumes/images/')}`;

const getVolumes = (price: number) => [
  { value: '5ml', price: Math.max(150, Math.round(price * 0.08)) },
  { value: '10ml', price: Math.max(250, Math.round(price * 0.14)) },
  { value: '30ml', price: Math.max(500, Math.round(price * 0.32)) },
  { value: '50ml', price: Math.max(750, Math.round(price * 0.55)) },
  { value: '100ml', price },
];

export interface LocalPerfumeCatalog {
  products: DatabaseProduct[];
  categories: DatabaseCategory[];
}

export async function fetchLocalPerfumeCatalog(): Promise<LocalPerfumeCatalog> {
  const response = await fetch('/perfumes/catalog.json');
  if (!response.ok) {
    throw new Error(`Unable to load perfume catalog (${response.status})`);
  }

  const entries = (await response.json()) as CatalogEntry[];
  const categories: DatabaseCategory[] = categoryDefinitions.map((category, index) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    image_url: null,
    parent_id: null,
    section_banner_url: null,
    display_order: index,
  }));

  const products: DatabaseProduct[] = entries.map((entry, index) => {
    const category = getCategory(entry.name, index);
    return {
      id: `perfume-${index + 1}`,
      name: entry.name,
      price: entry.price_bdt,
      original_price: null,
      discount: null,
      image_url: getImagePath(entry.local_image),
      supplementary_images: null,
      category_id: category.id,
      colors: null,
      sizes: null,
      sku: `PERF-${String(index + 1).padStart(4, '0')}`,
      in_stock: true,
      description: `Explore ${entry.name}, available in multiple sizes for fragrance lovers in Bangladesh.`,
      brand: getBrand(entry.name),
      fragrance_type: getFragranceType(entry.name),
      gender: getGender(entry.name),
      fragrance_family: getFamily(entry.name, index),
      top_notes: ['Citrus', 'Fresh accords'],
      heart_notes: ['Aromatic woods', 'Floral accords'],
      base_notes: ['Musk', 'Amber'],
      seasons: getSeasons(category.id),
      occasions: getOccasions(category.id),
      performance: index % 3 === 0 ? 'Moderate projection with 6–8 hour longevity' : 'Long-lasting everyday performance',
      stock_quantity: 25,
      low_stock_threshold: 5,
      badge_text: index < 8 ? 'Best Seller' : null,
      badge_color: null,
      badge_type: index < 8 ? 'Best Seller' : 'none',
      enable_sizes: false,
      enable_colors: false,
      enable_volumes: true,
      created_at: new Date(2026, 0, index + 1).toISOString(),
      volumes: getVolumes(entry.price_bdt),
    };
  });

  categories.forEach((category) => {
    const categoryProduct = products.find((product) => product.category_id === category.id);
    category.image_url = categoryProduct?.image_url ?? null;
    category.section_banner_url = categoryProduct?.image_url ?? null;
  });

  return { products, categories };
}

export const getLocalPerfumeVariants = (product: Product) =>
  product.volumes?.map((volume, index) => ({
    id: `${product.id}-${volume.value}`,
    product_id: product.id,
    variant_type: 'volume' as const,
    value: volume.value,
    price: volume.price,
    sale_price: null,
    stock_quantity: product.stockQuantity ?? 25,
    image_urls: null,
    color_hex: null,
    display_order: index,
  })) ?? [];
