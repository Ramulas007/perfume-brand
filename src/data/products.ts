import hoodieOlive from '@/assets/products/hoodie-olive.jpg';
import capNavy from '@/assets/products/cap-navy.jpg';
import tshirtRaglan from '@/assets/products/tshirt-raglan.jpg';
import pantsBlack from '@/assets/products/pants-black.jpg';
import jacketBomber from '@/assets/products/jacket-bomber.jpg';
import capGray from '@/assets/products/cap-gray.jpg';

import { Product, Category } from '@/types/product';

export const products: Product[] = [
  {
    id: '1',
    name: 'Premium Platinum Hoodie',
    price: 954,
    originalPrice: 1590,
    discount: 40,
    image: hoodieOlive,
    category: 'Hoodies',
    colors: ['Olive', 'Navy', 'Black'],
    sizes: ['M', 'L', 'XL'],
    sku: 'A063833',
    inStock: true,
  },
  {
    id: '2',
    name: 'Premium Suede Visor Cap',
    price: 156,
    originalPrice: 390,
    discount: 60,
    image: capNavy,
    category: 'Accessories',
    colors: ['Navy', 'Black'],
    sizes: ['One Size'],
    sku: 'C001234',
    inStock: true,
  },
  {
    id: '3',
    name: 'Raglan Drop Shoulder Tee',
    price: 650,
    image: tshirtRaglan,
    category: 'T-Shirts',
    colors: ['Teal/Cream', 'Navy/White'],
    sizes: ['S', 'M', 'L', 'XL'],
    sku: 'T005678',
    inStock: true,
  },
  {
    id: '4',
    name: 'Mens Twill Payjama',
    price: 850,
    image: pantsBlack,
    category: 'Pants',
    colors: ['Black', 'Navy'],
    sizes: ['30', '32', '34', '36'],
    sku: 'P009012',
    inStock: true,
  },
  {
    id: '5',
    name: 'Classic Bomber Jacket',
    price: 1250,
    originalPrice: 1800,
    discount: 30,
    image: jacketBomber,
    category: 'Jackets',
    colors: ['Navy', 'Black', 'Olive'],
    sizes: ['M', 'L', 'XL', 'XXL'],
    sku: 'J003456',
    inStock: true,
  },
  {
    id: '6',
    name: 'Special Suede Cap - Gray',
    price: 550,
    image: capGray,
    category: 'Accessories',
    colors: ['Gray', 'Beige'],
    sizes: ['One Size'],
    sku: 'C007890',
    inStock: true,
  },
];

export const categories: Category[] = [
  { id: '1', name: 'Hoodies', image: hoodieOlive, slug: 'hoodies' },
  { id: '2', name: 'T-Shirts', image: tshirtRaglan, slug: 't-shirts' },
  { id: '3', name: 'Jackets', image: jacketBomber, slug: 'jackets' },
  { id: '4', name: 'Pants', image: pantsBlack, slug: 'pants' },
  { id: '5', name: 'Accessories', image: capNavy, slug: 'accessories' },
];
