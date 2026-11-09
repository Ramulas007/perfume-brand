import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Edit, Trash2, FolderTree, ArrowLeft, ChevronRight, ArrowUp, ArrowDown, Folder, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toCdnUrl, brandedFileName } from '@/lib/cdn';
import { compressProductImage } from '@/lib/imageCompress';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  section_banner_url: string | null;
  parent_id: string | null;
  display_order: number;
  created_at: string;
}

export const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewingParentId, setViewingParentId] = useState<string | null>(null);
  const { toast } = useToast();
  const [uploading, setUploading] = useState<'image' | 'banner' | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, field: 'image_url' | 'section_banner_url') => {
    try {
      setUploading(field === 'image_url' ? 'image' : 'banner');
      const converted = await compressProductImage(file);
      const ext = converted.name.split('.').pop();
      const fileName = brandedFileName(`category-${field}`, ext);
      const { error } = await supabase.storage.from('banners').upload(fileName, converted, { upsert: true, contentType: converted.type });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, [field]: toCdnUrl(publicUrl) }));
      toast({ title: 'Uploaded', description: 'Image uploaded successfully' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image_url: '',
    section_banner_url: '',
    parent_id: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({ title: 'Error', description: 'Failed to fetch categories', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({ ...formData, name, slug: editingCategory ? formData.slug : generateSlug(name) });
  };

  const visibleList = useMemo(() => {
    return categories.filter(c => (c.parent_id || null) === viewingParentId);
  }, [categories, viewingParentId]);

  const viewingParent = viewingParentId ? categories.find(c => c.id === viewingParentId) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoryData = {
      name: formData.name,
      slug: formData.slug || generateSlug(formData.name),
      image_url: formData.image_url || null,
      section_banner_url: formData.section_banner_url || null,
      parent_id: formData.parent_id || null,
    };

    try {
      if (editingCategory) {
        const { error } = await supabase.from('categories').update(categoryData).eq('id', editingCategory.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Category updated successfully' });
      } else {
        // assign next display_order within siblings
        const siblings = categories.filter(c => (c.parent_id || null) === (categoryData.parent_id || null));
        const nextOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.display_order ?? 0)) + 1 : 0;
        const { error } = await supabase.from('categories').insert([{ ...categoryData, display_order: nextOrder }]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Category created successfully' });
      }

      setIsModalOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save category', variant: 'destructive' });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      image_url: category.image_url || '',
      section_banner_url: category.section_banner_url || '',
      parent_id: category.parent_id || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const hasChildren = categories.some(c => c.parent_id === id);
    if (hasChildren && !confirm('This category has sub-categories. Deleting it will also remove all its sub-categories. Continue?')) return;
    if (!hasChildren && !confirm('Are you sure you want to delete this category?')) return;

    try {
      if (hasChildren) {
        await supabase.from('categories').delete().eq('parent_id', id);
      }
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Category deleted successfully' });
      fetchCategories();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete category', variant: 'destructive' });
    }
  };

  const moveCategory = async (category: Category, direction: -1 | 1) => {
    const siblings = categories
      .filter(c => (c.parent_id || null) === (category.parent_id || null))
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    const idx = siblings.findIndex(c => c.id === category.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const other = siblings[swapIdx];
    try {
      await Promise.all([
        supabase.from('categories').update({ display_order: other.display_order }).eq('id', category.id),
        supabase.from('categories').update({ display_order: category.display_order }).eq('id', other.id),
      ]);
      fetchCategories();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to reorder', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', image_url: '', section_banner_url: '', parent_id: '' });
  };

  const openCreateMain = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openCreateSub = () => {
    if (!viewingParentId) return;
    resetForm();
    setFormData(prev => ({ ...prev, parent_id: viewingParentId }));
    setIsModalOpen(true);
  };

  const countChildren = (id: string) => categories.filter(c => c.parent_id === id).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setViewingParentId(null)}
            className={`font-semibold ${viewingParent ? 'text-muted-foreground hover:text-foreground' : 'text-foreground'} transition-colors`}
          >
            Main Categories
          </button>
          {viewingParent && (
            <>
              <ChevronRight size={14} className="text-muted-foreground" />
              <span className="font-semibold text-foreground">{viewingParent.name}</span>
              <span className="text-muted-foreground">— Sub Categories</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {viewingParent && (
            <Button variant="outline" size="sm" onClick={() => setViewingParentId(null)}>
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          )}
          {viewingParent ? (
            <Button onClick={openCreateSub}>
              <Plus size={16} className="mr-2" />
              Create Sub Category
            </Button>
          ) : (
            <Button onClick={openCreateMain}>
              <Plus size={16} className="mr-2" />
              Add Main Category
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : visibleList.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border/50">
          <FolderTree size={48} className="mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">
            {viewingParent ? 'No sub-categories yet. Create your first sub-category!' : 'No categories yet. Add your first main category!'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
          {visibleList.map((category, index) => {
            const childCount = countChildren(category.id);
            return (
              <div key={category.id} className="flex items-center gap-3 p-3 hover:bg-secondary/40 transition-colors">
                {/* Order controls */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveCategory(category, -1)}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move up"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={() => moveCategory(category, 1)}
                    disabled={index === visibleList.length - 1}
                    className="p-1 rounded hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move down"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>

                {/* Image */}
                {category.image_url ? (
                  <img src={category.image_url} alt={category.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                    <Folder size={20} className="text-muted-foreground" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{category.name}</p>
                  <p className="text-xs text-muted-foreground truncate">/{category.slug}{!viewingParent && childCount > 0 && ` · ${childCount} sub-categories`}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!viewingParent && (
                    <Button variant="outline" size="sm" onClick={() => { setViewingParentId(category.id); setExpandedReset(); }}>
                      Manage Subs
                      <ChevronRight size={14} className="ml-1" />
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                    <Edit size={14} />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(category.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? 'Edit Category'
                : formData.parent_id
                ? `Add Sub Category${viewingParent ? ` in ${viewingParent.name}` : ''}`
                : 'Add New Main Category'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name *</Label>
              <Input id="name" value={formData.name} onChange={handleNameChange} required />
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="auto-generated-from-name"
              />
            </div>

            <div>
              <Label>Category Image</Label>
              {formData.image_url && (
                <img src={formData.image_url} alt="preview" className="w-24 h-24 rounded-lg object-cover border my-2" />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={uploading === 'image'}>
                  {uploading === 'image' ? <Loader2 size={14} className="animate-spin mr-1" /> : <Upload size={14} className="mr-1" />}
                  Upload
                </Button>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'image_url'); e.target.value = ''; }} />
              </div>
              <Input className="mt-2" value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="or paste URL" />
            </div>

            <div>
              <Label>Section Banner (shown beside products, 3:4 portrait)</Label>
              {formData.section_banner_url && (
                <img src={formData.section_banner_url} alt="preview" className="w-20 h-28 rounded-lg object-cover border my-2" />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => bannerInputRef.current?.click()} disabled={uploading === 'banner'}>
                  {uploading === 'banner' ? <Loader2 size={14} className="animate-spin mr-1" /> : <Upload size={14} className="mr-1" />}
                  Upload
                </Button>
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'section_banner_url'); e.target.value = ''; }} />
              </div>
              <Input className="mt-2" value={formData.section_banner_url}
                onChange={(e) => setFormData({ ...formData, section_banner_url: e.target.value })}
                placeholder="or paste URL" />
            </div>

            <div>
              <Label htmlFor="parent_id">Parent Category</Label>
              <select
                id="parent_id"
                value={formData.parent_id}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— None (Main Category) —</option>
                {categories
                  .filter(c => !c.parent_id && c.id !== editingCategory?.id)
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for a main category. Choose a parent to make this a sub-category.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// no-op helper to keep linter happy if subviews need reset hooks later
function setExpandedReset() {}
