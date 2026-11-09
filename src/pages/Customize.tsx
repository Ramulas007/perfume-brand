import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minus,
  Plus,
  ShoppingCart,
  UploadCloud,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Shirt,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';

/* ---------- Config ---------- */
interface ProductType {
  key: string;
  label: string;
  basePrice: number;
}

const PRODUCT_TYPES: ProductType[] = [
  { key: 'tshirt', label: 'T-Shirt', basePrice: 350 },
  { key: 'acid_wash', label: 'Acid Wash', basePrice: 500 },
  { key: 'polo', label: 'Polo Shirt', basePrice: 550 },
  { key: 'longsleeve', label: 'Long Sleeve', basePrice: 450 },
  { key: 'sweatshirt', label: 'Sweatshirt', basePrice: 750 },
  { key: 'hoodie', label: 'Hoodie', basePrice: 900 },
];

const SIZES = ['S', 'M', 'L', 'XL', '2XL'];

const COLORS = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Black', hex: '#0a0a0a' },
  { name: 'Navy', hex: '#1a2c4d' },
  { name: 'Maroon', hex: '#7b1f2b' },
  { name: 'Grey', hex: '#9ca3af' },
  { name: 'Olive', hex: '#5b6736' },
];

const PRINT_OPTIONS = [
  { key: 'logo_pocket', label: 'Logo / Pocket Print', price: 16, headpress: 8 },
  { key: 'a5', label: 'A5 Size Print', price: 24, headpress: 8 },
  { key: 'a4', label: 'A4 Size Print', price: 60, headpress: 8 },
  { key: 'a3', label: 'A3 Size Print', price: 100, headpress: 8 },
  { key: 'a2', label: 'A2 Size Print', price: 140, headpress: 8 },
];

const BRAND_LABEL_PRICE = 5;

const STEPS = [
  { num: 1, label: 'Product' },
  { num: 2, label: 'Size & Color' },
  { num: 3, label: 'Design' },
  { num: 4, label: 'Review' },
];

/* ---------- Types ---------- */
interface PrintState {
  enabled: boolean;
  instructions: string;
  file: File | null;
  preview: string | null;
}

const Customize = () => {
  const { toast } = useToast();
  const { addToCart, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
  const [productKey, setProductKey] = useState<string>('');

  // Step 2
  const [sizeQty, setSizeQty] = useState<Record<string, number>>(
    Object.fromEntries(SIZES.map((s) => [s, 0]))
  );
  const [selectedColor, setSelectedColor] = useState<string>('');

  // Step 3
  const [prints, setPrints] = useState<Record<string, PrintState>>(
    Object.fromEntries(
      PRINT_OPTIONS.map((p) => [p.key, { enabled: false, instructions: '', file: null, preview: null }])
    )
  );
  const [brandLabel, setBrandLabel] = useState<PrintState>({
    enabled: false,
    instructions: '',
    file: null,
    preview: null,
  });

  // Step 4 - contact
  const [contact, setContact] = useState({ name: '', phone: '', notes: '' });

  /* ---------- Computed ---------- */
  const product = useMemo(
    () => PRODUCT_TYPES.find((p) => p.key === productKey),
    [productKey]
  );

  const totalQty = useMemo(
    () => Object.values(sizeQty).reduce((a, b) => a + b, 0),
    [sizeQty]
  );

  const printChargePerPiece = useMemo(() => {
    let sum = 0;
    PRINT_OPTIONS.forEach((opt) => {
      if (prints[opt.key].enabled) sum += opt.price + opt.headpress;
    });
    if (brandLabel.enabled) sum += BRAND_LABEL_PRICE;
    return sum;
  }, [prints, brandLabel]);

  const pricePerPiece = (product?.basePrice || 0) + printChargePerPiece;
  const grandTotal = pricePerPiece * totalQty;

  /* ---------- Handlers ---------- */
  const updateSizeQty = (size: string, delta: number) =>
    setSizeQty((p) => ({ ...p, [size]: Math.max(0, (p[size] || 0) + delta) }));

  const togglePrint = (key: string) =>
    setPrints((p) => ({ ...p, [key]: { ...p[key], enabled: !p[key].enabled } }));

  const handleFile = (key: string | 'brand', file: File | null) => {
    if (file && file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 10MB.', variant: 'destructive' });
      return;
    }
    const preview = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    if (key === 'brand') {
      setBrandLabel((b) => ({ ...b, file, preview }));
    } else {
      setPrints((p) => ({ ...p, [key]: { ...p[key], file, preview } }));
    }
  };

  const canProceed = () => {
    if (step === 1) return !!productKey;
    if (step === 2) {
      if (!selectedColor) return false;
      if (!product) return false;
      return totalQty >= 1;
    }
    if (step === 3) {
      const anyPrint = PRINT_OPTIONS.some((o) => prints[o.key].enabled) || brandLabel.enabled;
      return anyPrint;
    }
    return true;
  };

  const buildCustomDescription = () => {
    const parts: string[] = [];
    PRINT_OPTIONS.forEach((o) => {
      if (prints[o.key].enabled) parts.push(o.label);
    });
    if (brandLabel.enabled) parts.push('Brand Label');
    return parts.length ? `Custom: ${parts.join(', ')}` : 'Custom Design';
  };

  const handleAddToCart = () => {
    if (!product || totalQty < 1 || !selectedColor) {
      toast({ title: 'Incomplete', description: 'Pick product, color & quantity first.', variant: 'destructive' });
      return;
    }
    const sizeBreakdown = SIZES.filter((s) => sizeQty[s] > 0)
      .map((s) => `${s}×${sizeQty[s]}`)
      .join(', ');

    addToCart(
      {
        id: `custom-${product.key}-${Date.now()}`,
        name: `Custom ${product.label} (${buildCustomDescription()})`,
        price: pricePerPiece,
        image: '/placeholder.svg',
        category: 'Custom',
        inStock: true,
      },
      totalQty,
      sizeBreakdown,
      selectedColor
    );

    toast({
      title: 'Added to cart! 🛒',
      description: `${totalQty} pcs custom ${product.label} — ৳${grandTotal.toLocaleString()}`,
    });
    setIsCartOpen(true);
  };

  const handleSubmit = () => {
    if (!contact.name || !contact.phone) {
      toast({ title: 'Contact info required', description: 'Name & phone please.', variant: 'destructive' });
      return;
    }
    toast({
      title: 'Custom Order Received! 🎉',
      description: `${totalQty} pcs ${product?.label} — ৳${grandTotal.toLocaleString()}. Our team will contact you shortly.`,
    });
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title="Design Your Custom Poster — Helpful Perfumes" description="Create your own custom poster with Helpful Perfumes. Choose size, finish, and upload your artwork — delivered across Bangladesh." path="/customize" />
      <Header />
      <main className="flex-1 pb-24 lg:pb-12">
        {/* Hero header */}
        <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 text-primary-foreground">
          <div className="container mx-auto px-3 md:px-6 max-w-5xl py-8 md:py-12">
            <div className="text-xs opacity-80 mb-3">
              Home / <span className="font-medium">Customize</span>
            </div>
            <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight">
              Design Your Own
            </h1>
            <p className="text-sm md:text-base opacity-90 mt-2 max-w-xl">
              Pick a product, upload your artwork, and we'll print it with luxury-grade quality.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-3 md:px-6 max-w-5xl -mt-6">
          {/* Stepper */}
          <div className="bg-card border border-border rounded-2xl shadow-md p-3 md:p-4 mb-6">
            <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto">
              {STEPS.map((s, idx) => (
                <div key={s.num} className="flex items-center gap-1 sm:gap-2 shrink-0 flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                        step === s.num
                          ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30'
                          : step > s.num
                            ? 'bg-primary/15 text-primary'
                            : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {step > s.num ? <Check size={14} /> : s.num}
                    </span>
                    <div className="hidden sm:flex flex-col leading-tight">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Step {s.num}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          step >= s.num ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 rounded-full mx-1 sm:mx-2 transition-colors ${
                        step > s.num ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr,320px] gap-6">
            {/* Form Area */}
            <div className="bg-card border border-border rounded-2xl p-5 md:p-7 shadow-sm">
              <AnimatePresence mode="wait">
                {/* STEP 1 */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h2 className="font-heading text-xl font-bold">Choose Product Type</h2>
                    <p className="text-sm text-muted-foreground">
                      Select what you want to customize.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {PRODUCT_TYPES.map((p) => {
                        const active = productKey === p.key;
                        return (
                          <button
                            key={p.key}
                            onClick={() => setProductKey(p.key)}
                            className={`relative p-4 rounded-2xl border text-left transition-all overflow-hidden group ${
                              active
                                ? 'border-primary bg-gradient-to-br from-primary/10 to-accent/30 shadow-lg ring-2 ring-primary/20'
                                : 'border-border hover:border-primary/40 hover:shadow-md bg-card'
                            }`}
                          >
                            {active && (
                              <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                                <Check size={14} />
                              </span>
                            )}
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                                active ? 'bg-primary/15' : 'bg-secondary group-hover:bg-primary/10'
                              }`}
                            >
                              <Shirt
                                size={24}
                                className={active ? 'text-primary' : 'text-muted-foreground'}
                              />
                            </div>
                            <div className="font-heading font-bold text-base">{p.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              From <span className="font-semibold text-primary">৳{p.basePrice}</span>/pc
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              No minimum order
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2 */}
                {step === 2 && product && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <h2 className="font-heading text-xl font-bold">Size, Color & Quantity</h2>
                    <p className="text-sm text-muted-foreground">
                      Order any quantity — even 1 piece for {product.label}.
                    </p>

                    {/* Color */}
                    <div className="space-y-2">
                      <Label className="font-semibold">Color {selectedColor && `: ${selectedColor}`}</Label>
                      <div className="flex flex-wrap gap-2">
                        {COLORS.map((c) => (
                          <button
                            key={c.name}
                            onClick={() => setSelectedColor(c.name)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                              selectedColor === c.name
                                ? 'border-primary ring-2 ring-primary/30'
                                : 'border-border'
                            }`}
                          >
                            <span
                              className="w-5 h-5 rounded-full border border-border"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="text-sm">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sizes */}
                    <div className="space-y-2">
                      <Label className="font-semibold">Quantity per Size</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {SIZES.map((sz) => (
                          <div
                            key={sz}
                            className="border border-border rounded-lg p-3 text-center bg-background"
                          >
                            <div className="font-bold text-sm mb-2">{sz}</div>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => updateSizeQty(sz, -1)}
                                className="w-7 h-7 rounded bg-secondary hover:bg-secondary/80 flex items-center justify-center"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-sm font-medium w-8 text-center">{sizeQty[sz]}</span>
                              <button
                                onClick={() => updateSizeQty(sz, 1)}
                                className="w-7 h-7 rounded bg-secondary hover:bg-secondary/80 flex items-center justify-center"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-sm flex justify-between items-center pt-2">
                        <span className="text-muted-foreground">Total Qty:</span>
                        <span
                          className={`font-bold ${
                            totalQty >= 1 ? 'text-green-600' : 'text-destructive'
                          }`}
                        >
                          {totalQty} pcs
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h2 className="font-heading text-xl font-bold">Upload Your Design</h2>
                    <p className="text-sm text-muted-foreground">
                      Pick the print sizes you want and upload artwork for each.
                    </p>

                    {PRINT_OPTIONS.map((opt) => (
                      <div key={opt.key} className="border border-border rounded-xl p-4 space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prints[opt.key].enabled}
                            onChange={() => togglePrint(opt.key)}
                            className="mt-1 w-4 h-4 accent-primary"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{opt.label}</div>
                            <div className="text-xs text-muted-foreground">
                              ৳{opt.price} + ৳{opt.headpress} headpress = ৳{opt.price + opt.headpress}/pc
                            </div>
                          </div>
                        </label>

                        {prints[opt.key].enabled && (
                          <div className="ml-7 space-y-3">
                            {prints[opt.key].file ? (
                              <div className="inline-flex items-center gap-3 border border-border rounded-lg p-2 bg-background">
                                {prints[opt.key].preview ? (
                                  <img
                                    src={prints[opt.key].preview!}
                                    alt="design preview"
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-16 h-16 rounded bg-secondary flex items-center justify-center text-xs">
                                    FILE
                                  </div>
                                )}
                                <div className="text-xs max-w-[140px] truncate">
                                  {prints[opt.key].file!.name}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleFile(opt.key, null)}
                                  className="ml-1 p-1 rounded hover:bg-secondary"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <label
                                htmlFor={`${opt.key}-file`}
                                className="inline-flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-accent/30 transition-colors"
                              >
                                <UploadCloud size={22} className="text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
                                <input
                                  id={`${opt.key}-file`}
                                  type="file"
                                  accept="image/*,.pdf,.ai,.psd"
                                  className="hidden"
                                  onChange={(e) => handleFile(opt.key, e.target.files?.[0] || null)}
                                />
                              </label>
                            )}

                            <Textarea
                              rows={2}
                              placeholder="Print instructions (placement, colors, notes)..."
                              value={prints[opt.key].instructions}
                              onChange={(e) =>
                                setPrints((p) => ({
                                  ...p,
                                  [opt.key]: { ...p[opt.key], instructions: e.target.value },
                                }))
                              }
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Brand Label */}
                    <div className="border border-border rounded-xl p-4 space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={brandLabel.enabled}
                          onChange={() => setBrandLabel((b) => ({ ...b, enabled: !b.enabled }))}
                          className="mt-1 w-4 h-4 accent-primary"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-sm">Add Brand Label</div>
                          <div className="text-xs text-muted-foreground">
                            ৳{BRAND_LABEL_PRICE}/pc — Inside collar / sleeve label
                          </div>
                        </div>
                      </label>

                      {brandLabel.enabled && (
                        <div className="ml-7 space-y-3">
                          {brandLabel.file ? (
                            <div className="inline-flex items-center gap-3 border border-border rounded-lg p-2 bg-background">
                              {brandLabel.preview ? (
                                <img
                                  src={brandLabel.preview}
                                  alt="brand preview"
                                  className="w-16 h-16 object-cover rounded"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded bg-secondary flex items-center justify-center text-xs">
                                  FILE
                                </div>
                              )}
                              <div className="text-xs max-w-[140px] truncate">{brandLabel.file.name}</div>
                              <button
                                type="button"
                                onClick={() => handleFile('brand', null)}
                                className="ml-1 p-1 rounded hover:bg-secondary"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <label
                              htmlFor="brand-file"
                              className="inline-flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-accent/30 transition-colors"
                            >
                              <UploadCloud size={22} className="text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
                              <input
                                id="brand-file"
                                type="file"
                                accept="image/*,.pdf,.ai,.psd"
                                className="hidden"
                                onChange={(e) => handleFile('brand', e.target.files?.[0] || null)}
                              />
                            </label>
                          )}
                          <Textarea
                            rows={2}
                            placeholder="Label placement / instructions..."
                            value={brandLabel.instructions}
                            onChange={(e) => setBrandLabel((b) => ({ ...b, instructions: e.target.value }))}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 4 */}
                {step === 4 && product && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <h2 className="font-heading text-xl font-bold">Review & Submit</h2>

                    <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Product:</span>
                        <span className="font-semibold">{product.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Color:</span>
                        <span className="font-semibold">{selectedColor || '—'}</span>
                      </div>
                      <div className="border-t border-border pt-2">
                        <div className="text-muted-foreground mb-1">Size Breakdown:</div>
                        <div className="flex flex-wrap gap-2">
                          {SIZES.filter((s) => sizeQty[s] > 0).map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 rounded bg-secondary text-xs font-medium"
                            >
                              {s}: {sizeQty[s]}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="border-t border-border pt-2">
                        <div className="text-muted-foreground mb-1">Print Selections:</div>
                        <ul className="list-disc ml-5 space-y-0.5 text-xs">
                          {PRINT_OPTIONS.filter((o) => prints[o.key].enabled).map((o) => (
                            <li key={o.key}>
                              {o.label} — ৳{o.price + o.headpress}/pc
                              {prints[o.key].file && ` (file: ${prints[o.key].file!.name})`}
                            </li>
                          ))}
                          {brandLabel.enabled && <li>Brand Label — ৳{BRAND_LABEL_PRICE}/pc</li>}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-border">
                      <h3 className="font-semibold text-sm">Your Contact Info</h3>
                      <Input
                        placeholder="Full Name *"
                        value={contact.name}
                        onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                      />
                      <Input
                        placeholder="Phone Number *"
                        value={contact.phone}
                        onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                      />
                      <Textarea
                        rows={2}
                        placeholder="Additional notes (optional)"
                        value={contact.notes}
                        onChange={(e) => setContact((c) => ({ ...c, notes: e.target.value }))}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nav Buttons */}
              <div className="flex justify-between items-center gap-2 mt-6 pt-5 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1}
                >
                  <ChevronLeft size={16} className="mr-1" /> Back
                </Button>

                {step < 4 ? (
                  <Button
                    onClick={() => setStep((s) => Math.min(4, s + 1))}
                    disabled={!canProceed()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Next <ChevronRight size={16} className="ml-1" />
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleAddToCart}
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/10"
                    >
                      <ShoppingCart size={16} className="mr-2" /> Add to Cart
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      <Check size={16} className="mr-2" /> Submit Order
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Live Price Summary */}
            <aside className="lg:sticky lg:top-24 self-start">
              <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-5 py-4">
                  <div className="text-[10px] uppercase tracking-widest opacity-80">
                    Order Summary
                  </div>
                  <h3 className="font-heading font-bold text-lg">Live Price</h3>
                </div>

                <div className="p-5 space-y-4">
                  {product ? (
                    <>
                      <div className="flex items-center gap-3 pb-3 border-b border-border">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Shirt size={18} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{product.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {selectedColor || 'No color'} • {totalQty} pcs
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base price</span>
                          <span className="font-medium">৳{product.basePrice}</span>
                        </div>
                        {PRINT_OPTIONS.filter((o) => prints[o.key].enabled).map((o) => (
                          <div key={o.key} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">+ {o.label}</span>
                            <span className="text-foreground">৳{o.price + o.headpress}</span>
                          </div>
                        ))}
                        {brandLabel.enabled && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">+ Brand Label</span>
                            <span className="text-foreground">৳{BRAND_LABEL_PRICE}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 mt-1 border-t border-dashed border-border">
                          <span className="text-xs text-muted-foreground">Per Piece</span>
                          <span className="font-bold text-primary">৳{pricePerPiece}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Quantity</span>
                          <span>× {totalQty}</span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-primary/10 to-accent/30 rounded-xl p-4 flex justify-between items-baseline">
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Grand Total
                          </div>
                          <div className="text-[10px] text-muted-foreground">incl. all charges</div>
                        </div>
                        <span className="font-heading text-2xl font-bold text-primary">
                          ৳{grandTotal.toLocaleString()}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center">
                        <Shirt size={20} className="text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Select a product to see pricing.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
      
    </div>
  );
};

export default Customize;
