import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, DollarSign, Clock,
  Download, Plus, Upload, FileText, Loader2, Trash2, Receipt,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatBDT, exportPDF } from '@/lib/finance';

type Expense = {
  id: string;
  category: string;
  amount: number;
  expense_date: string;
  notes: string | null;
  voucher_url: string | null;
};

type Order = { total_amount: number; status: string; created_at: string };

const CATEGORIES = ['Salary', 'Rent', 'Utility', 'Marketing', 'Inventory', 'Shipping', 'Office', 'Tax', 'Other'];

const inRange = (iso: string, from: Date, to: Date) => {
  const d = new Date(iso);
  return d >= from && d <= to;
};

export const AdminFinanceDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [o, e] = await Promise.all([
      supabase.from('orders').select('total_amount, status, created_at'),
      supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
    ]);
    setOrders((o.data as any) || []);
    setExpenses((e.data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const totals = useMemo(() => {
    const revenue = orders.filter(o => o.status !== 'cancelled' && o.status !== 'pending')
      .reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const pending = orders.filter(o => o.status === 'pending')
      .reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const exp = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const profit = revenue - exp;
    const cash = revenue - exp;
    return { revenue, expenses: exp, profit, cash, pending };
  }, [orders, expenses]);

  const cards = [
    { label: 'Revenue', value: formatBDT(totals.revenue), icon: TrendingUp, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Expenses', value: formatBDT(totals.expenses), icon: TrendingDown, color: 'bg-rose-500/10 text-rose-600' },
    { label: 'Profit', value: formatBDT(totals.profit), icon: DollarSign, color: 'bg-primary/10 text-primary' },
    { label: 'Cash In Hand', value: formatBDT(totals.cash), icon: Wallet, color: 'bg-blue-500/10 text-blue-600' },
    { label: 'Pending Payments', value: formatBDT(totals.pending), icon: Clock, color: 'bg-amber-500/10 text-amber-600' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Finance & Reports</h2>
        <p className="text-sm text-muted-foreground">Simple money tracker for your store.</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-5">
          {loading ? (
            <div className="p-6 text-muted-foreground text-sm">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {cards.map((c, i) => (
                <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-xl p-4 md:p-5 border border-border hover:shadow-md transition-all">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
                    <c.icon size={20} />
                  </div>
                  <p className="text-xl md:text-2xl font-bold leading-tight">{c.value}</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">{c.label}</p>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* EXPENSES */}
        <TabsContent value="expenses" className="mt-5">
          <ExpensesPanel items={expenses} reload={load} />
        </TabsContent>

        {/* INVOICES */}
        <TabsContent value="invoices" className="mt-5">
          <InvoicesPanel items={expenses} reload={load} />
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports" className="mt-5">
          <ReportsPanel orders={orders} expenses={expenses} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/* ---------- Expenses Panel ---------- */
const ExpensesPanel = ({ items, reload }: { items: Expense[]; reload: () => void }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const empty = { category: CATEGORIES[0], amount: '', expense_date: new Date().toISOString().slice(0, 10), notes: '', voucher_url: '' };
  const [form, setForm] = useState<any>(empty);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (e: Expense) => { setEditing(e); setForm({ ...e, notes: e.notes || '', voucher_url: e.voucher_url || '' }); setOpen(true); };

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `vouchers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('finance-vouchers').upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = await supabase.storage.from('finance-vouchers').createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    setForm((f: any) => ({ ...f, voucher_url: data?.signedUrl || path }));
    setUploading(false);
  };

  const save = async () => {
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount');
    const payload = {
      category: form.category, amount: Number(form.amount), expense_date: form.expense_date,
      notes: form.notes || null, voucher_url: form.voucher_url || null,
    };
    const { error } = editing
      ? await supabase.from('expenses').update(payload).eq('id', editing.id)
      : await supabase.from('expenses').insert([payload]);
    if (error) return toast.error(error.message);
    toast.success(editing ? 'Updated' : 'Expense added');
    setOpen(false); reload();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    reload();
  };

  const total = items.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          {items.length} entries · Total <span className="font-semibold text-foreground">{formatBDT(total)}</span>
        </p>
        <Button size="sm" onClick={openNew}><Plus size={14} className="mr-1" /> Add Expense</Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left">
              <tr>
                <th className="p-3">Date</th><th className="p-3">Category</th>
                <th className="p-3">Amount</th><th className="p-3 hidden md:table-cell">Note</th>
                <th className="p-3">File</th><th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No expenses yet</td></tr>
              ) : items.map(i => (
                <tr key={i.id} className="border-t border-border">
                  <td className="p-3 whitespace-nowrap">{i.expense_date}</td>
                  <td className="p-3"><span className="px-2 py-0.5 bg-secondary rounded text-xs">{i.category}</span></td>
                  <td className="p-3 font-semibold">{formatBDT(Number(i.amount))}</td>
                  <td className="p-3 text-muted-foreground max-w-xs truncate hidden md:table-cell">{i.notes}</td>
                  <td className="p-3">{i.voucher_url ? <a href={i.voucher_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1"><FileText size={14} /></a> : '-'}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(i)}><FileText size={14} /></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'Edit Expense' : 'Add Expense'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name / Category</Label>
              <select className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><Label>Amount (৳)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" /></div>
            <div><Label>Date</Label><Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></div>
            <div><Label>Note</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" /></div>
            <div>
              <Label>Invoice / Receipt (Image or PDF)</Label>
              <div className="flex items-center gap-2 mt-1">
                <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Upload size={14} className="mr-1" />} Upload
                </Button>
                {form.voucher_url && <a href={form.voucher_url} target="_blank" rel="noreferrer" className="text-primary text-sm">Attached</a>}
              </div>
            </div>
            <Button className="w-full" onClick={save}>{editing ? 'Update' : 'Save Expense'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ---------- Invoices Panel ---------- */
const InvoicesPanel = ({ items, reload }: { items: Expense[]; reload: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const invoices = items.filter(i => i.voucher_url);

  const onUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `invoices/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('finance-vouchers').upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = await supabase.storage.from('finance-vouchers').createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    const { error: insErr } = await supabase.from('expenses').insert([{
      category: 'Invoice', amount: 0, expense_date: new Date().toISOString().slice(0, 10),
      notes: file.name, voucher_url: data?.signedUrl || path,
    }]);
    setUploading(false);
    if (insErr) return toast.error(insErr.message);
    toast.success('Invoice uploaded');
    reload();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">{invoices.length} invoice files</p>
        <div>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Upload size={14} className="mr-1" />} Upload Invoice
          </Button>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground">
          <Receipt size={32} className="mx-auto mb-2 opacity-50" />
          No invoices uploaded yet
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {invoices.map(inv => (
            <a key={inv.id} href={inv.voucher_url!} target="_blank" rel="noreferrer"
              className="group bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all">
              <div className="aspect-square bg-secondary/50 rounded-lg flex items-center justify-center mb-2">
                <FileText size={28} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xs font-medium truncate">{inv.notes || inv.category}</p>
              <p className="text-[10px] text-muted-foreground">{inv.expense_date}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- Reports Panel ---------- */
const ReportsPanel = ({ orders, expenses }: { orders: Order[]; expenses: Expense[] }) => {
  const now = new Date();
  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const periods = [
    { key: 'This Month', from: startOfMonth(now), to: endOfMonth(now) },
    { key: 'Last Month', from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) },
    { key: 'This Year', from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear(), 11, 31, 23, 59, 59) },
  ];

  const compute = (from: Date, to: Date) => {
    const rev = orders.filter(o => o.status !== 'cancelled' && o.status !== 'pending' && inRange(o.created_at, from, to))
      .reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const exp = expenses.filter(e => inRange(e.expense_date, from, to))
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    return { revenue: rev, expenses: exp, profit: rev - exp };
  };

  const rows = periods.map(p => {
    const r = compute(p.from, p.to);
    return { period: p.key, ...r };
  });

  const downloadPDF = () => {
    exportPDF(
      'Finance Report',
      ['Period', 'Revenue', 'Expenses', 'Profit'],
      rows.map(r => [r.period, formatBDT(r.revenue), formatBDT(r.expenses), formatBDT(r.profit)])
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">Revenue, expenses and profit by period.</p>
        <Button size="sm" variant="outline" onClick={downloadPDF}><Download size={14} className="mr-1" /> Export PDF</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {rows.map(r => (
          <div key={r.period} className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm font-semibold text-muted-foreground">{r.period}</p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-semibold text-emerald-600">{formatBDT(r.revenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expenses</span>
                <span className="font-semibold text-rose-600">{formatBDT(r.expenses)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-semibold">Profit</span>
                <span className={`font-bold ${r.profit >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatBDT(r.profit)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
