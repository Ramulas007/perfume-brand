import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Tag, Percent, Truck, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  code: string;
  type: 'flat' | 'percentage' | 'free_shipping';
  value: number;
  min_order_value: number;
  max_uses: number | null;
  used_count: number;
  per_user_limit: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  applicable_product_ids: string[] | null;
}

interface ProductLite {
  id: string;
  name: string;
}

export const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    type: 'flat' as 'flat' | 'percentage' | 'free_shipping',
    value: 0,
    min_order_value: 0,
    max_uses: '',
    per_user_limit: 1,
    valid_until: '',
    is_active: true,
    applicable_product_ids: [] as string[],
  });

  useEffect(() => {
    fetchCoupons();
    fetchProducts();
  }, []);

  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setCoupons(data as any);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('id, name').order('name');
    if (data) setProducts(data as ProductLite[]);
  };

  const resetForm = () => {
    setFormData({ code: '', type: 'flat', value: 0, min_order_value: 0, max_uses: '', per_user_limit: 1, valid_until: '', is_active: true, applicable_product_ids: [] });
    setEditingCoupon(null);
    setShowForm(false);
    setProductSearch('');
  };

  const handleEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      min_order_value: coupon.min_order_value,
      max_uses: coupon.max_uses?.toString() || '',
      per_user_limit: coupon.per_user_limit,
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      is_active: coupon.is_active,
      applicable_product_ids: coupon.applicable_product_ids || [],
    });
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: formData.code.toUpperCase().trim(),
      type: formData.type,
      value: formData.value,
      min_order_value: formData.min_order_value,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      per_user_limit: formData.per_user_limit,
      valid_until: formData.valid_until || null,
      is_active: formData.is_active,
      applicable_product_ids: formData.applicable_product_ids.length > 0 ? formData.applicable_product_ids : null,
    };

    if (editingCoupon) {
      const { error } = await supabase.from('coupons').update(payload as any).eq('id', editingCoupon.id);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Coupon updated!' });
    } else {
      const { error } = await supabase.from('coupons').insert(payload as any);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Coupon created!' });
    }
    resetForm();
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    fetchCoupons();
    toast({ title: 'Coupon deleted' });
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('coupons').update({ is_active: !active }).eq('id', id);
    fetchCoupons();
  };

  const toggleProduct = (id: string) => {
    setFormData(p => ({
      ...p,
      applicable_product_ids: p.applicable_product_ids.includes(id)
        ? p.applicable_product_ids.filter(x => x !== id)
        : [...p.applicable_product_ids, id],
    }));
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  const selectedProducts = useMemo(
    () => products.filter(p => formData.applicable_product_ids.includes(p.id)),
    [products, formData.applicable_product_ids]
  );

  const typeIcon = (type: string) => {
    if (type === 'flat') return <Tag size={16} className="text-primary" />;
    if (type === 'percentage') return <Percent size={16} className="text-accent" />;
    return <Truck size={16} className="text-green-600" />;
  };

  const typeLabel = (coupon: Coupon) => {
    if (coupon.type === 'flat') return `৳${coupon.value} off`;
    if (coupon.type === 'percentage') return `${coupon.value}% off`;
    return 'Free Shipping';
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Coupons</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus size={18} /> Add Coupon
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingCoupon ? 'Edit' : 'Create'} Coupon</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Code *</Label>
                <Input value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value }))} placeholder="SAVE20" required className="uppercase" />
              </div>
              <div>
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Discount (৳)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.type !== 'free_shipping' && (
                <div>
                  <Label>Value *</Label>
                  <Input type="number" value={formData.value} onChange={e => setFormData(p => ({ ...p, value: parseFloat(e.target.value) || 0 }))} min={0} />
                </div>
              )}
              <div>
                <Label>Min Order Value (৳)</Label>
                <Input type="number" value={formData.min_order_value} onChange={e => setFormData(p => ({ ...p, min_order_value: parseFloat(e.target.value) || 0 }))} min={0} />
              </div>
              <div>
                <Label>Max Uses (empty = unlimited)</Label>
                <Input type="number" value={formData.max_uses} onChange={e => setFormData(p => ({ ...p, max_uses: e.target.value }))} min={1} />
              </div>
              <div>
                <Label>Per User Limit</Label>
                <Input type="number" value={formData.per_user_limit} onChange={e => setFormData(p => ({ ...p, per_user_limit: parseInt(e.target.value) || 1 }))} min={1} />
              </div>
              <div>
                <Label>Valid Until (optional)</Label>
                <Input type="date" value={formData.valid_until} onChange={e => setFormData(p => ({ ...p, valid_until: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={formData.is_active} onCheckedChange={v => setFormData(p => ({ ...p, is_active: v }))} />
                <Label>Active</Label>
              </div>

              {/* Product restriction */}
              <div className="md:col-span-2 border-t pt-4">
                <Label className="text-base font-semibold">Apply to Specific Products (optional)</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  কিছু না বাছলে কুপন সব products এ apply হবে। নির্দিষ্ট products select করলে শুধু সেগুলোর উপর discount পাবে।
                </p>

                {selectedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedProducts.map(p => (
                      <span key={p.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                        {p.name}
                        <button type="button" onClick={() => toggleProduct(p.id)} className="hover:text-destructive">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, applicable_product_ids: [] }))}
                      className="text-xs text-muted-foreground hover:text-destructive underline"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="pl-9"
                  />
                </div>

                <div className="border rounded-lg max-h-60 overflow-y-auto divide-y">
                  {filteredProducts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No products found</p>
                  )}
                  {filteredProducts.map(p => {
                    const checked = formData.applicable_product_ids.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProduct(p.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{p.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-2 flex gap-3">
                <Button type="submit">{editingCoupon ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {coupons.length === 0 && <p className="text-center text-muted-foreground py-8">No coupons yet</p>}
        {coupons.map(coupon => (
          <Card key={coupon.id} className={`${!coupon.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  {typeIcon(coupon.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-lg">{coupon.code}</span>
                    <span className="text-sm bg-secondary px-2 py-0.5 rounded">{typeLabel(coupon)}</span>
                    {coupon.applicable_product_ids && coupon.applicable_product_ids.length > 0 && (
                      <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">
                        {coupon.applicable_product_ids.length} product{coupon.applicable_product_ids.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-3 mt-1 flex-wrap">
                    <span>Min: ৳{coupon.min_order_value}</span>
                    <span>Used: {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}</span>
                    {coupon.valid_until && <span>Expires: {format(new Date(coupon.valid_until), 'MMM dd, yyyy')}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={coupon.is_active} onCheckedChange={() => toggleActive(coupon.id, coupon.is_active)} />
                <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)}><Edit size={16} /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)} className="text-destructive"><Trash2 size={16} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
