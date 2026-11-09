import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Upload, GripVertical, ExternalLink, Eye, EyeOff, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toCdnUrl, brandedFileName } from '@/lib/cdn';
import { compressProductImage } from '@/lib/imageCompress';

interface ShowcaseItem {
  id: string;
  title: string | null;
  image_url: string;
  product_link: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export const AdminShowcase = () => {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ShowcaseItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    product_link: '/shop',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('latest_showcase')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to fetch showcase items', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const converted = await compressProductImage(file);
      const ext = converted.name.split('.').pop();
      const fileName = brandedFileName(formData.title || 'showcase', ext);
      const { error } = await supabase.storage.from('banners').upload(fileName, converted, { contentType: converted.type });
      if (error) throw error;
      const { data } = supabase.storage.from('banners').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, image_url: toCdnUrl(data.publicUrl) }));
      toast({ title: 'Uploaded!', description: 'Image uploaded successfully' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.image_url) {
      toast({ title: 'Image required', description: 'Please upload an image', variant: 'destructive' });
      return;
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('latest_showcase')
          .update(formData)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast({ title: 'Updated', description: 'Showcase item updated' });
      } else {
        const { error } = await supabase.from('latest_showcase').insert(formData);
        if (error) throw error;
        toast({ title: 'Added', description: 'Showcase item added' });
      }
      resetForm();
      fetchItems();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('latest_showcase').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Showcase item removed' });
      fetchItems();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('latest_showcase')
        .update({ is_active: !currentState })
        .eq('id', id);
      if (error) throw error;
      fetchItems();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const startEdit = (item: ShowcaseItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      image_url: item.image_url,
      product_link: item.product_link,
      display_order: item.display_order,
      is_active: item.is_active,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ title: '', image_url: '', product_link: '/shop', display_order: 0, is_active: true });
    setEditingItem(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Showcase Manager</h2>
          <p className="text-muted-foreground text-sm">Homepage editorial showcase slider পরিচালনা করুন</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} className="mr-2" /> Add Showcase
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{editingItem ? 'Edit' : 'Add'} Showcase Item</h3>
            <button onClick={resetForm} className="p-1 hover:bg-secondary rounded-full"><X size={18} /></button>
          </div>
          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <Label>Image *</Label>
              {formData.image_url ? (
                <div className="relative mt-2 inline-block">
                  <img src={formData.image_url} alt="Preview" className="w-40 aspect-[4/5] object-cover rounded-xl border border-border" />
                  <button onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))} className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="mt-2 w-40 aspect-[4/5] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors">
                  <Upload size={20} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload Image</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              {uploading && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sc_title">Title (Optional)</Label>
                <Input id="sc_title" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Summer Collection" />
              </div>
              <div>
                <Label htmlFor="sc_link">Product Link *</Label>
                <Input id="sc_link" value={formData.product_link} onChange={(e) => setFormData(prev => ({ ...prev, product_link: e.target.value }))} placeholder="/shop or /product/id" />
              </div>
              <div>
                <Label htmlFor="sc_order">Display Order</Label>
                <Input id="sc_order" type="number" value={formData.display_order} onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))} />
                <Label>Active</Label>
              </div>
            </div>

            {/* Or paste URL */}
            <div>
              <Label htmlFor="sc_img_url">Or paste Image URL</Label>
              <Input id="sc_img_url" value={formData.image_url} onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))} placeholder="https://..." />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit}>
                <Save size={16} className="mr-2" /> {editingItem ? 'Update' : 'Save'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="grid gap-3">
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No showcase items yet. Click "Add Showcase" to get started.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-card rounded-xl border border-border p-3 hover:shadow-md transition-shadow">
              <GripVertical size={18} className="text-muted-foreground cursor-grab flex-shrink-0" />
              <img src={item.image_url} alt={item.title || 'Showcase'} className="w-16 h-20 object-cover rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{item.title || 'Untitled'}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                  <ExternalLink size={10} /> {item.product_link}
                </p>
                <p className="text-xs text-muted-foreground">Order: {item.display_order}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(item.id, item.is_active)} className={`p-1.5 rounded-lg transition-colors ${item.is_active ? 'text-green-600 bg-green-50' : 'text-muted-foreground bg-secondary'}`}>
                  {item.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
