import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export type FinanceTotals = {
  revenue: number;
  expenses: number;
  netProfit: number;
  loss: number;
  investment: number;
  cashBalance: number;
  margin: number;
};

export async function fetchFinanceTotals(): Promise<FinanceTotals> {
  const [ordersRes, expRes, invRes] = await Promise.all([
    supabase.from('orders').select('total_amount, status'),
    supabase.from('expenses').select('amount'),
    supabase.from('investments').select('amount'),
  ]);

  const revenue =
    ordersRes.data
      ?.filter((o: any) => o.status !== 'cancelled')
      .reduce((s, o: any) => s + Number(o.total_amount || 0), 0) || 0;
  const expenses = expRes.data?.reduce((s, e: any) => s + Number(e.amount || 0), 0) || 0;
  const investment = invRes.data?.reduce((s, i: any) => s + Number(i.amount || 0), 0) || 0;
  const netProfit = revenue - expenses;
  const loss = netProfit < 0 ? Math.abs(netProfit) : 0;
  const cashBalance = investment + revenue - expenses;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return { revenue, expenses, netProfit, loss, investment, cashBalance, margin };
}

export const formatBDT = (n: number) =>
  `৳${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export function exportPDF(title: string, head: string[], rows: (string | number)[][]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.text(new Date().toLocaleString(), 14, 25);
  autoTable(doc, {
    head: [head],
    body: rows.map((r) => r.map(String)),
    startY: 30,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [120, 30, 50] },
  });
  doc.save(`${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
}

export function exportExcel(title: string, head: string[], rows: (string | number)[][]) {
  const ws = XLSX.utils.aoa_to_sheet([head, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 28));
  XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
}
