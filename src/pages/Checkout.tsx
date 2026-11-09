import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackInitiateCheckout, trackPurchase } from '@/lib/metaPixel';
import { ArrowLeft, Minus, Plus, Trash2, CheckCircle, Printer, Tag } from 'lucide-react';
import paymentMethodsImage from '@/assets/payment-methods.png';
import bkashLogo from '@/assets/payment/bkash.png';
import nagadLogo from '@/assets/payment/nagad.png';
import rocketLogo from '@/assets/payment/rocket.png';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSidebar } from '@/components/CartSidebar';
import { OrderVoucher } from '@/components/OrderVoucher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const { paymentNumbers } = usePaymentSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const voucherRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    notes: '',
  });

  const [deliveryArea, setDeliveryArea] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad' | 'rocket'>('cod');
  const [transactionId, setTransactionId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number; discount: number } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    if (items.length > 0) {
      trackInitiateCheckout({
        content_ids: items.map((i) => i.id),
        contents: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        value: items.reduce((s, i) => s + i.price * i.quantity, 0),
        num_items: items.reduce((s, i) => s + i.quantity, 0),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Shipping cost based on delivery area
  const shippingCost = deliveryArea === 'inside_dhaka' ? 80 : 130;
  const discountAmount = appliedCoupon?.discount || 0;
  const grandTotal = totalPrice + shippingCost - discountAmount;

  // For COD, only delivery charge is collected. For bKash/Nagad, full amount is prepaid.
  const amountToPay = paymentMethod === 'cod' ? shippingCost : grandTotal;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const code = couponCode.trim().toUpperCase();
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !coupon) {
        toast({ title: 'Invalid coupon', description: 'This coupon code is not valid.', variant: 'destructive' });
        setApplyingCoupon(false);
        return;
      }

      // Check expiry
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        toast({ title: 'Coupon expired', variant: 'destructive' });
        setApplyingCoupon(false);
        return;
      }

      // Check max uses
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        toast({ title: 'Coupon limit reached', variant: 'destructive' });
        setApplyingCoupon(false);
        return;
      }

      // Check min order value
      if (coupon.min_order_value && totalPrice < Number(coupon.min_order_value)) {
        toast({ title: 'Minimum order not met', description: `Minimum order: ৳${coupon.min_order_value}`, variant: 'destructive' });
        setApplyingCoupon(false);
        return;
      }

      // Check per user limit
      if (user && coupon.per_user_limit) {
        const { count } = await supabase
          .from('coupon_usage')
          .select('id', { count: 'exact', head: true })
          .eq('coupon_id', coupon.id)
          .eq('user_id', user.id);
        if (count && count >= coupon.per_user_limit) {
          toast({ title: 'Coupon already used', description: 'You have already used this coupon.', variant: 'destructive' });
          setApplyingCoupon(false);
          return;
        }
      }

      // Product restriction check
      const applicableIds: string[] | null = (coupon as any).applicable_product_ids || null;
      const isRestricted = Array.isArray(applicableIds) && applicableIds.length > 0;
      const eligibleItems = isRestricted
        ? items.filter(i => applicableIds!.includes(i.id))
        : items;
      const eligibleSubtotal = eligibleItems.reduce((s, i) => s + i.price * i.quantity, 0);

      if (isRestricted && eligibleItems.length === 0) {
        toast({
          title: 'Coupon not applicable',
          description: 'এই কুপনটি আপনার cart-এর কোনো product-এ প্রযোজ্য নয়।',
          variant: 'destructive',
        });
        setApplyingCoupon(false);
        return;
      }

      let discount = 0;
      if (coupon.type === 'flat') {
        discount = Math.min(Number(coupon.value), eligibleSubtotal);
      } else if (coupon.type === 'percentage') {
        discount = Math.round(eligibleSubtotal * Number(coupon.value) / 100);
      } else if (coupon.type === 'free_shipping') {
        discount = shippingCost;
      }

      setAppliedCoupon({ code: coupon.code, type: coupon.type, value: Number(coupon.value), discount });
      toast({
        title: 'Coupon applied!',
        description: isRestricted
          ? `You saved ৳${discount} on ${eligibleItems.length} item(s)`
          : `You saved ৳${discount}`,
      });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to apply coupon', variant: 'destructive' });
    }
    setApplyingCoupon(false);
  };


  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrintVoucher = () => {
    if (voucherRef.current) {
      const printContent = voucherRef.current.innerHTML;
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Order Voucher</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #000; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; text-align: left; }
                th { border-bottom: 2px solid #333; }
                td { border-bottom: 1px solid #ddd; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                img { max-height: 48px; }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your cart before checkout.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.fullName || !formData.phone || !formData.address || !formData.city) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // For digital payment methods, transaction ID is required
    if (paymentMethod !== 'cod' && !transactionId.trim()) {
      toast({
        title: 'Transaction ID Required',
        description: `Please enter your ${paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Rocket'} transaction ID to confirm payment.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          total_amount: totalPrice,
          shipping_cost: shippingCost,
          full_name: formData.fullName,
          phone: formData.phone,
          email: formData.email || null,
          city: formData.city,
          address: formData.address,
          notes: formData.notes || null,
          status: 'pending',
          payment_method: paymentMethod,
          delivery_area: deliveryArea,
          coupon_code: appliedCoupon?.code || null,
          discount_amount: discountAmount,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Track coupon usage
      if (appliedCoupon && user) {
        const { data: couponData } = await supabase.from('coupons').select('id').eq('code', appliedCoupon.code).single();
        if (couponData) {
          await supabase.from('coupon_usage').insert({ coupon_id: couponData.id, user_id: user.id, order_id: order.id });
          await supabase.from('coupons').update({ used_count: (await supabase.from('coupons').select('used_count').eq('id', couponData.id).single()).data?.used_count! + 1 }).eq('id', couponData.id);
        }
      }

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_image: item.image,
        price: item.price,
        quantity: item.quantity,
        selected_size: item.selectedSize || null,
        selected_color: item.selectedColor || null,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) throw itemsError;

      trackPurchase({
        content_ids: items.map((i) => i.id),
        contents: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        value: grandTotal,
        num_items: items.reduce((s, i) => s + i.quantity, 0),
        order_id: order.id,
      });

      // Send order confirmation email (async, don't await)
      if (formData.email) {
        supabase.functions.invoke('send-order-email', {
          body: {
            orderId: order.id,
            customerEmail: formData.email,
            customerName: formData.fullName,
            orderItems: items.map((item) => ({
              product_name: item.name,
              quantity: item.quantity,
              price: item.price,
              selected_size: item.selectedSize,
              selected_color: item.selectedColor,
            })),
            totalAmount: grandTotal,
            shippingCost,
            paymentMethod,
            deliveryArea,
            address: formData.address,
            city: formData.city,
            phone: formData.phone,
          },
        }).then(({ error }) => {
          if (error) {
            console.error('Email send error:', error);
          } else {
            console.log('Order confirmation email sent');
          }
        });
      }

      clearCart();
      navigate('/order-success', { state: { orderId: order.id }, replace: true });
      return;
    } catch (error: any) {
      console.error('Order error:', error);
      setIsSubmitting(false);
      navigate('/order-failed', {
        state: { reason: error?.message || 'Failed to place order. Please try again.' },
        replace: true,
      });
      return;
    }

    setIsSubmitting(false);
  };

  // Order confirmation screen with voucher
  if (orderComplete && orderId) {
    const orderItems = items.length > 0 ? items : [];
    
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          {/* Success Message */}
          <div className="max-w-md mx-auto text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h1 className="font-heading text-3xl font-bold mb-4">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-2">Thank you for your order.</p>
            <p className="text-sm text-muted-foreground mb-4">
              Order ID: <span className="font-mono font-medium">{orderId.slice(0, 8).toUpperCase()}</span>
            </p>
            {paymentMethod === 'cod' ? (
              <p className="text-sm bg-yellow-50 text-yellow-800 p-3 rounded-lg mb-4">
                Please keep ৳{grandTotal.toFixed(2)} ready for Cash on Delivery
              </p>
            ) : (
              <p className="text-sm bg-green-50 text-green-800 p-3 rounded-lg mb-4">
                ✓ Payment of ৳{grandTotal.toFixed(2)} received via {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'}
              </p>
            )}
          </div>

          {/* Print Voucher Button */}
          <div className="flex justify-center mb-6">
            <Button onClick={handlePrintVoucher} className="btn-primary gap-2">
              <Printer size={18} />
              Print Voucher
            </Button>
          </div>

          {/* Voucher Preview */}
          <div className="border border-border rounded-lg overflow-hidden mb-8">
            <OrderVoucher
              ref={voucherRef}
              orderId={orderId}
              customerName={formData.fullName}
              phone={formData.phone}
              email={formData.email}
              address={formData.address}
              city={formData.city}
              deliveryArea={deliveryArea}
              paymentMethod={paymentMethod}
              items={orderItems.map((item) => ({
                product_name: item.name,
                product_image: item.image,
                price: item.price,
                quantity: item.quantity,
                selected_size: item.selectedSize,
                selected_color: item.selectedColor,
              }))}
              subtotal={totalPrice}
              shippingCost={shippingCost}
              grandTotal={grandTotal}
              orderDate={new Date()}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/shop')} variant="outline" className="btn-outline-primary">
              Continue Shopping
            </Button>
            {user && (
              <Button onClick={() => navigate('/profile')} className="btn-primary">
                View Orders
              </Button>
            )}
          </div>
        </main>
        <Footer />
        <CartSidebar />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="text-center py-16">
            <h1 className="font-heading text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">Add some products to continue shopping.</p>
            <Button onClick={() => navigate('/shop')} className="btn-primary">
              Continue Shopping
            </Button>
          </div>
        </main>
        <Footer />
        <CartSidebar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="font-heading text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="order-2 lg:order-1">
            <div className="bg-secondary/30 rounded-lg p-6">
              <h2 className="font-heading text-xl font-semibold mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                    className="flex gap-4 p-3 bg-background rounded-lg"
                  >
                    <div className="w-20 h-20 bg-secondary rounded-md overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                      {item.selectedSize && (
                        <p className="text-xs text-muted-foreground">Size: {item.selectedSize}</p>
                      )}
                      {item.selectedColor && (
                        <p className="text-xs text-muted-foreground">Color: {item.selectedColor}</p>
                      )}
                      {item.selectedVolume && (
                        <p className="text-xs font-medium text-primary">Volume: {item.selectedVolume}</p>
                      )}
                      <p className="font-semibold text-primary mt-1">৳ {item.price}</p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center border border-border rounded hover:bg-secondary transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center border border-border rounded hover:bg-secondary transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-destructive hover:text-destructive/80 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="border-t border-border pt-4 mb-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-primary" />
                      <span className="font-mono font-medium text-sm">{appliedCoupon.code}</span>
                      <span className="text-xs text-primary">-৳{appliedCoupon.discount}</span>
                    </div>
                    <button onClick={removeCoupon} className="text-xs text-destructive hover:underline">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      className="font-mono uppercase"
                    />
                    <Button type="button" variant="outline" onClick={applyCoupon} disabled={applyingCoupon} className="shrink-0">
                      {applyingCoupon ? '...' : 'Apply'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>৳ {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Delivery ({deliveryArea === 'inside_dhaka' ? 'Dhaka' : 'Outside Dhaka'})
                  </span>
                  <span>৳ {shippingCost.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-৳ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">৳ {grandTotal.toFixed(2)}</span>
                </div>
                {paymentMethod === 'cod' && (
                  <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm mt-2">
                    <p className="font-medium">Cash on Delivery Selected</p>
                    <p>Pay ৳{grandTotal.toFixed(2)} on delivery. Delivery charge: ৳{shippingCost.toFixed(2)}.</p>
                  </div>
                )}
                {paymentMethod !== 'cod' && (
                  <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm mt-2">
                    <p className="font-medium">
                      {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Selected
                    </p>
                    <p>Pay ৳{amountToPay.toFixed(2)} to complete your order</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Form */}
          <div className="order-1 lg:order-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="font-heading text-xl font-semibold mb-4">Shipping Information</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="01XXXXXXXXX"
                    pattern="^(?:\\+8801|01)[3-9]\\d{8}$"
                    title="Enter a valid Bangladesh mobile number"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                  />
                </div>

                {/* Delivery Area Selection */}
                <div>
                  <Label className="mb-3 block">Delivery Area *</Label>
                  <RadioGroup
                    value={deliveryArea}
                    onValueChange={(value) => setDeliveryArea(value as 'inside_dhaka' | 'outside_dhaka')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 border border-border rounded-lg p-3 flex-1 cursor-pointer hover:bg-secondary/50">
                      <RadioGroupItem value="inside_dhaka" id="inside_dhaka" />
                      <Label htmlFor="inside_dhaka" className="cursor-pointer flex-1">
                        <span className="font-medium">Inside Dhaka</span>
                        <span className="text-primary ml-2">৳80</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border border-border rounded-lg p-3 flex-1 cursor-pointer hover:bg-secondary/50">
                      <RadioGroupItem value="outside_dhaka" id="outside_dhaka" />
                      <Label htmlFor="outside_dhaka" className="cursor-pointer flex-1">
                        <span className="font-medium">Outside Dhaka</span>
                        <span className="text-primary ml-2">৳130</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter your city"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address">Full Address *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House, Road, Area, etc."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any special instructions for delivery"
                    rows={2}
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <h2 className="font-heading text-xl font-semibold mb-4">Payment Method</h2>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => {
                    setPaymentMethod(value as 'cod' | 'bkash' | 'nagad' | 'rocket');
                    setTransactionId(''); // Reset transaction ID when payment method changes
                  }}
                  className="space-y-3"
                >
                  <div
                    className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'
                    }`}
                  >
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="cursor-pointer flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">Cash on Delivery (COD)</span>
                          <p className="text-sm text-muted-foreground">Pay when you receive</p>
                        </div>
                        <span className="text-lg font-semibold text-primary">৳{grandTotal.toFixed(2)}</span>
                      </div>
                    </Label>
                  </div>

                  <div
                    className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'bkash' ? 'border-pink-500 bg-pink-50' : 'border-border hover:bg-secondary/50'
                    }`}
                  >
                    <RadioGroupItem value="bkash" id="bkash" />
                    <Label htmlFor="bkash" className="cursor-pointer flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={bkashLogo} alt="bKash" loading="lazy" className="h-8 w-auto object-contain" />
                          <p className="text-sm text-muted-foreground">Send Money করে Transaction ID দিন</p>
                        </div>
                        <span className="text-lg font-semibold text-primary">৳{grandTotal.toFixed(2)}</span>
                      </div>
                    </Label>
                  </div>

                  <div
                    className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'nagad' ? 'border-orange-500 bg-orange-50' : 'border-border hover:bg-secondary/50'
                    }`}
                  >
                    <RadioGroupItem value="nagad" id="nagad" />
                    <Label htmlFor="nagad" className="cursor-pointer flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={nagadLogo} alt="Nagad" loading="lazy" className="h-8 w-auto object-contain" />
                          <p className="text-sm text-muted-foreground">Send Money করে Transaction ID দিন</p>
                        </div>
                        <span className="text-lg font-semibold text-primary">৳{grandTotal.toFixed(2)}</span>
                      </div>
                    </Label>
                  </div>

                  <div
                    className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'rocket' ? 'border-purple-500 bg-purple-50' : 'border-border hover:bg-secondary/50'
                    }`}
                  >
                    <RadioGroupItem value="rocket" id="rocket" />
                    <Label htmlFor="rocket" className="cursor-pointer flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={rocketLogo} alt="Rocket" loading="lazy" className="h-6 w-auto object-contain" />
                          <p className="text-sm text-muted-foreground">Send Money করে Transaction ID দিন</p>
                        </div>
                        <span className="text-lg font-semibold text-primary">৳{grandTotal.toFixed(2)}</span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Payment Instructions & Transaction ID Input for Digital Payments */}
                {paymentMethod !== 'cod' && (
                  <div className="mt-4 p-4 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5">
                    <h3 className="font-semibold text-lg mb-3 text-primary">
                      {paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Rocket'} পেমেন্ট নির্দেশনা
                    </h3>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                        <p>আপনার {paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Rocket'} অ্যাপ ওপেন করুন</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                        <p><strong>"Send Money"</strong> অপশনে যান</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                        <div>
                          <p>নিচের নম্বরে <strong>৳{grandTotal.toFixed(2)}</strong> পাঠান:</p>
                          <p className={`font-mono text-lg font-bold mt-1 ${
                            paymentMethod === 'bkash' ? 'text-pink-600' : 
                            paymentMethod === 'nagad' ? 'text-orange-600' : 'text-purple-600'
                          }`}>
                            {paymentMethod === 'bkash' ? paymentNumbers.bkash : 
                             paymentMethod === 'nagad' ? paymentNumbers.nagad : paymentNumbers.rocket}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                        <p>পেমেন্ট সফল হলে <strong>Transaction ID</strong> নিচে দিন</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="transactionId" className="font-semibold">
                        Transaction ID (TrxID) *
                      </Label>
                      <Input
                        id="transactionId"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="যেমন: ABC123XYZ456"
                        className="mt-1 font-mono text-lg"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        * Transaction ID ছাড়া অর্ডার confirm হবে না
                      </p>
                    </div>
                  </div>
                )}

                {/* Accepted Payment Methods */}
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground text-center mb-2 font-medium">Accepted Payment Methods</p>
                  <img
                    src={paymentMethodsImage}
                    alt="Accepted payment methods"
                    className="w-full h-auto object-contain"
                    loading="lazy"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || (paymentMethod !== 'cod' && !transactionId.trim())} 
                className="w-full btn-primary py-3 text-lg"
              >
                {isSubmitting
                  ? 'Placing Order...'
                  : paymentMethod === 'cod'
                  ? `Place Order - Pay ৳${grandTotal.toFixed(2)} on Delivery`
                  : transactionId.trim() 
                    ? `Confirm Order (TrxID: ${transactionId.slice(0, 8)}...)`
                    : `Transaction ID দিন অর্ডার করতে`}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                {paymentMethod === 'cod'
                  ? 'Cash on Delivery. We will contact you to confirm your order.'
                  : transactionId.trim()
                    ? `✓ ${paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Rocket'} Transaction ID পাওয়া গেছে। অর্ডার করতে বাটনে ক্লিক করুন।`
                    : `আগে Send Money করে Transaction ID দিন, তারপর অর্ডার confirm হবে।`}
              </p>
            </form>
          </div>
        </div>
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
};

export default Checkout;
