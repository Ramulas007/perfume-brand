import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSidebar } from '@/components/CartSidebar';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toCdnUrl, brandedFileName } from '@/lib/cdn';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  shipping_cost: number;
  full_name: string;
  phone: string;
  city: string;
  address: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  price: number;
  quantity: number;
  selected_size: string | null;
  selected_color: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
    fetchOrders();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setFullName(data.full_name || '');
      setAvatarUrl(data.avatar_url);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (data) {
      setOrderItems(data);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      });
    }

    setIsLoading(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${brandedFileName('avatar', fileExt)}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: 'Upload failed',
        description: uploadError.message,
        variant: 'destructive',
      });
      setIsUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const newAvatarUrl = toCdnUrl(publicUrlData.publicUrl);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: newAvatarUrl })
      .eq('user_id', user.id);

    if (updateError) {
      toast({
        title: 'Error',
        description: 'Failed to update avatar.',
        variant: 'destructive',
      });
    } else {
      setAvatarUrl(newAvatarUrl);
      toast({
        title: 'Success',
        description: 'Avatar updated successfully.',
      });
    }

    setIsUploading(false);
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderItems(order.id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={18} />;
      case 'cancelled':
        return <XCircle className="text-destructive" size={18} />;
      default:
        return <Clock className="text-yellow-500" size={18} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold mb-8">My Profile</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="gap-2">
              <User size={18} />
              Profile
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Package size={18} />
              Order History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="max-w-md">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-8">
                <div
                  onClick={handleAvatarClick}
                  className="relative w-32 h-32 rounded-full bg-secondary overflow-hidden cursor-pointer group"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={48} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-background" />
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-background"></div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Click to change avatar
                </p>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user.email || ''}
                    disabled
                    className="bg-secondary"
                  />
                </div>

                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No orders yet</p>
                <Button
                  onClick={() => navigate('/shop')}
                  className="mt-4 btn-primary"
                >
                  Start Shopping
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Orders List */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Your Orders</h3>
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => handleOrderClick(order)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedOrder?.id === order.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          Order #{order.id.slice(0, 8)}
                        </span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span className="text-sm">{getStatusLabel(order.status)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="font-semibold text-foreground">
                          ৳ {(Number(order.total_amount) + Number(order.shipping_cost)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Details */}
                {selectedOrder && (
                  <div className="bg-secondary/30 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4">Order Details</h3>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedOrder.status)}
                        <span className="font-medium">
                          {getStatusLabel(selectedOrder.status)}
                        </span>
                      </div>

                      <div className="border-t border-border pt-4">
                        <h4 className="font-medium mb-2">Shipping Address</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedOrder.full_name}<br />
                          {selectedOrder.phone}<br />
                          {selectedOrder.address}<br />
                          {selectedOrder.city}
                        </p>
                      </div>

                      <div className="border-t border-border pt-4">
                        <h4 className="font-medium mb-3">Items</h4>
                        <div className="space-y-3">
                          {orderItems.map((item) => (
                            <div key={item.id} className="flex gap-3">
                              {item.product_image && (
                                <div className="w-16 h-16 bg-secondary rounded overflow-hidden flex-shrink-0">
                                  <img
                                    src={item.product_image}
                                    alt={item.product_name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm line-clamp-1">
                                  {item.product_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.selected_size && `Size: ${item.selected_size}`}
                                  {item.selected_size && item.selected_color && ' • '}
                                  {item.selected_color && `Color: ${item.selected_color}`}
                                </p>
                                <p className="text-sm">
                                  ৳ {item.price} × {item.quantity}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-border pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>৳ {Number(selectedOrder.total_amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Shipping</span>
                          <span>৳ {Number(selectedOrder.shipping_cost).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span className="text-primary">
                            ৳ {(Number(selectedOrder.total_amount) + Number(selectedOrder.shipping_cost)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
      <CartSidebar />
      
    </div>
  );
};

export default Profile;
