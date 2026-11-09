import { useState, useRef, useEffect } from 'react';
import { 
  Upload, Sparkles, Wand2, Package, Check, 
  ChevronRight, AlertCircle, ShoppingBag, 
  Info, ShieldCheck, Trash2, 
  ArrowRight, Search, FileText, Image as ImageIcon,
  Loader2, Calculator, Save, Eye, Palette, Ruler, X, Star, Plus, Droplet
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toCdnUrl, brandedFileName } from '@/lib/cdn';
import { compressProductImage } from '@/lib/imageCompress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

interface ColorVariation {
  name: string;
  hex?: string;
}

interface AIProductData {
  name: string;
  shortDescription: string;
  fullDescription: string;
  highlights: string[];
  features: string[];
  tags: string[];
  seoKeywords: string[];
  metaTitle: string;
  metaDescription: string;
  careInstructions: string;
  sizeChart?: string;
  sizes?: string[];
  colorVariations?: ColorVariation[];
  category_id?: string | null;
  questions?: string[];
  analysis: {
    type?: string;
    designSubject?: string;
    dominantColors?: string[] | string;
    style?: string;
    gender?: string;
    useCase?: string;
    [k: string]: any;
  };
}

const TOP_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const PANT_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42'];
const SHOE_SIZES = ['6', '7', '8', '9', '10', '11', '12'];
const DEFAULT_VOLUME_OPTIONS = ['30ml', '50ml', '100ml', '150ml', '200ml'];

type ProductKind = 'tshirt' | 'pants' | 'shoes' | 'perfume' | 'accessory' | 'other';

interface KindConfig {
  key: ProductKind;
  label: string;
  emoji: string;
  sizes?: string[];
  sizeLabel?: string;
  showColors: boolean;
  showVolumes: boolean;
}

const KIND_CONFIG: KindConfig[] = [
  { key: 'tshirt',    label: 'T-Shirt / Top', emoji: '👕', sizes: TOP_SIZES,  sizeLabel: 'Sizes',        showColors: true,  showVolumes: false },
  { key: 'pants',     label: 'Pants / Jeans', emoji: '👖', sizes: PANT_SIZES, sizeLabel: 'Waist Size',   showColors: true,  showVolumes: false },
  { key: 'shoes',     label: 'Shoes',         emoji: '👟', sizes: SHOE_SIZES, sizeLabel: 'Shoe Size',    showColors: true,  showVolumes: false },
  { key: 'perfume',   label: 'Perfume / Oil', emoji: '🧴', showVolumes: true, showColors: false },
  { key: 'accessory', label: 'Accessory',     emoji: '👜', showVolumes: false, showColors: true },
  { key: 'other',     label: 'Other',         emoji: '📦', sizes: TOP_SIZES, sizeLabel: 'Sizes', showVolumes: true, showColors: true },
];

const DEFAULT_COLOR_OPTIONS: ColorVariation[] = [
  { name: 'Black', hex: '#111111' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Gray', hex: '#6b7280' },
  { name: 'Navy', hex: '#1e3a5f' },
  { name: 'Cream', hex: '#f5f0df' },
];


const normalizeList = (values?: unknown[]) =>
  Array.from(new Set((values || []).map((value) => String(value || '').trim()).filter(Boolean)));

const normalizeColor = (color: ColorVariation): ColorVariation => ({
  name: String(color?.name || '').trim(),
  hex: /^#[0-9a-f]{6}$/i.test(String(color?.hex || '').trim()) ? String(color.hex).trim() : '#111111',
});

const normalizeColors = (values?: ColorVariation[]) => {
  const seen = new Set<string>();
  return (values || [])
    .map(normalizeColor)
    .filter((color) => {
      const key = color.name.toLowerCase();
      if (!color.name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const stringifySafe = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const getObjectMessage = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value?.message === 'string') return value.message;
  if (typeof value?.error === 'string') return value.error;
  if (typeof value?.details === 'string') return value.details;
  if (value?.error && typeof value.error === 'object') return getObjectMessage(value.error);
  return stringifySafe(value);
};

const parseResponseBodyMessage = (bodyText: string, fallback: string) => {
  if (!bodyText) return fallback;
  try {
    const parsed = JSON.parse(bodyText);
    return getObjectMessage(parsed) || bodyText || fallback;
  } catch {
    return bodyText || fallback;
  }
};

const getFunctionErrorDetails = async (error: any) => {
  const fallback = getObjectMessage(error) || 'AI request failed';
  const context = error?.context;

  if (!context) return fallback;

  const status = typeof context?.status === 'number'
    ? `HTTP ${context.status}${context.statusText ? ` ${context.statusText}` : ''}`
    : '';

  if (context instanceof Response) {
    try {
      const bodyText = await context.clone().text();
      const message = parseResponseBodyMessage(bodyText, fallback);
      return `${status ? `${status} — ` : ''}${message}`;
    } catch (readError) {
      console.error('[AI Function Error Body Read]', {
        error: readError,
        type: typeof readError,
        constructor: (readError as any)?.constructor?.name,
      });
      return `${status ? `${status} — ` : ''}${fallback}`;
    }
  }

  if (typeof context === 'string') return context || fallback;
  if (typeof context?.body === 'string') {
    const message = parseResponseBodyMessage(context.body, fallback);
    return `${status ? `${status} — ` : ''}${message}`;
  }
  if (context?.body && typeof context.body === 'object') {
    const message = getObjectMessage(context.body) || fallback;
    return `${status ? `${status} — ` : ''}${message}`;
  }

  const message = getObjectMessage(context) || fallback;
  return `${status ? `${status} — ` : ''}${message}`;
};

export const AIProductUpload = () => {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [aiInstructions, setAiInstructions] = useState('');
  
  // Pricing & Inventory
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [stockQuantity, setStockQuantity] = useState('50');
  const [productKind, setProductKind] = useState<ProductKind>('tshirt');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L', 'XL', 'XXL']);
  const [selectedColors, setSelectedColors] = useState<ColorVariation[]>([]);
  const [selectedVolumes, setSelectedVolumes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState('');
  const [customVolume, setCustomVolume] = useState('');
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#111111');

  const activeKind = KIND_CONFIG.find((k) => k.key === productKind) || KIND_CONFIG[0];

  
  const [generatedData, setGeneratedData] = useState<AIProductData | null>(null);
  const [pendingQuestions, setPendingQuestions] = useState<string[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const coverImage = images[coverIndex] || images[0] || null;
  const coverPreview = imagePreviews[coverIndex] || imagePreviews[0] || null;

  const uploadAnalysisImage = async (file: File) => {
    const compressed = await compressProductImage(file);
    const fileExt = compressed.name.split('.').pop() || 'webp';
    const fileName = `ai-analysis/${Date.now()}-${brandedFileName(file.name.replace(/\.[^.]+$/, '') || 'product', fileExt)}`;

    const { error } = await supabase.storage
      .from('products')
      .upload(fileName, compressed, { contentType: compressed.type, upsert: false });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
    return publicUrl;
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name, parent_id');
    if (data) setCategories(data);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImages((current) => [...current, ...files]);
    setImagePreviews((current) => [...current, ...files.map((f) => URL.createObjectURL(f))]);
    setGeneratedData(null);
    setPendingQuestions([]);
    setQuestionAnswers({});
    if (e.target) e.target.value = '';
  };

  const removeImageAt = (index: number) => {
    setImages((current) => current.filter((_, i) => i !== index));
    setImagePreviews((current) => {
      const url = current[index];
      if (url) URL.revokeObjectURL(url);
      return current.filter((_, i) => i !== index);
    });
    setCoverIndex((current) => {
      if (index === current) return 0;
      if (index < current) return Math.max(0, current - 1);
      return current;
    });
  };

  const toggleVolume = (v: string) => {
    setSelectedVolumes((current) =>
      current.includes(v) ? current.filter((x) => x !== v) : [...current, v]
    );
  };

  const addCustomVolume = () => {
    const next = customVolume.trim().toLowerCase().replace(/\s+/g, '');
    if (!next) return;
    setSelectedVolumes((current) => Array.from(new Set([...current, next])));
    setCustomVolume('');
  };


  const toggleSize = (size: string) => {
    setSelectedSizes((current) =>
      current.includes(size) ? current.filter((value) => value !== size) : [...current, size]
    );
  };

  const addCustomSize = () => {
    const next = customSize.trim().toUpperCase();
    if (!next) return;
    setSelectedSizes((current) => Array.from(new Set([...current, next])));
    setCustomSize('');
  };

  const addColorVariation = (color: ColorVariation) => {
    const normalized = normalizeColor(color);
    if (!normalized.name) return;
    setSelectedColors((current) => normalizeColors([...current, normalized]));
  };

  const removeColorVariation = (name: string) => {
    setSelectedColors((current) => current.filter((color) => color.name !== name));
  };

  const addCustomColor = () => {
    addColorVariation({ name: customColorName, hex: customColorHex });
    setCustomColorName('');
    setCustomColorHex('#111111');
  };

  const calculatePricing = () => {
    const cp = parseFloat(costPrice) || 0;
    const sp = parseFloat(sellingPrice) || 0;
    const dp = parseFloat(discountPercent) || 0;
    
    const regularPrice = sp;
    const discountAmount = (regularPrice * dp) / 100;
    const finalPrice = regularPrice - discountAmount;
    const profit = finalPrice - cp;
    const margin = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;

    return {
      regularPrice,
      finalPrice,
      savings: discountAmount,
      profit,
      margin: margin.toFixed(1)
    };
  };

  const handleGenerate = async () => {
    if (!coverImage) {
      toast({ title: "Image required", description: "Please upload at least one product image.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    let stage: 'upload' | 'invoke' | 'parse' = 'upload';
    try {
      const imageUrl = await uploadAnalysisImage(coverImage);


      stage = 'invoke';
      const { data: parsed, error } = await supabase.functions.invoke('ai-product-analyze', {
        body: {
          imageUrl,
          instructions: aiInstructions,
          categories: categories.map(c => ({ id: c.id, name: c.name, parent_id: c.parent_id })),
          userAnswers: questionAnswers,
          previousQuestions: pendingQuestions,
        },
      });

      if (error) {
        throw new Error(await getFunctionErrorDetails(error));
      }

      if (parsed?.success === false || parsed?.error) {
        throw new Error(getObjectMessage(parsed) || 'AI returned an error.');
      }
      if (!parsed) {
        throw new Error('Empty response from AI function.');
      }

      stage = 'parse';
      const result = parsed as AIProductData;
      const aiSizes = normalizeList(result.sizes);
      const aiColors = normalizeColors(result.colorVariations);
      setGeneratedData(result);
      setSelectedSizes(aiSizes.length > 0 ? aiSizes : ['S', 'M', 'L', 'XL', 'XXL']);
      setSelectedColors(aiColors);
      setPendingQuestions(Array.isArray(result.questions) ? result.questions : []);

      if (result.questions && result.questions.length > 0) {
        toast({ title: "Need a bit more info", description: "AI has a few questions before finalizing." });
      } else {
        toast({ title: "✅ AI Generation Complete", description: "Review the generated content below." });
      }
    } catch (error: any) {
      const stageLabel =
        stage === 'upload' ? 'Image upload failed'
        : stage === 'invoke' ? 'AI request failed'
        : 'Response parsing failed';
      console.error('[AI Generate]', {
        stage: stageLabel,
        error,
        type: typeof error,
        constructor: error?.constructor?.name,
      });
      toast({
        title: `❌ ${stageLabel}`,
        description: (getObjectMessage(error) || 'Unknown error').slice(0, 400),
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerChange = (q: string, val: string) => {
    setQuestionAnswers(prev => ({ ...prev, [q]: val }));
  };


  const handlePublish = async () => {
    if (!generatedData) return;
    if (images.length === 0) {
      toast({ title: 'Image required', description: 'Please upload at least one product image.', variant: 'destructive' });
      return;
    }
    setPublishing(true);
    try {
      // 1. Compress + upload ALL images. Cover goes first.
      toast({ title: 'Optimizing images...', description: `Uploading ${images.length} image(s).` });
      const ordered = [
        images[coverIndex] || images[0],
        ...images.filter((_, i) => i !== coverIndex),
      ];
      const uploadedUrls: string[] = [];
      for (let i = 0; i < ordered.length; i++) {
        const compressed = await compressProductImage(ordered[i]);
        const fileExt = compressed.name.split('.').pop() || 'webp';
        const fileName = brandedFileName(`${generatedData?.name || 'ai-product'}-${i + 1}`, fileExt);
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, compressed, { contentType: compressed.type });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
        uploadedUrls.push(toCdnUrl(publicUrl));
      }
      const brandedUrl = uploadedUrls[0];
      const supplementaryUrls = uploadedUrls.slice(1);

      // 2. Category
      let targetCategory: string | null = generatedData.category_id ?? null;
      if (!targetCategory && generatedData.analysis?.type) {
        const t = String(generatedData.analysis.type).toLowerCase();
        targetCategory = categories.find(c => c.name.toLowerCase().includes(t) || t.includes(c.name.toLowerCase()))?.id ?? null;
      }

      if (!targetCategory) {
        toast({ title: "Category needed", description: "Please answer the AI's questions to pick a category first.", variant: "destructive" });
        setPublishing(false);
        return;
      }

      // 3. Save to Database
      const pricing = calculatePricing();
      const cleanSizes = normalizeList(selectedSizes);
      const cleanColors = normalizeColors(selectedColors);
      const cleanVolumes = normalizeList(selectedVolumes);
      const totalStock = Math.max(0, parseInt(stockQuantity) || 0);
      const { data: productRow, error } = await supabase.from('products').insert([{
        name: generatedData.name,
        price: pricing.finalPrice,
        original_price: pricing.regularPrice,
        discount: parseFloat(discountPercent) || null,
        image_url: brandedUrl,
        supplementary_images: supplementaryUrls.length > 0 ? supplementaryUrls : null,
        category_id: targetCategory,
        description: generatedData.fullDescription,
        stock_quantity: totalStock,
        in_stock: totalStock > 0,
        enable_sizes: cleanSizes.length > 0,
        enable_colors: cleanColors.length > 0,
        enable_volumes: cleanVolumes.length > 0,
        sizes: cleanSizes.length > 0 ? cleanSizes : null,
        colors: cleanColors.length > 0 ? cleanColors.map((color) => color.name) : null,
        highlights: generatedData.highlights,
        features: generatedData.features,
        care_instructions: generatedData.careInstructions,
        meta_title: generatedData.metaTitle,
        meta_description: generatedData.metaDescription,
        seo_keywords: generatedData.seoKeywords,
        ai_analysis: JSON.parse(JSON.stringify({ ...generatedData.analysis, colorVariations: cleanColors, sizes: cleanSizes, volumes: cleanVolumes }))
      }]).select('id').single();

      if (error) throw error;
      const variantRows = [
        ...cleanSizes.map((size, index) => ({
          product_id: productRow.id,
          variant_type: 'size',
          value: size,
          price: null,
          sale_price: null,
          stock_quantity: totalStock,
          image_urls: null,
          color_hex: null,
          display_order: index,
        })),
        ...cleanColors.map((color, index) => ({
          product_id: productRow.id,
          variant_type: 'color',
          value: color.name,
          price: null,
          sale_price: null,
          stock_quantity: totalStock,
          image_urls: null,
          color_hex: color.hex || null,
          display_order: index,
        })),
        ...cleanVolumes.map((vol, index) => ({
          product_id: productRow.id,
          variant_type: 'volume',
          value: vol,
          price: null,
          sale_price: null,
          stock_quantity: totalStock,
          image_urls: null,
          color_hex: null,
          display_order: index,
        })),
      ];

      if (variantRows.length > 0) {
        const { error: variantError } = await (supabase as any).from('product_variants').insert(variantRows);
        if (variantError) throw variantError;
      }
      toast({ title: "Published!", description: "Product has been added to your store." });
      
      // Reset
      setGeneratedData(null);
      imagePreviews.forEach((u) => URL.revokeObjectURL(u));
      setImages([]);
      setImagePreviews([]);
      setCoverIndex(0);
      setPendingQuestions([]);
      setQuestionAnswers({});
      setSelectedSizes(['S', 'M', 'L', 'XL', 'XXL']);
      setSelectedColors([]);
      setSelectedVolumes([]);

    } catch (error: any) {
      console.error('[AI Publish]', {
        error,
        type: typeof error,
        constructor: error?.constructor?.name,
      });
      toast({
        title: "❌ Publishing Failed",
        description: (getObjectMessage(error) || 'Unknown error').slice(0, 400),
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setPublishing(false);
      setIsPreviewOpen(false);
    }
  };

  const pricing = calculatePricing();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="text-primary h-8 w-8 animate-pulse" />
            AI Product Assistant
          </h2>
          <p className="text-muted-foreground mt-2">Upload an image and let AI build your professional product listing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image (sticky) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="lg:sticky lg:top-6 space-y-6">
            <div className="bg-card rounded-2xl border border-border overflow-hidden p-6 shadow-sm">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ImageIcon size={18} className="text-primary" />
                Product Visuals
                {images.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-[10px]">{images.length} photo{images.length > 1 ? 's' : ''}</Badge>
                )}
              </h3>

              {images.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group overflow-hidden"
                >
                  <div className="bg-primary/10 p-4 rounded-full group-hover:scale-110 transition-transform">
                    <Upload size={32} className="text-primary" />
                  </div>
                  <div className="text-center px-4">
                    <p className="font-medium">Drop product photos</p>
                    <p className="text-xs text-muted-foreground mt-1">You can add multiple. First one is the cover.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Big cover preview */}
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-border bg-secondary/20">
                    {coverPreview && (
                      <img src={coverPreview} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 shadow">
                      <Star size={11} className="fill-current" /> COVER
                    </div>
                  </div>
                  {/* Thumbnails + add tile */}
                  <div className="grid grid-cols-4 gap-2">
                    {imagePreviews.map((src, idx) => (
                      <div
                        key={src}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all group ${
                          idx === coverIndex ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setCoverIndex(idx)}
                        title={idx === coverIndex ? 'Cover image' : 'Set as cover'}
                      >
                        <img src={src} alt={`Photo ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                        {idx === coverIndex && (
                          <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full p-0.5">
                            <Star size={10} className="fill-current" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeImageAt(idx); }}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/60 hover:bg-primary/5 transition-all"
                      aria-label="Add more photos"
                    >
                      <Plus size={18} className="text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center">Click a thumbnail to make it the cover.</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" multiple />

            </div>
          </div>
        </div>

        {/* Right Column: All inputs + AI + Generated Listing */}
        <div className="lg:col-span-8 space-y-6">
          {/* Business Info + Sizes & Colors side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calculator size={18} className="text-primary" />
                Pricing & Stock

              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Cost Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
                      <Input className="pl-7" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
                      <Input className="pl-7" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="0" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Discount %</Label>
                    <Input value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Qty</Label>
                    <Input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} placeholder="50" />
                  </div>
                </div>

                {(costPrice || sellingPrice) && (
                  <div className="bg-secondary/30 p-3 rounded-lg border border-border space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Final Price:</span>
                      <span className="font-bold">৳{pricing.finalPrice}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Est. Profit:</span>
                      <span className="text-emerald-600 font-bold">৳{pricing.profit}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Margin:</span>
                      <span className={`font-bold ${parseFloat(pricing.margin) > 20 ? 'text-emerald-600' : 'text-orange-500'}`}>{pricing.margin}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Ruler size={18} className="text-primary" />
                Variants
              </h3>

              {/* Product-kind selector — controls which variant panels show below */}
              <div className="flex flex-wrap gap-1.5 mb-5 p-1 bg-secondary/40 rounded-xl border border-border">
                {KIND_CONFIG.map((k) => {
                  const active = productKind === k.key;
                  return (
                    <button
                      key={k.key}
                      type="button"
                      onClick={() => {
                        setProductKind(k.key);
                        // preload sensible size defaults per kind (only if user hasn't customized)
                        if (k.sizes && (k.key === 'tshirt' || k.key === 'pants' || k.key === 'shoes')) {
                          setSelectedSizes(k.sizes.slice(0, k.key === 'tshirt' ? 5 : k.sizes.length));
                        }
                        if (!k.showColors) setSelectedColors([]);
                        if (!k.showVolumes) setSelectedVolumes([]);
                        if (!k.sizes) setSelectedSizes([]);
                      }}
                      className={`flex-1 min-w-[92px] px-2.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-transparent text-muted-foreground hover:bg-background hover:text-foreground'
                      }`}
                    >
                      <span className="text-sm leading-none">{k.emoji}</span>
                      <span className="truncate">{k.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-5">
                {/* SIZES — only if this kind uses sizes */}
                {activeKind.sizes && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Ruler size={14} /> {activeKind.sizeLabel || 'Sizes'}</Label>
                    <div className="flex flex-wrap gap-2">
                      {activeKind.sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={`min-w-11 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                            selectedSizes.includes(size)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-border hover:border-primary/60'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={customSize}
                        onChange={(e) => setCustomSize(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSize(); } }}
                        placeholder="Custom size"
                        className="h-9"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addCustomSize}>Add</Button>
                    </div>
                    {selectedSizes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSizes.map((size) => (
                          <Badge key={size} variant="secondary" className="gap-1">
                            {size}
                            <button type="button" onClick={() => toggleSize(size)} aria-label={`Remove ${size}`}>
                              <X size={12} />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* VOLUMES — only for perfume/oil-style kinds */}
                {activeKind.showVolumes && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Droplet size={14} /> Volume / ML</Label>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_VOLUME_OPTIONS.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => toggleVolume(v)}
                          className={`min-w-14 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                            selectedVolumes.includes(v)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-border hover:border-primary/60'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={customVolume}
                        onChange={(e) => setCustomVolume(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomVolume(); } }}
                        placeholder="Custom (e.g. 75ml)"
                        className="h-9"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addCustomVolume}>Add</Button>
                    </div>
                    {selectedVolumes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedVolumes.map((v) => (
                          <Badge key={v} variant="secondary" className="gap-1">
                            {v}
                            <button type="button" onClick={() => toggleVolume(v)} aria-label={`Remove ${v}`}>
                              <X size={12} />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* COLORS — hidden for perfume */}
                {activeKind.showColors && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Palette size={14} /> Color Variations</Label>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_COLOR_OPTIONS.map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => addColorVariation(color)}
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-border bg-background hover:border-primary/60 text-xs font-medium"
                        >
                          <span className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: color.hex }} />
                          {color.name}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-[44px_1fr_auto] gap-2">
                      <Input type="color" value={customColorHex} onChange={(e) => setCustomColorHex(e.target.value)} className="h-9 p-1" />
                      <Input
                        value={customColorName}
                        onChange={(e) => setCustomColorName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomColor(); } }}
                        placeholder="Custom color"
                        className="h-9"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addCustomColor}>Add</Button>
                    </div>
                    {selectedColors.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedColors.map((color) => (
                          <Badge key={color.name} variant="secondary" className="gap-2 py-1.5">
                            <span className="w-3.5 h-3.5 rounded-full border border-border" style={{ backgroundColor: color.hex }} />
                            {color.name}
                            <button type="button" onClick={() => removeColorVariation(color.name)} aria-label={`Remove ${color.name}`}>
                              <X size={12} />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!activeKind.sizes && !activeKind.showVolumes && !activeKind.showColors && (
                  <p className="text-xs text-muted-foreground text-center py-4">This product type has no variants.</p>
                )}
              </div>
            </div>
          </div>



          {/* AI Content Strategy */}

          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              AI Content Strategy
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>AI Instructions / Style</Label>
                <Textarea 
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  placeholder="e.g. Write a premium streetwear description in English focusing on fabric quality and urban aesthetics."
                  className="min-h-[100px] bg-secondary/20"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setAiInstructions("Write in professional English.")} className="text-[10px] h-7 px-3">English Mode</Button>
                <Button variant="outline" size="sm" onClick={() => setAiInstructions("Write in catchy Bangla.")} className="text-[10px] h-7 px-3">Bangla Mode</Button>
                <Button variant="outline" size="sm" onClick={() => setAiInstructions("Focus on high-luxury branding.")} className="text-[10px] h-7 px-3">Luxury Tone</Button>
                <Button variant="outline" size="sm" onClick={() => setAiInstructions("Highlight fast nationwide delivery.")} className="text-[10px] h-7 px-3">Delivery Focus</Button>
              </div>
              
              <Button 
                onClick={handleGenerate} 
                disabled={generating || images.length === 0} 
                className="w-full h-12 text-lg font-bold gap-2 shadow-lg hover:shadow-primary/20 transition-all bg-gradient-to-r from-primary to-accent border-none"
              >
                {generating ? <Loader2 className="animate-spin h-5 w-5" /> : <Wand2 size={20} />}
                {generating ? 'AI is analyzing...' : 'Generate Product Magic'}
              </Button>
            </div>
          </div>

          {/* Clarifying questions from AI */}
          {pendingQuestions.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-300/50 p-6 shadow-sm">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-amber-900 dark:text-amber-200">
                <AlertCircle size={18} /> AI needs a bit more info
              </h3>
              <div className="space-y-3">
                {pendingQuestions.map((q, i) => (
                  <div key={i} className="space-y-1">
                    <Label className="text-sm">{q}</Label>
                    <Input
                      value={questionAnswers[q] || ''}
                      onChange={(e) => handleAnswerChange(q, e.target.value)}
                      placeholder="Your answer..."
                    />
                  </div>
                ))}
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full mt-2"
                  variant="secondary"
                >
                  {generating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Wand2 size={16} className="mr-2" />}
                  Re-generate with answers
                </Button>
              </div>
            </div>
          )}


          <AnimatePresence>
            {generatedData && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-primary/20 p-6 shadow-xl relative overflow-hidden"
              >
                {/* Background Sparkles */}
                <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-10">
                  <Sparkles size={120} className="text-primary" />
                </div>

                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <Check className="text-emerald-500" />
                    Generated Listing
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
                      <Eye size={16} className="mr-2" /> Preview
                    </Button>
                    <Button onClick={handlePublish} disabled={publishing}>
                      {publishing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save size={16} className="mr-2" />}
                      One-Click Publish
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-6">
                    <div>
                      <Label className="text-xs uppercase text-muted-foreground tracking-widest font-bold">Product Name</Label>
                      <p className="text-lg font-bold mt-1">{generatedData.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs uppercase text-muted-foreground tracking-widest font-bold">Short Description</Label>
                      <p className="text-sm mt-1 text-foreground/80 leading-relaxed italic border-l-2 border-primary/30 pl-3">{generatedData.shortDescription}</p>
                    </div>
                    <div>
                      <Label className="text-xs uppercase text-muted-foreground tracking-widest font-bold">Analysis Tags</Label>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(generatedData.analysis).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="capitalize text-[10px]">{key}: {Array.isArray(value) ? value.join(', ') : String(value)}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs uppercase text-muted-foreground tracking-widest font-bold">Sizes</Label>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedSizes.map((size) => <Badge key={size} variant="outline" className="text-[10px]">{size}</Badge>)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs uppercase text-muted-foreground tracking-widest font-bold">Colors</Label>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedColors.map((color) => (
                            <Badge key={color.name} variant="outline" className="text-[10px] gap-1">
                              <span className="w-2.5 h-2.5 rounded-full border border-border" style={{ backgroundColor: color.hex }} />
                              {color.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="text-xs uppercase text-muted-foreground tracking-widest font-bold">Features & Highlights</Label>
                      <ul className="mt-2 space-y-1.5">
                        {generatedData.highlights.map((h, i) => (
                          <li key={i} className="text-xs flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" /> {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <Label className="text-xs uppercase text-muted-foreground tracking-widest font-bold">SEO Keywords</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {generatedData.seoKeywords.map((k, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] text-muted-foreground">#{k}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="bg-secondary/20 p-4 rounded-xl border border-border">
                      <Label className="text-xs uppercase text-muted-foreground tracking-widest font-bold">Meta Data</Label>
                      <p className="text-xs font-bold mt-1 truncate">{generatedData.metaTitle}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{generatedData.metaDescription}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Preview</DialogTitle>
          </DialogHeader>
          
          {generatedData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-secondary">
                {coverPreview && <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />}
              </div>
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">{generatedData.name}</h1>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-2xl font-bold text-primary">৳{calculatePricing().finalPrice}</span>
                    {discountPercent && <span className="line-through text-muted-foreground">৳{calculatePricing().regularPrice}</span>}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Highlights</h4>
                  <ul className="space-y-2">
                    {generatedData.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check size={14} className="text-emerald-500" /> {h}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedSizes.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Available Sizes</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedSizes.map((size) => <Badge key={size} variant="secondary">{size}</Badge>)}
                      </div>
                    </div>
                  )}
                  {selectedColors.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Colors</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedColors.map((color) => (
                          <Badge key={color.name} variant="secondary" className="gap-1.5">
                            <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: color.hex }} />
                            {color.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="prose prose-sm dark:prose-invert">
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground leading-relaxed">{generatedData.fullDescription}</p>
                </div>

                <div className="pt-6 border-t border-border space-y-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <ShieldCheck size={18} className="text-primary" />
                    <span>Free delivery nationwide on orders above ৳2000</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <ShieldCheck size={18} className="text-primary" />
                    <span>7-day easy return and exchange policy</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Edit Content</Button>
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? "Publishing..." : "Confirm & Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
