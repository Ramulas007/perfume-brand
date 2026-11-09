import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { formatBDT, exportPDF, exportExcel } from '@/lib/finance';

type Txn = { date: string; type: 'Sale' | 'Expense' | 'Investment'; description: string; amount: number };

export const AdminTransactions = () => {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const [o, e, i] = await Promise.all([
        supabase.from('orders').select('total_amount, status, full_name, created_at'),
        supabase.from('expenses').select('amount, category, notes, expense_date'),
        supabase.from('investments').select('amount, investor_name, notes, investment_date'),
      ]);
      const arr: Txn[] = [];
      (o.data || []).filter((x: any) => x.status !== 'cancelled').forEach((x: any) =>
        arr.push({ date: x.created_at.slice(0, 10), type: 'Sale', description: `Order — ${x.full_name}`, amount: Number(x.total_amount) }));
      (e.data || []).forEach((x: any) =>
        arr.push({ date: x.expense_date, type: 'Expense', description: `${x.category}${x.notes ? ' — ' + x.notes : ''}`, amount: -Number(x.amount) }));
      (i.data || []).forEach((x: any) =>
        arr.push({ date: x.investment_date, type: 'Investment', description: `${x.investor_name}${x.notes ? ' — ' + x.notes : ''}`, amount: Number(x.amount) }));
      arr.sort((a, b) => (a.date < b.date ? 1 : -1));
      setTxns(arr);
    })();
  }, []);

  const filtered = useMemo(() => txns.filter((t) =>
    (!from || t.date >= from) && (!to || t.date <= to) &&
    (!type || t.type === type) &&
    (!search || t.description.toLowerCase().includes(search.toLowerCase()))
  ), [txns, from, to, type, search]);

  const net = filtered.reduce((s, t) => s + t.amount, 0);
  const exportRows = () => filtered.map((t) => [t.date, t.type, t.description, t.amount]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Transaction History</h2>
          <p className="text-sm text-muted-foreground">Net flow: <span className={`font-semibold ${net >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{formatBDT(net)}</span></p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => exportPDF('Transactions', ['Date', 'Type', 'Description', 'Amount'], exportRows())}><Download size={14} /> PDF</Button>
          <Button size="sm" variant="outline" onClick={() => exportExcel('Transactions', ['Date', 'Type', 'Description', 'Amount'], exportRows())}><FileSpreadsheet size={14} /> Excel</Button>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border grid grid-cols-2 md:grid-cols-4 gap-3">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" />
        <select className="h-10 px-3 rounded-md border border-input bg-background" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option>Sale</option><option>Expense</option><option>Investment</option>
        </select>
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left">
              <tr><th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3">Description</th><th className="p-3 text-right">Amount</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No transactions</td></tr>
                : filtered.map((t, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="p-3">{t.date}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${t.type === 'Sale' ? 'bg-emerald-500/10 text-emerald-600' : t.type === 'Expense' ? 'bg-rose-500/10 text-rose-600' : 'bg-accent/10 text-accent'}`}>{t.type}</span></td>
                    <td className="p-3 text-muted-foreground">{t.description}</td>
                    <td className={`p-3 text-right font-semibold ${t.amount >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{formatBDT(t.amount)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
