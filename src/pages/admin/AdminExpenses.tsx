import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Upload, Loader2, FileText, Download, FileSpreadsheet } from 'lucide-react';
import { formatBDT, exportPDF, exportExcel } from '@/lib/finance';

type Expense = {
  id: string;
  category: string;
  amount: number;
  expense_date: string;
  notes: string | null;
  voucher_url: string | null;
};

const CATEGORIES = ['Salary', 'Rent', 'Utility', 'Marketing', 'Inventory', 'Shipping', 'Office Supplies', 'Tax', 'Other'];

export const AdminExpenses = () => {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [filter, setFilter] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const empty = { category: CATEGORIES[0], amount: 0, expense_date: new Date().toISOString().slice(0, 10), notes: '', voucher_url: '' };
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
    setItems((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (e: Expense) => { setEditing(e); setForm({ ...e, notes: e.notes || '', voucher_url: e.voucher_url || '' }); setOpen(true); };

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `vouchers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('finance-vouchers').upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = await supabase.storage.from('finance-vouchers').createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    setForm((f: any) => ({ ...f, voucher_url: data?.signedUrl || path }));
    setUploading(false);
  };

  const save = async () => {
    const payload = { ...form, amount: Number(form.amount) };
    const { error } = editing
      ? await supabase.from('expenses').update(payload).eq('id', editing.id)
      : await supabase.from('expenses').insert([payload]);
    if (error) return toast.error(error.message);
    toast.success(editing ? 'Updated' : 'Added');
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    load();
  };

  const filtered = items.filter((i) =>
    !filter || i.category.toLowerCase().includes(filter.toLowerCase()) || i.notes?.toLowerCase().includes(filter.toLowerCase())
  );
  const total = filtered.reduce((s, i) => s + Number(i.amount), 0);

  const exportRows = () => filtered.map((i) => [i.expense_date, i.category, Number(i.amount), i.notes || '']);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Expense Management</h2>
          <p className="text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">{formatBDT(total)}</span> ({filtered.length})</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Search..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-40" />
          <Button size="sm" variant="outline" onClick={() => exportPDF('Expenses', ['Date', 'Category', 'Amount', 'Notes'], exportRows())}><Download size={14} /> PDF</Button>
          <Button size="sm" variant="outline" onClick={() => exportExcel('Expenses', ['Date', 'Category', 'Amount', 'Notes'], exportRows())}><FileSpreadsheet size={14} /> Excel</Button>
          <Button size="sm" onClick={openNew}><Plus size={14} /> Add Expense</Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left">
              <tr>
                <th className="p-3">Date</th><th className="p-3">Category</th><th className="p-3">Amount</th>
                <th className="p-3">Notes</th><th className="p-3">Voucher</th><th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading...</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No expenses found</td></tr>
                : filtered.map((i) => (
                  <tr key={i.id} className="border-t border-border">
                    <td className="p-3">{i.expense_date}</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-secondary rounded text-xs">{i.category}</span></td>
                    <td className="p-3 font-semibold">{formatBDT(Number(i.amount))}</td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">{i.notes}</td>
                    <td className="p-3">{i.voucher_url ? <a href={i.voucher_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1"><FileText size={14} /> View</a> : '-'}</td>
                    <td className="p-3 text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(i)}><Edit size={14} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(i.id)}><Trash2 size={14} className="text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Expense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Category</Label>
              <select className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><Label>Amount (৳)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div><Label>Date</Label><Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div>
              <Label>Voucher / Receipt (Image or PDF)</Label>
              <div className="flex gap-2 mt-1">
                <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
                </Button>
                {form.voucher_url && <a href={form.voucher_url} target="_blank" rel="noreferrer" className="text-primary text-sm self-center">View attached</a>}
              </div>
            </div>
            <Button className="w-full" onClick={save}>{editing ? 'Update' : 'Add'} Expense</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
