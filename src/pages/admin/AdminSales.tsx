import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Package, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SalesData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  recentOrders: {
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
  }[];
  salesByStatus: { status: string; count: number; total: number }[];
}

export const AdminSales = () => {
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topProducts: [],
    recentOrders: [],
    salesByStatus: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchSalesData();
  }, [period]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      // Get date filter
      let dateFilter = new Date('2000-01-01');
      const now = new Date();
      
      if (period === 'today') {
        dateFilter = new Date(now.setHours(0, 0, 0, 0));
      } else if (period === 'week') {
        dateFilter = new Date(now.setDate(now.getDate() - 7));
      } else if (period === 'month') {
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
      } else if (period === 'year') {
        dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
      }

      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch order items for top products
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_name, quantity, price');

      if (itemsError) throw itemsError;

      // Calculate statistics
      const totalSales = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Group by status
      const statusGroups: { [key: string]: { count: number; total: number } } = {};
      orders?.forEach((order) => {
        if (!statusGroups[order.status]) {
          statusGroups[order.status] = { count: 0, total: 0 };
        }
        statusGroups[order.status].count++;
        statusGroups[order.status].total += order.total_amount;
      });

      const salesByStatus = Object.entries(statusGroups).map(([status, data]) => ({
        status,
        ...data,
      }));

      // Calculate top products
      const productStats: { [key: string]: { quantity: number; revenue: number } } = {};
      orderItems?.forEach((item) => {
        if (!productStats[item.product_name]) {
          productStats[item.product_name] = { quantity: 0, revenue: 0 };
        }
        productStats[item.product_name].quantity += item.quantity;
        productStats[item.product_name].revenue += item.price * item.quantity;
      });

      const topProducts = Object.entries(productStats)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setSalesData({
        totalSales,
        totalOrders,
        averageOrderValue,
        topProducts,
        recentOrders: orders?.slice(0, 10) || [],
        salesByStatus,
      });
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch sales data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/20 text-warning';
      case 'processing':
        return 'bg-info/20 text-info';
      case 'shipped':
        return 'bg-primary/20 text-primary';
      case 'delivered':
        return 'bg-accent/20 text-accent';
      case 'cancelled':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-secondary text-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold">Sales Report</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <Calendar size={16} className="mr-2" />
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
              <DollarSign size={24} className="text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold">৳{salesData.totalSales.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <ShoppingBag size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{salesData.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-info/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Order Value</p>
              <p className="text-2xl font-bold">৳{salesData.averageOrderValue.toFixed(0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center">
              <Package size={24} className="text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Products Sold</p>
              <p className="text-2xl font-bold">
                {salesData.topProducts.reduce((sum, p) => sum + p.quantity, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
          <div className="space-y-3">
            {salesData.salesByStatus.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No data available</p>
            ) : (
              salesData.salesByStatus.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-muted-foreground">{item.count} orders</span>
                  </div>
                  <span className="font-semibold">৳{item.total.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            {salesData.topProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No data available</p>
            ) : (
              salesData.topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                >
                  <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.quantity} sold
                    </p>
                  </div>
                  <span className="font-semibold">৳{product.revenue.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          {salesData.recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders yet</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Order ID</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {salesData.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="py-3 px-2 font-mono text-sm">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-2 font-semibold">
                      ৳{order.total_amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
