import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, format, subDays } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatBDT } from '@/lib/finance';

export const AdminSalesAnalytics = () => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('orders').select('total_amount, status, created_at').then(({ data }) => setOrders(data || []));
  }, []);

  const active = orders.filter((o) => o.status !== 'cancelled');
  const now = new Date();
  const sumSince = (d: Date) => active.filter((o) => new Date(o.created_at) >= d).reduce((s, o) => s + Number(o.total_amount), 0);

  const cards = [
    { label: 'Daily Sales', value: sumSince(startOfDay(now)) },
    { label: 'Weekly Sales', value: sumSince(startOfWeek(now)) },
    { label: 'Monthly Sales', value: sumSince(startOfMonth(now)) },
    { label: 'Yearly Sales', value: sumSince(startOfYear(now)) },
  ];

  // last 14 days
  const chart = Array.from({ length: 14 }, (_, idx) => {
    const day = subDays(now, 13 - idx);
    const start = startOfDay(day);
    const end = startOfDay(subDays(now, 12 - idx));
    const total = active
      .filter((o) => new Date(o.created_at) >= start && new Date(o.created_at) < end)
      .reduce((s, o) => s + Number(o.total_amount), 0);
    return { day: format(day, 'MMM d'), total };
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Sales Analytics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card rounded-xl p-5 border border-border">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{formatBDT(c.value)}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl p-5 border border-border">
        <h3 className="font-semibold mb-4">Sales — Last 14 Days</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v: any) => formatBDT(Number(v))} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
