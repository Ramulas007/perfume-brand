import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, subMonths } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { formatBDT, exportPDF, exportExcel } from '@/lib/finance';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';

type Row = { month: string; revenue: number; expenses: number; profit: number };

export const AdminFinancialReports = () => {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: orders }, { data: exps }] = await Promise.all([
        supabase.from('orders').select('total_amount, status, created_at'),
        supabase.from('expenses').select('amount, expense_date'),
      ]);
      const months = Array.from({ length: 12 }, (_, i) => startOfMonth(subMonths(new Date(), 11 - i)));
      const out: Row[] = months.map((m) => {
        const next = startOfMonth(subMonths(new Date(), 11 - (months.indexOf(m) + 1)));
        const inMonth = (d: string) => {
          const dt = new Date(d);
          return dt >= m && (months.indexOf(m) === 11 ? true : dt < next);
        };
        const rev = (orders || []).filter((o: any) => o.status !== 'cancelled' && inMonth(o.created_at)).reduce((s, o: any) => s + Number(o.total_amount), 0);
        const exp = (exps || []).filter((e: any) => inMonth(e.expense_date)).reduce((s, e: any) => s + Number(e.amount), 0);
        return { month: format(m, 'MMM yy'), revenue: rev, expenses: exp, profit: rev - exp };
      });
      setRows(out);
    })();
  }, []);

  const exportData = () => rows.map((r) => [r.month, r.revenue, r.expenses, r.profit]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Financial Reports</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => exportPDF('Monthly Financials', ['Month', 'Revenue', 'Expenses', 'Profit'], exportData())}><Download size={14} /> PDF</Button>
          <Button size="sm" variant="outline" onClick={() => exportExcel('Monthly Financials', ['Month', 'Revenue', 'Expenses', 'Profit'], exportData())}><FileSpreadsheet size={14} /> Excel</Button>
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 border border-border">
        <h3 className="font-semibold mb-4">Revenue vs Expenses</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v: any) => formatBDT(Number(v))} />
              <Legend />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 border border-border">
        <h3 className="font-semibold mb-4">Profit & Loss Trend</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v: any) => formatBDT(Number(v))} />
              <Line type="monotone" dataKey="profit" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border font-semibold">Monthly Financial Summary</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left">
              <tr><th className="p-3">Month</th><th className="p-3">Revenue</th><th className="p-3">Expenses</th><th className="p-3">Profit / Loss</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month} className="border-t border-border">
                  <td className="p-3">{r.month}</td>
                  <td className="p-3">{formatBDT(r.revenue)}</td>
                  <td className="p-3">{formatBDT(r.expenses)}</td>
                  <td className={`p-3 font-semibold ${r.profit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{formatBDT(r.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
