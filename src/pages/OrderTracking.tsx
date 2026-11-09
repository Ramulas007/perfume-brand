import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, MapPin, Phone, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

import { SEO } from '@/components/SEO';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  selected_size: string | null;
  selected_color: string | null;
}

interface Order {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  delivery_area: string;
  payment_method: string;
  status: string;
  total_amount: number;
  shipping_cost: number;
  created_at: string;
  order_items: OrderItem[];
}

const statusSteps = [
  { key: 'pending', label: 'অর্ডার পেন্ডিং', icon: Clock },
  { key: 'confirmed', label: 'অর্ডার কনফার্ম', icon: CheckCircle },
  { key: 'processing', label: 'প্রসেসিং', icon: Package },
  { key: 'shipped', label: 'শিপ করা হয়েছে', icon: Truck },
  { key: 'delivered', label: 'ডেলিভার্ড', icon: CheckCircle },
];

const getStatusIndex = (status: string) => {
  const index = statusSteps.findIndex(s => s.key === status);
  return index >= 0 ? index : 0;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-500';
    case 'confirmed': return 'bg-blue-500';
    case 'processing': return 'bg-purple-500';
    case 'shipped': return 'bg-orange-500';
    case 'delivered': return 'bg-green-500';
    case 'cancelled': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'cod': return 'Cash on Delivery';
    case 'bkash': return 'bKash';
    case 'nagad': return 'Nagad';
    case 'roket': return 'Rocket';
    default: return method;
  }
};

export default function OrderTracking() {
  const [searchQuery, setSearchQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Error',
        description: 'অর্ডার ID বা ফোন নম্বর দিন',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // First try to search by order ID
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .or(`id.eq.${searchQuery},phone.eq.${searchQuery}`)
        .limit(1)
        .maybeSingle();

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        setOrder(data as Order);
      } else {
        setOrder(null);
        toast({
          title: 'Not Found',
          description: 'এই তথ্য দিয়ে কোন অর্ডার পাওয়া যায়নি',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error searching order:', error);
      toast({
        title: 'Error',
        description: 'অর্ডার খুঁজতে সমস্যা হয়েছে',
        variant: 'destructive',
      });
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const currentStatusIndex = order ? getStatusIndex(order.status) : 0;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Order Tracking — Helpful Perfumes" description="Track your Helpful Perfumes order in real time using your order ID or phone number." path="/order-tracking" />
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto">
          {/* Search Section */}
          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Package className="text-primary" />
                অর্ডার ট্র্যাকিং
              </CardTitle>
              <CardDescription>
                আপনার অর্ডার ID অথবা ফোন নম্বর দিয়ে অর্ডার এর বর্তমান অবস্থা দেখুন
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="অর্ডার ID বা ফোন নম্বর"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                  ) : (
                    <>
                      <Search size={18} />
                      <span className="ml-2 hidden sm:inline">খুঁজুন</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          {order && (
            <div className="space-y-6">
              {/* Status Progress */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">অর্ডার স্ট্যাটাস</CardTitle>
                    <Badge className={getStatusColor(order.status)}>
                      {statusSteps.find(s => s.key === order.status)?.label || order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-muted" />
                    <div 
                      className="absolute left-6 top-6 w-0.5 bg-primary transition-all duration-500"
                      style={{ height: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                    />

                    {/* Status Steps */}
                    <div className="space-y-6">
                      {statusSteps.map((step, index) => {
                        const isCompleted = index <= currentStatusIndex;
                        const isCurrent = index === currentStatusIndex;
                        const StepIcon = step.icon;

                        return (
                          <div key={step.key} className="flex items-center gap-4 relative">
                            <div 
                              className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                                isCompleted 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted text-muted-foreground'
                              } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                            >
                              <StepIcon size={20} />
                            </div>
                            <div>
                              <p className={`font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {step.label}
                              </p>
                              {isCurrent && (
                                <p className="text-sm text-primary">বর্তমান অবস্থা</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">অর্ডার তথ্য</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">অর্ডার ID</p>
                      <p className="font-mono text-xs">{order.id.slice(0, 8)}...</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">তারিখ</p>
                      <p>{new Date(order.created_at).toLocaleDateString('bn-BD')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">পেমেন্ট মেথড</p>
                      <p>{getPaymentMethodLabel(order.payment_method)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ডেলিভারি এরিয়া</p>
                      <p>{order.delivery_area === 'inside_dhaka' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে'}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User size={16} className="text-muted-foreground" />
                      <span>{order.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={16} className="text-muted-foreground" />
                      <span>{order.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin size={16} className="text-muted-foreground mt-0.5" />
                      <span>{order.address}, {order.city}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">অর্ডার আইটেম</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-3 bg-muted/50 rounded-lg">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <div className="text-sm text-muted-foreground">
                            {item.selected_size && <span>Size: {item.selected_size}</span>}
                            {item.selected_size && item.selected_color && <span> • </span>}
                            {item.selected_color && <span>Color: {item.selected_color}</span>}
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-sm">Qty: {item.quantity}</span>
                            <span className="font-medium">৳{item.price}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>সাবটোটাল</span>
                        <span>৳{(order.total_amount - order.shipping_cost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>ডেলিভারি চার্জ</span>
                        <span>৳{order.shipping_cost}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>মোট</span>
                        <span>৳{order.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* No Order Found */}
          {searched && !order && !loading && (
            <Card>
              <CardContent className="py-12 text-center">
                <Package size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">কোন অর্ডার পাওয়া যায়নি</h3>
                <p className="text-muted-foreground">
                  সঠিক অর্ডার ID অথবা ফোন নম্বর দিয়ে আবার চেষ্টা করুন
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
