import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Download, FileSpreadsheet } from 'lucide-react';
import { formatBDT, exportPDF, exportExcel } from '@/lib/finance';

type Investment = { id: string; investor_name: string; amount: number; investment_date: string; notes: string | null };

export const AdminInvestments = () => {
  const [items, setItems] = useState<Investment[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);

  const empty = { investor_name: '', amount: 0, investment_date: new Date().toISOString().slice(0, 10), notes: '' };
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const { data } = await supabase.from('investments').select('*').order('investment_date', { ascending: false });
    setItems((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.investor_name) return toast.error('Investor name required');
    const payload = { ...form, amount: Number(form.amount) };
    const { error } = editing
      ? await supabase.from('investments').update(payload).eq('id', editing.id)
      : await supabase.from('investments').insert([payload]);
    if (error) return toast.error(error.message);
    toast.success(editing ? 'Updated' : 'Added');
    setOpen(false); setForm(empty); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('investments').delete().eq('id', id);
    load();
  };

  const total = items.reduce((s, i) => s + Number(i.amount), 0);
  const exportRows = () => items.map((i) => [i.investment_date, i.investor_name, Number(i.amount), i.notes || '']);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Investment Management</h2>
          <p className="text-sm text-muted-foreground">Total Investment: <span className="font-semibold text-foreground">{formatBDT(total)}</span></p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => exportPDF('Investments', ['Date', 'Investor', 'Amount', 'Notes'], exportRows())}><Download size={14} /> PDF</Button>
          <Button size="sm" variant="outline" onClick={() => exportExcel('Investments', ['Date', 'Investor', 'Amount', 'Notes'], exportRows())}><FileSpreadsheet size={14} /> Excel</Button>
          <Button size="sm" onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}><Plus size={14} /> Add Investment</Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left">
              <tr>
                <th className="p-3">Date</th><th className="p-3">Investor</th><th className="p-3">Amount</th>
                <th className="p-3">Notes</th><th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No investments yet</td></tr>
                : items.map((i) => (
                  <tr key={i.id} className="border-t border-border">
                    <td className="p-3">{i.investment_date}</td>
                    <td className="p-3 font-medium">{i.investor_name}</td>
                    <td className="p-3 font-semibold text-emerald-600">{formatBDT(Number(i.amount))}</td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">{i.notes}</td>
                    <td className="p-3 text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(i); setForm({ ...i, notes: i.notes || '' }); setOpen(true); }}><Edit size={14} /></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Investment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Investor Name</Label><Input value={form.investor_name} onChange={(e) => setForm({ ...form, investor_name: e.target.value })} /></div>
            <div><Label>Amount (৳)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div><Label>Date</Label><Input type="date" value={form.investment_date} onChange={(e) => setForm({ ...form, investment_date: e.target.value })} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button className="w-full" onClick={save}>{editing ? 'Update' : 'Add'} Investment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
