import { useState, useEffect } from 'react';
import { Eye, Search, RefreshCw, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Order {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  address: string;
  city: string;
  total_amount: number;
  shipping_cost: number;
  status: string;
  notes: string | null;
  created_at: string;
  tracking_code?: string;
  courier_status?: string;
  courier_name?: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  selected_size: string | null;
  selected_color: string | null;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-warning text-white' },
  { value: 'processing', label: 'Processing', color: 'bg-info text-white' },
  { value: 'shipped', label: 'Shipped', color: 'bg-primary text-primary-foreground' },
  { value: 'delivered', label: 'Delivered', color: 'bg-accent text-accent-foreground' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-destructive text-destructive-foreground' },
];

export const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSendingToCourier, setIsSendingToCourier] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    await fetchOrderItems(order.id);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Order status updated' });
      fetchOrders();
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };
  
  const handleSendToSteadfast = async (order: Order) => {
    setIsSendingToCourier(order.id);
    console.log('[Steadfast] Attempting to send order:', { orderId: order.id });
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/steadfast-courier`;
      const requestBody = { action: 'create-order', orderId: order.id };

      console.log('[Steadfast] Request:', {
        url: functionUrl,
        body: requestBody,
        hasToken: Boolean(token),
      });

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('[Steadfast] Function raw response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        body: responseText,
      });

      let data: any = null;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        console.error('[Steadfast] Response JSON parse error:', parseError);
        throw new Error(`Function returned non-JSON response (${response.status}): ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || `Function failed with status ${response.status}`);
      }

      if (data?.success === true || data?.status === 200) {
        toast({
          title: 'সফল!',
          description: 'অর্ডারটি Steadfast-এ পাঠানো হয়েছে।',
        });
        fetchOrders();
        if (selectedOrder?.id === order.id) {
          setIsModalOpen(false);
        }
      } else {
        console.error('[Steadfast] API failure response:', data);
        toast({
          title: 'ভুল হয়েছে',
          description: data?.message || data?.error || data?.rawBody || 'অর্ডারটি পাঠানো যায়নি।',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('[Steadfast] Full send error:', error);
      
      let errorMessage = 'Courier service-এর সাথে যোগাযোগ করা যায়নি।';
      
      // Handle the case where the user might not be logged in or session expired
      if (error.message?.includes('authorization')) {
        errorMessage = 'আপনার সেশন শেষ হয়ে গেছে। দয়া করে আবার লগইন করুন।';
      } else if (error instanceof Error) {
        errorMessage = `ত্রুটি: ${error.message}`;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSendingToCourier(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return (
      <Badge className={statusConfig?.color || 'bg-secondary'}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold">Orders</h2>
        <Button variant="outline" onClick={fetchOrders}>
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No orders found.
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{order.full_name}</TableCell>
                    <TableCell>{order.phone}</TableCell>
                    <TableCell className="font-semibold">
                      ৳{order.total_amount}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue>{getStatusBadge(order.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                        title="View Order"
                      >
                        <Eye size={18} />
                      </Button>
                      {!order.tracking_code ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendToSteadfast(order)}
                          disabled={isSendingToCourier === order.id}
                          className="bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                        >
                          {isSendingToCourier === order.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-rose-600" />
                          ) : (
                            <>
                              <Truck size={16} className="mr-1" />
                              Send
                            </>
                          )}
                        </Button>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 size={12} className="mr-1" />
                          Sent
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p>{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-bold text-lg">৳{selectedOrder.total_amount}</p>
                </div>
                {selectedOrder.tracking_code && (
                  <div className="col-span-2 bg-blue-50 p-3 rounded-lg flex items-center justify-between border border-blue-100">
                    <div>
                      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Courier Information</p>
                      <p className="text-sm font-medium mt-1">Courier: {selectedOrder.courier_name}</p>
                      <p className="text-sm">Tracking: <span className="font-mono">{selectedOrder.tracking_code}</span></p>
                    </div>
                    <Badge className="bg-blue-500 text-white">
                      {selectedOrder.courier_status}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Customer info */}
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p>{selectedOrder.full_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p>{selectedOrder.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p>{selectedOrder.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">City</p>
                    <p>{selectedOrder.city}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Address</p>
                    <p>{selectedOrder.address}</p>
                  </div>
                  {selectedOrder.notes && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Notes</p>
                      <p>{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order items */}
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-3">Order Items</h4>
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg"
                    >
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.selected_size && `Size: ${item.selected_size}`}
                          {item.selected_size && item.selected_color && ' | '}
                          {item.selected_color && `Color: ${item.selected_color}`}
                        </p>
                        <p className="text-sm">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">৳{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                {/* Order summary */}
                <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>৳{selectedOrder.total_amount - selectedOrder.shipping_cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>৳{selectedOrder.shipping_cost}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                    <span>Total</span>
                    <span>৳{selectedOrder.total_amount}</span>
                  </div>
                </div>
              </div>

              {/* Update status */}
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-3">Update Status</h4>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Courier Action in Modal */}
              {!selectedOrder.tracking_code && (
                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold mb-3">Courier Actions</h4>
                  <Button
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white"
                    onClick={() => handleSendToSteadfast(selectedOrder)}
                    disabled={isSendingToCourier === selectedOrder.id}
                  >
                    {isSendingToCourier === selectedOrder.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Truck size={18} className="mr-2" />
                    )}
                    Send to Steadfast Courier
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
