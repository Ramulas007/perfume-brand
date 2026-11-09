import { useState, useEffect, useRef } from 'react';
import {
  Plus, Edit, Trash2, Search, Upload, X, ImageIcon, Images, Package,
  CheckCircle2, ArrowUp, ArrowDown, Copy, UploadCloud, Layers, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AIContentAssistant } from '@/components/admin/AIContentAssistant';
import { AIProductEdit } from '@/components/admin/AIProductEdit';
import { toCdnUrl, brandedFileName } from '@/lib/cdn';
import { compressProductImage } from '@/lib/imageCompress';

interface Product {
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
  display_order: number;
  stock_quantity?: number | null;
  low_stock_threshold?: number | null;
  badge_text?: string | null;
  badge_color?: string | null;
  badge_type?: string | null;
  enable_sizes?: boolean | null;
  enable_colors?: boolean | null;
  enable_volumes?: boolean | null;
}

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  slug: string;
}

interface VariantRow {
  id?: string;
  variant_type: 'size' | 'color' | 'volume';
  value: string;
  price: string;
  sale_price: string;
  stock_quantity: string;
  image_urls: string[];
  color_hex?: string;
}

const PREDEFINED = {
  size: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  color: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Gray', 'Brown', 'Purple'],
  volume: ['3ml', '5ml', '10ml', '30ml', '50ml', '100ml'],
};

const COLOR_HEX: Record<string, string> = {
  Black: '#000000', White: '#FFFFFF', Red: '#DC2626', Blue: '#2563EB',
  Green: '#16A34A', Yellow: '#EAB308', Gray: '#6B7280', Brown: '#92400E', Purple: '#9333EA',
};

const BADGE_TYPES = [
  'none', 'New', 'Discount',
  'Eid Collection', 'Summer Collection', 'Winter Collection',
  'Trending', 'Best Seller', 'Limited Edition', 'custom',
];

export const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [aiEditProduct, setAiEditProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingSupplementary, setUploadingSupplementary] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [supplementaryPreviews, setSupplementaryPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supplementaryInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);

  const [formData, setFormData] = useState({
    name: '', price: '', original_price: '', image_url: '',
    supplementary_images: [] as string[],
    main_category_id: '', category_id: '',
    sku: '', in_stock: true, description: '',
    stock_quantity: '0', low_stock_threshold: '5',
    badge_type: 'none',
    badge_text: '', badge_color: '#8B0000',
    enable_sizes: false, enable_colors: false, enable_volumes: false,
  });

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products').select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({ title: 'Error', description: 'Failed to fetch products', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories').select('id, name, parent_id, slug')
        .order('display_order', { ascending: true }).order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) { console.error(error); }
  };

  const fetchVariants = async (productId: string): Promise<VariantRow[]> => {
    const { data } = await (supabase as any)
      .from('product_variants').select('*')
      .eq('product_id', productId).order('display_order');
    return (data || []).map((v: any) => ({
      id: v.id,
      variant_type: v.variant_type,
      value: v.value,
      price: v.price?.toString() ?? '',
      sale_price: v.sale_price?.toString() ?? '',
      stock_quantity: (v.stock_quantity ?? 0).toString(),
      image_urls: v.image_urls || [],
      color_hex: v.color_hex || undefined,
    }));
  };

  const mainCategories = categories.filter(c => !c.parent_id);
  const subCategoriesFor = (mainId: string) => categories.filter(c => c.parent_id === mainId);

  // Auto-compute discount %
  const autoDiscount = (() => {
    const p = parseFloat(formData.price);
    const o = parseFloat(formData.original_price);
    if (!isNaN(p) && !isNaN(o) && o > p) return Math.round(((o - p) / o) * 100);
    return null;
  })();

  const saveVariants = async (productId: string) => {
    // Delete existing then insert fresh — keeps logic simple
    await (supabase as any).from('product_variants').delete().eq('product_id', productId);
    const rows = variantRows
      .filter(v => v.value.trim() !== '')
      .map((v, i) => ({
        product_id: productId,
        variant_type: v.variant_type,
        value: v.value.trim(),
        price: v.price ? parseFloat(v.price) : null,
        sale_price: v.sale_price ? parseFloat(v.sale_price) : null,
        stock_quantity: v.stock_quantity ? parseInt(v.stock_quantity) : 0,
        image_urls: v.image_urls.length > 0 ? v.image_urls : null,
        color_hex: v.color_hex || null,
        display_order: i,
      }));
    if (rows.length > 0) {
      const { error } = await (supabase as any).from('product_variants').insert(rows);
      if (error) throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategoryId = formData.category_id || formData.main_category_id || null;
    const stockQty = parseInt(formData.stock_quantity) || 0;
    const productData: any = {
      name: formData.name,
      price: parseFloat(formData.price),
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      discount: autoDiscount,
      image_url: formData.image_url || null,
      supplementary_images: formData.supplementary_images.length > 0 ? formData.supplementary_images : null,
      category_id: finalCategoryId,
      sku: formData.sku || null,
      in_stock: stockQty > 0,
      stock_quantity: stockQty,
      low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
      description: formData.description || null,
      badge_type: formData.badge_type || 'none',
      badge_text: formData.badge_type === 'custom' ? (formData.badge_text || null) : null,
      badge_color: formData.badge_color || '#8B0000',
      enable_sizes: formData.enable_sizes,
      enable_colors: formData.enable_colors,
      enable_volumes: formData.enable_volumes,
      // Keep legacy arrays in sync from variants for filtering compatibility
      sizes: formData.enable_sizes ? variantRows.filter(v => v.variant_type === 'size').map(v => v.value).filter(Boolean) : null,
      colors: formData.enable_colors ? variantRows.filter(v => v.variant_type === 'color').map(v => v.value).filter(Boolean) : null,
    };

    try {
      let productId: string;
      if (editingProduct) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
        if (error) throw error;
        productId = editingProduct.id;
      } else {
        const nextOrder = products.length > 0 ? Math.max(...products.map(p => p.display_order ?? 0)) + 1 : 0;
        const { data, error } = await supabase.from('products').insert([{ ...productData, display_order: nextOrder }]).select('id').single();
        if (error) throw error;
        productId = data.id;
      }
      await saveVariants(productId);
      toast({ title: editingProduct ? 'Product updated' : 'Product created' });
      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save product', variant: 'destructive' });
    }
  };

  const moveProduct = async (product: Product, direction: -1 | 1) => {
    const ordered = [...products].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    const idx = ordered.findIndex(p => p.id === product.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= ordered.length) return;
    const other = ordered[swapIdx];
    try {
      await Promise.all([
        supabase.from('products').update({ display_order: other.display_order }).eq('id', product.id),
        supabase.from('products').update({ display_order: product.display_order }).eq('id', other.id),
      ]);
      fetchProducts();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const uploadImageFile = async (file: File, prefix: string): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image', variant: 'destructive' });
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB', variant: 'destructive' });
      return null;
    }
    toast({ title: 'Optimizing image...', description: 'Compressing to WebP before upload.' });
    const compressed = await compressProductImage(file);
    const fileExt = compressed.name.split('.').pop() || 'webp';
    const fileName = brandedFileName(prefix, fileExt);
    const { error } = await supabase.storage
      .from('products')
      .upload(fileName, compressed, { contentType: compressed.type });
    if (error) throw error;
    const { data } = supabase.storage.from('products').getPublicUrl(fileName);
    return toCdnUrl(data.publicUrl);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageFile(file, 'product');
      if (url) {
        setFormData(prev => ({ ...prev, image_url: url }));
        setImagePreview(url);
      }
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSupplementaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingSupplementary(true);
    const newImages: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImageFile(files[i], `product-gallery`);
        if (url) newImages.push(url);
      }
      const updated = [...formData.supplementary_images, ...newImages];
      setFormData(prev => ({ ...prev, supplementary_images: updated }));
      setSupplementaryPreviews(updated);
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingSupplementary(false);
      if (supplementaryInputRef.current) supplementaryInputRef.current.value = '';
    }
  };

  const removeSupplementaryImage = (index: number) => {
    const updated = formData.supplementary_images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, supplementary_images: updated }));
    setSupplementaryPreviews(updated);
  };

  const openForEdit = async (product: Product) => {
    setEditingProduct(product);
    const cat = categories.find(c => c.id === product.category_id);
    const mainId = cat ? (cat.parent_id || cat.id) : '';
    const subId = cat && cat.parent_id ? cat.id : '';
    setFormData({
      name: product.name,
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      image_url: product.image_url || '',
      supplementary_images: product.supplementary_images || [],
      main_category_id: mainId,
      category_id: subId,
      sku: product.sku || '',
      in_stock: product.in_stock ?? true,
      description: product.description || '',
      stock_quantity: (product.stock_quantity ?? 0).toString(),
      low_stock_threshold: (product.low_stock_threshold ?? 5).toString(),
      badge_type: (product as any).badge_type || (product.badge_text ? 'custom' : 'none'),
      badge_text: product.badge_text || '',
      badge_color: product.badge_color || '#8B0000',
      enable_sizes: product.enable_sizes ?? false,
      enable_colors: product.enable_colors ?? false,
      enable_volumes: product.enable_volumes ?? false,
    });
    setImagePreview(product.image_url || null);
    setSupplementaryPreviews(product.supplementary_images || []);
    const vs = await fetchVariants(product.id);
    setVariantRows(vs);
    setIsModalOpen(true);
  };

  const handleDuplicate = async (product: Product) => {
    try {
      const vs = await fetchVariants(product.id);
      const nextOrder = products.length > 0 ? Math.max(...products.map(p => p.display_order ?? 0)) + 1 : 0;
      const { id, ...rest } = product as any;
      const newName = `${product.name} (Copy)`;
      const { data, error } = await supabase
        .from('products')
        .insert([{ ...rest, name: newName, display_order: nextOrder }])
        .select('*').single();
      if (error) throw error;
      if (vs.length > 0) {
        await (supabase as any).from('product_variants').insert(
          vs.map((v, i) => ({
            product_id: data.id,
            variant_type: v.variant_type,
            value: v.value,
            price: v.price ? parseFloat(v.price) : null,
            sale_price: v.sale_price ? parseFloat(v.sale_price) : null,
            stock_quantity: parseInt(v.stock_quantity) || 0,
            image_urls: v.image_urls.length > 0 ? v.image_urls : null,
            color_hex: v.color_hex || null,
            display_order: i,
          }))
        );
      }
      toast({ title: 'Duplicated', description: `Created "${newName}"` });
      await fetchProducts();
      openForEdit(data as Product);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? Variants will be removed too.')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Product deleted' });
      fetchProducts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '', price: '', original_price: '', image_url: '',
      supplementary_images: [], main_category_id: '', category_id: '',
      sku: '', in_stock: true, description: '',
      stock_quantity: '0', low_stock_threshold: '5',
      badge_type: 'none',
      badge_text: '', badge_color: '#8B0000',
      enable_sizes: false, enable_colors: false, enable_volumes: false,
    });
    setImagePreview(null);
    setSupplementaryPreviews([]);
    setVariantRows([]);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Variant rows helpers ─────────────────────────────────
  const addVariantRow = (type: 'size' | 'color' | 'volume', value = '') => {
    setVariantRows(prev => [...prev, {
      variant_type: type,
      value,
      price: '',
      sale_price: '',
      stock_quantity: '0',
      image_urls: [],
      color_hex: type === 'color' ? COLOR_HEX[value] || '' : undefined,
    }]);
  };

  const updateVariantRow = (idx: number, field: keyof VariantRow, value: any) => {
    setVariantRows(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  const removeVariantRow = (idx: number) => {
    setVariantRows(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadVariantImage = async (idx: number, file: File) => {
    try {
      const url = await uploadImageFile(file, 'variant');
      if (url) {
        setVariantRows(prev => prev.map((v, i) =>
          i === idx ? { ...v, image_urls: [...v.image_urls, url] } : v
        ));
      }
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-muted-foreground text-sm mt-1">{products.length} items in catalog</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkOpen(true)} className="gap-2">
            <UploadCloud size={16} /> Bulk Upload
          </Button>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2 shadow-sm">
            <Plus size={16} /> Add Product
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name or SKU..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-background" />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border animate-pulse">
              <div className="aspect-square bg-secondary rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-secondary rounded w-3/4" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border/50">
          <Package size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">
            {products.length === 0 ? 'No products yet' : 'No matches'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredProducts.map((product, index) => {
              const stockStatus = (product.stock_quantity ?? 0) <= 0 ? 'out'
                : (product.stock_quantity ?? 0) <= (product.low_stock_threshold ?? 5) ? 'low' : 'in';
              return (
                <motion.div key={product.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.04 }}
                  className="group bg-card rounded-xl border border-border/60 overflow-hidden hover:shadow-md hover:border-primary/20 transition-all"
                >
                  <div className="relative aspect-square bg-secondary overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={36} className="text-muted-foreground/20" />
                      </div>
                    )}
                    <div className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                      stockStatus === 'in' ? 'bg-accent/90 text-accent-foreground'
                      : stockStatus === 'low' ? 'bg-yellow-500/90 text-white'
                      : 'bg-destructive/90 text-destructive-foreground'
                    }`}>
                      {stockStatus === 'in' ? `In Stock (${product.stock_quantity})`
                        : stockStatus === 'low' ? `Low (${product.stock_quantity})`
                        : 'Out'}
                    </div>
                    {product.badge_text && (
                      <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: product.badge_color || '#8B0000' }}>
                        {product.badge_text}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
                      <div className="flex gap-1.5 flex-wrap justify-center">
                        <button onClick={() => moveProduct(product, -1)} disabled={index === 0}
                          className="p-2 bg-background rounded-lg shadow-md hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40">
                          <ArrowUp size={14} />
                        </button>
                        <button onClick={() => moveProduct(product, 1)} disabled={index === filteredProducts.length - 1}
                          className="p-2 bg-background rounded-lg shadow-md hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40">
                          <ArrowDown size={14} />
                        </button>
                        <button onClick={() => openForEdit(product)}
                          className="p-2 bg-background rounded-lg shadow-md hover:bg-primary hover:text-primary-foreground transition-colors">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => setAiEditProduct(product)}
                          className="p-2 bg-background rounded-lg shadow-md hover:bg-primary hover:text-primary-foreground transition-colors"
                          title="AI Edit">
                          <Sparkles size={14} />
                        </button>
                        <button onClick={() => handleDuplicate(product)}
                          className="p-2 bg-background rounded-lg shadow-md hover:bg-primary hover:text-primary-foreground transition-colors"
                          title="Duplicate">
                          <Copy size={14} />
                        </button>
                        <button onClick={() => handleDelete(product.id)}
                          className="p-2 bg-background rounded-lg shadow-md hover:bg-destructive hover:text-destructive-foreground transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-primary font-bold text-sm">৳{product.price.toLocaleString()}</span>
                      {product.original_price && (
                        <span className="text-xs text-muted-foreground line-through">৳{product.original_price.toLocaleString()}</span>
                      )}
                      {product.discount && (
                        <span className="text-xs text-accent font-semibold">-{product.discount}%</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Product Modal ───────────────────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsModalOpen(open); }}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-background z-10">
            <DialogTitle className="text-lg font-semibold">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
            {/* Basic Info */}
            <Section title="Basic Info">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Product Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>SKU</Label>
                  <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Main Category</Label>
                  <Select value={formData.main_category_id}
                    onValueChange={(value) => setFormData({ ...formData, main_category_id: value, category_id: '' })}>
                    <SelectTrigger><SelectValue placeholder="Select main category" /></SelectTrigger>
                    <SelectContent>
                      {mainCategories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {formData.main_category_id && subCategoriesFor(formData.main_category_id).length > 0 && (
                  <div className="space-y-1.5 col-span-2">
                    <Label>Sub Category (optional)</Label>
                    <Select value={formData.category_id || '__none__'}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value === '__none__' ? '' : value })}>
                      <SelectTrigger><SelectValue placeholder="Sub category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Main category only —</SelectItem>
                        {subCategoriesFor(formData.main_category_id).map((cat) =>
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </Section>

            {/* Pricing */}
            <Section title="Pricing">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Sale Price *</Label>
                  <Input type="number" step="0.01" value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Original Price</Label>
                  <Input type="number" step="0.01" value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Discount %</Label>
                  <div className="h-10 px-3 flex items-center bg-secondary/40 rounded-md border border-border text-sm font-semibold">
                    {autoDiscount !== null ? `${autoDiscount}% OFF (auto)` : '—'}
                  </div>
                </div>
              </div>
            </Section>

            {/* Stock */}
            <Section title="Stock Management">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Stock Quantity</Label>
                  <Input type="number" min="0" value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Low Stock Threshold</Label>
                  <Input type="number" min="0" value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Status auto-updates: 0 = Out of Stock, ≤ threshold = Low Stock, else In Stock.
              </p>
            </Section>

            {/* Badge */}
            <Section title="Badge (only one per product)">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5 col-span-1">
                  <Label>Badge Type</Label>
                  <Select value={formData.badge_type}
                    onValueChange={(v) => setFormData({ ...formData, badge_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BADGE_TYPES.map(b => (
                        <SelectItem key={b} value={b}>{b === 'none' ? '— None —' : b === 'custom' ? 'Custom (write your own)' : b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.badge_type === 'custom' && (
                  <>
                    <div className="space-y-1.5 col-span-1">
                      <Label>Custom Badge Text</Label>
                      <Input value={formData.badge_text}
                        onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                        placeholder="e.g. FLASH SALE" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Color</Label>
                      <Input type="color" value={formData.badge_color}
                        onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                        className="h-10" />
                    </div>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Out of Stock badge automatically overrides this when stock = 0.
              </p>
            </Section>

            {/* Main Image */}
            <Section title="Main Image">
              {imagePreview ? (
                <div className="relative w-full h-52 rounded-xl overflow-hidden border border-border bg-secondary/30">
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                  <button type="button"
                    onClick={() => { setImagePreview(null); setFormData({ ...formData, image_url: '' }); }}
                    className="absolute top-3 right-3 p-1.5 bg-background/80 backdrop-blur-sm rounded-full hover:bg-destructive hover:text-destructive-foreground transition">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-border hover:border-primary/50 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer">
                  {uploading ? <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /> :
                    <><Upload size={18} className="text-muted-foreground" /><p className="text-sm">Click to upload</p></>}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </Section>

            {/* Gallery */}
            <Section title="Gallery Images">
              {supplementaryPreviews.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {supplementaryPreviews.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeSupplementaryImage(i)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div onClick={() => supplementaryInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-border hover:border-primary/50 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer">
                {uploadingSupplementary ? <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /> :
                  <><Images size={18} className="text-muted-foreground" /><p className="text-xs">Add gallery images</p></>}
              </div>
              <input ref={supplementaryInputRef} type="file" accept="image/*" multiple onChange={handleSupplementaryUpload} className="hidden" />
            </Section>

            {/* Variants */}
            <Section title="Variants">
              <div className="flex flex-wrap gap-4 mb-4">
                <Toggle label="Enable Sizes" checked={formData.enable_sizes}
                  onChange={(v) => setFormData({ ...formData, enable_sizes: v })} />
                <Toggle label="Enable Colors" checked={formData.enable_colors}
                  onChange={(v) => setFormData({ ...formData, enable_colors: v })} />
                <Toggle label="Enable Volumes" checked={formData.enable_volumes}
                  onChange={(v) => setFormData({ ...formData, enable_volumes: v })} />
              </div>

              {formData.enable_sizes && (
                <VariantTypeEditor type="size" rows={variantRows.filter(v => v.variant_type === 'size')}
                  presets={PREDEFINED.size}
                  onAdd={(val) => addVariantRow('size', val)}
                  onUpdate={(localIdx, field, value) => {
                    const globalIdx = variantRows.findIndex((_, i) => {
                      const sub = variantRows.slice(0, i + 1).filter(v => v.variant_type === 'size').length;
                      return sub === localIdx + 1;
                    });
                    if (globalIdx >= 0) updateVariantRow(globalIdx, field, value);
                  }}
                  onRemove={(localIdx) => {
                    const idxs = variantRows.map((v, i) => v.variant_type === 'size' ? i : -1).filter(i => i >= 0);
                    if (idxs[localIdx] !== undefined) removeVariantRow(idxs[localIdx]);
                  }}
                  onImageUpload={(localIdx, file) => {
                    const idxs = variantRows.map((v, i) => v.variant_type === 'size' ? i : -1).filter(i => i >= 0);
                    if (idxs[localIdx] !== undefined) uploadVariantImage(idxs[localIdx], file);
                  }}
                />
              )}

              {formData.enable_colors && (
                <VariantTypeEditor type="color" rows={variantRows.filter(v => v.variant_type === 'color')}
                  presets={PREDEFINED.color}
                  onAdd={(val) => addVariantRow('color', val)}
                  onUpdate={(localIdx, field, value) => {
                    const idxs = variantRows.map((v, i) => v.variant_type === 'color' ? i : -1).filter(i => i >= 0);
                    if (idxs[localIdx] !== undefined) updateVariantRow(idxs[localIdx], field, value);
                  }}
                  onRemove={(localIdx) => {
                    const idxs = variantRows.map((v, i) => v.variant_type === 'color' ? i : -1).filter(i => i >= 0);
                    if (idxs[localIdx] !== undefined) removeVariantRow(idxs[localIdx]);
                  }}
                  onImageUpload={(localIdx, file) => {
                    const idxs = variantRows.map((v, i) => v.variant_type === 'color' ? i : -1).filter(i => i >= 0);
                    if (idxs[localIdx] !== undefined) uploadVariantImage(idxs[localIdx], file);
                  }}
                />
              )}

              {formData.enable_volumes && (
                <VariantTypeEditor type="volume" rows={variantRows.filter(v => v.variant_type === 'volume')}
                  presets={PREDEFINED.volume}
                  onAdd={(val) => addVariantRow('volume', val)}
                  onUpdate={(localIdx, field, value) => {
                    const idxs = variantRows.map((v, i) => v.variant_type === 'volume' ? i : -1).filter(i => i >= 0);
                    if (idxs[localIdx] !== undefined) updateVariantRow(idxs[localIdx], field, value);
                  }}
                  onRemove={(localIdx) => {
                    const idxs = variantRows.map((v, i) => v.variant_type === 'volume' ? i : -1).filter(i => i >= 0);
                    if (idxs[localIdx] !== undefined) removeVariantRow(idxs[localIdx]);
                  }}
                  onImageUpload={(localIdx, file) => {
                    const idxs = variantRows.map((v, i) => v.variant_type === 'volume' ? i : -1).filter(i => i >= 0);
                    if (idxs[localIdx] !== undefined) uploadVariantImage(idxs[localIdx], file);
                  }}
                />
              )}
            </Section>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>

            <AIContentAssistant
              productName={formData.name}
              productCategory={
                categories.find(c => c.id === (formData.category_id || formData.main_category_id))?.name || ''
              }
              productDescription={formData.description}
              onInsertName={(text) => setFormData({ ...formData, name: text.replace(/^["']|["']$/g, '') })}
              onInsertDescription={(text) => setFormData({ ...formData, description: text })}
            />

            <div className="flex gap-3 pt-2 border-t border-border">
              <Button type="button" variant="outline"
                onClick={() => { resetForm(); setIsModalOpen(false); }} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1">
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Bulk Upload Modal ───────────────────────────────────────── */}
      <BulkUploadDialog open={isBulkOpen} onOpenChange={setIsBulkOpen}
        categories={categories} onComplete={fetchProducts} />
      <AIProductEdit
        open={!!aiEditProduct}
        onClose={() => setAiEditProduct(null)}
        product={aiEditProduct ? { id: aiEditProduct.id, name: aiEditProduct.name, image_url: aiEditProduct.image_url } : null}
        onUpdated={fetchProducts}
      />
    </div>
  );
};

// ─── Small reusable bits ────────────────────────────────────────────────
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
    <div className="pt-2">{children}</div>
  </div>
);

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
    <span className="text-sm font-medium">{label}</span>
  </label>
);

interface VariantEditorProps {
  type: 'size' | 'color' | 'volume';
  rows: VariantRow[];
  presets: string[];
  onAdd: (value: string) => void;
  onUpdate: (localIdx: number, field: keyof VariantRow, value: any) => void;
  onRemove: (localIdx: number) => void;
  onImageUpload: (localIdx: number, file: File) => void;
}

const VariantTypeEditor = ({ type, rows, presets, onAdd, onUpdate, onRemove, onImageUpload }: VariantEditorProps) => {
  const [customValue, setCustomValue] = useState('');
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className="mt-3 p-4 border border-border rounded-xl bg-secondary/20 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold flex items-center gap-2"><Layers size={14} /> {typeLabel} Variants</span>
        <div className="flex gap-1 flex-wrap">
          {presets.filter(p => !rows.some(r => r.value === p)).map(p => (
            <button key={p} type="button" onClick={() => onAdd(p)}
              className="text-xs px-2 py-1 bg-background border border-border rounded hover:bg-primary hover:text-primary-foreground transition-colors">
              + {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Input placeholder={`Custom ${type}…`} value={customValue}
          onChange={(e) => setCustomValue(e.target.value)} className="flex-1 h-8 text-sm" />
        <Button type="button" size="sm" variant="outline"
          onClick={() => { if (customValue.trim()) { onAdd(customValue.trim()); setCustomValue(''); } }}>
          Add Custom
        </Button>
      </div>

      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center bg-background p-2 rounded-lg border border-border">
              {type === 'color' && (
                <input type="color" value={row.color_hex || '#000000'}
                  onChange={(e) => onUpdate(i, 'color_hex', e.target.value)}
                  className="col-span-1 w-8 h-8 rounded cursor-pointer" />
              )}
              <Input value={row.value} onChange={(e) => onUpdate(i, 'value', e.target.value)}
                placeholder="Value" className={type === 'color' ? 'col-span-2' : 'col-span-3'} />
              <Input type="number" step="0.01" value={row.price}
                onChange={(e) => onUpdate(i, 'price', e.target.value)}
                placeholder="Price" className="col-span-2" />
              <Input type="number" step="0.01" value={row.sale_price}
                onChange={(e) => onUpdate(i, 'sale_price', e.target.value)}
                placeholder="Sale" className="col-span-2" />
              <Input type="number" value={row.stock_quantity}
                onChange={(e) => onUpdate(i, 'stock_quantity', e.target.value)}
                placeholder="Stock" className="col-span-2" />
              <div className="col-span-2 flex items-center gap-1">
                <button type="button" onClick={() => fileRefs.current[i]?.click()}
                  className="p-1.5 bg-secondary rounded hover:bg-primary hover:text-primary-foreground" title="Upload image">
                  <Upload size={14} />
                </button>
                {row.image_urls.length > 0 && (
                  <span className="text-xs text-muted-foreground">{row.image_urls.length}</span>
                )}
                <input ref={(el) => (fileRefs.current[i] = el)} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onImageUpload(i, f); }} />
                <button type="button" onClick={() => onRemove(i)}
                  className="p-1.5 ml-auto bg-secondary rounded hover:bg-destructive hover:text-destructive-foreground">
                  <X size={14} />
                </button>
              </div>
              {row.image_urls.length > 0 && (
                <div className="col-span-12 flex gap-1 flex-wrap mt-1">
                  {row.image_urls.map((url, j) => (
                    <div key={j} className="relative w-12 h-12 rounded overflow-hidden border">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button"
                        onClick={() => onUpdate(i, 'image_urls', row.image_urls.filter((_, k) => k !== j))}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white rounded-full text-[10px] leading-none">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Bulk Upload Dialog ─────────────────────────────────────────────────
const BulkUploadDialog = ({
  open, onOpenChange, categories, onComplete,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categories: Category[];
  onComplete: () => void;
}) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [mainCat, setMainCat] = useState('');
  const [subCat, setSubCat] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const mainCats = categories.filter(c => !c.parent_id);
  const subCats = mainCat ? categories.filter(c => c.parent_id === mainCat) : [];

  const reset = () => {
    setFiles([]); setMainCat(''); setSubCat(''); setPrice(''); setStock('10');
    setDescription(''); setProgress(0);
  };

  const filenameToName = (name: string) => {
    const base = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
    return base.replace(/\b\w/g, c => c.toUpperCase());
  };

  const handleSubmit = async () => {
    if (files.length === 0 || !mainCat || !price) {
      toast({ title: 'Missing fields', description: 'Files, category, and price are required', variant: 'destructive' });
      return;
    }
    setUploading(true);
    setProgress(0);
    const categoryId = subCat || mainCat;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressProductImage(file);
        const ext = compressed.name.split('.').pop() || 'webp';
        const fname = brandedFileName(file.name.replace(/\.[^.]+$/, '') || `bulk-${i}`, ext);
        const { error: upErr } = await supabase.storage
          .from('products')
          .upload(fname, compressed, { contentType: compressed.type });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('products').getPublicUrl(fname);
        const stockQty = parseInt(stock) || 0;
        await supabase.from('products').insert([{
          name: filenameToName(file.name),
          price: parseFloat(price),
          image_url: toCdnUrl(data.publicUrl),
          category_id: categoryId,
          description: description || null,
          stock_quantity: stockQty,
          in_stock: stockQty > 0,
        }]);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      toast({ title: 'Bulk upload complete', description: `${files.length} products created` });
      onComplete();
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Bulk upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Products</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload multiple images. Each filename becomes a product name. All products share the
            category, price, stock, and description below.
          </p>

          <div>
            <Label>Images (multiple)</Label>
            <Input type="file" accept="image/*" multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))} className="mt-1" />
            {files.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{files.length} file(s) selected</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Main Category *</Label>
              <Select value={mainCat} onValueChange={(v) => { setMainCat(v); setSubCat(''); }}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {mainCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {subCats.length > 0 && (
              <div>
                <Label>Sub Category</Label>
                <Select value={subCat || '__none__'} onValueChange={(v) => setSubCat(v === '__none__' ? '' : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Main only —</SelectItem>
                    {subCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Price (৳) *</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <Label>Stock Qty</Label>
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-center text-muted-foreground">{progress}% — uploading…</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={uploading || files.length === 0}>
              {uploading ? 'Uploading…' : `Upload ${files.length || ''} Products`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
