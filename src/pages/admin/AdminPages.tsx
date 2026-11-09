import { useState, useEffect } from 'react';
import { FileText, Edit, Save, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  last_updated: string;
  updated_at: string;
}

export const AdminPages = () => {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<LegalPage | null>(null);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_pages')
        .select('*')
        .order('title');

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (page: LegalPage) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingPage(null);
    setFormData({
      title: '',
      slug: '',
      content: '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setPageToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pageToDelete) return;
    try {
      const { error } = await supabase
        .from('legal_pages')
        .delete()
        .eq('id', pageToDelete);

      if (error) throw error;
      toast({ title: 'Success', description: 'Page deleted successfully' });
      fetchPages();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete page',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setPageToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPage) {
        const { error } = await supabase
          .from('legal_pages')
          .update({
            title: formData.title,
            slug: formData.slug,
            content: formData.content,
            last_updated: new Date().toISOString(),
          })
          .eq('id', editingPage.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Page updated successfully' });
      } else {
        const { error } = await supabase
          .from('legal_pages')
          .insert({
            title: formData.title,
            slug: formData.slug,
            content: formData.content,
            last_updated: new Date().toISOString(),
          });

        if (error) throw error;
        toast({ title: 'Success', description: 'Page created successfully' });
      }

      setIsModalOpen(false);
      fetchPages();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save page',
        variant: 'destructive',
      });
    }
  };

  const getPageIcon = (slug: string) => {
    switch (slug) {
      case 'return-policy':
        return '↩️';
      case 'privacy-policy':
        return '🔒';
      case 'terms-conditions':
        return '📋';
      default:
        return '📄';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Legal Pages</h2>
          <p className="text-muted-foreground">
            Manage your store's legal and informational pages.
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus size={16} className="mr-2" />
          Add New Page
        </Button>
      </div>

      {/* Pages list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-dashed">
          <FileText size={48} className="mx-auto text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground">No pages found.</p>
          <Button variant="link" onClick={handleAddNew}>Create your first page</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => (
            <div
              key={page.id}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getPageIcon(page.slug)}</span>
                  <div>
                    <h3 className="font-semibold">{page.title}</h3>
                    <p className="text-xs font-mono text-muted-foreground">/{page.slug}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(page.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground line-clamp-3 min-h-[3rem]">
                {page.content.replace(/[#*`]/g, '').substring(0, 120)}...
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Updated: {formatDate(page.last_updated || page.updated_at)}
                </span>
                <Button size="sm" variant="outline" onClick={() => handleEdit(page)}>
                  <Edit size={14} className="mr-1.5" />
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 border-b">
            <DialogTitle>{editingPage ? 'Edit Page' : 'Create New Legal Page'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Shipping Policy"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">/</span>
                  <Input
                    id="slug"
                    className="pl-6"
                    placeholder="shipping-policy"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Page Content</Label>
                <span className="text-[10px] text-muted-foreground font-medium uppercase">Markdown supported</span>
              </div>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={15}
                className="font-mono text-sm resize-none"
                placeholder="Write your page content here..."
                required
              />
            </div>

            <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-background py-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                <Save size={16} className="mr-2" />
                {editingPage ? 'Save Changes' : 'Create Page'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this legal page from your store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
