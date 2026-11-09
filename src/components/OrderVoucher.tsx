import { forwardRef } from 'react';
import logo from '@/assets/logo.png';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface OrderItem {
  product_name: string;
  product_image?: string;
  price: number;
  quantity: number;
  selected_size?: string;
  selected_color?: string;
}

interface OrderVoucherProps {
  orderId: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  deliveryArea: string;
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  grandTotal: number;
  orderDate: Date;
}

export const OrderVoucher = forwardRef<HTMLDivElement, OrderVoucherProps>(
  (
    {
      orderId,
      customerName,
      phone,
      email,
      address,
      city,
      deliveryArea,
      paymentMethod,
      items,
      subtotal,
      shippingCost,
      grandTotal,
      orderDate,
    },
    ref
  ) => {
    const { logoUrl, siteName } = useSiteSettings();
    const displayLogo = logoUrl || logo;

    const getPaymentMethodText = (method: string) => {
      switch (method) {
        case 'bkash':
          return 'bKash';
        case 'nagad':
          return 'Nagad';
        case 'cod':
        default:
          return 'Cash on Delivery';
      }
    };

    return (
      <div
        ref={ref}
        className="bg-white p-8 max-w-2xl mx-auto text-black print:text-black"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
          <img src={displayLogo} alt={siteName} className="h-12 mx-auto mb-2 object-contain" />
          <h1 className="text-2xl font-bold">ORDER VOUCHER</h1>
          <p className="text-sm text-gray-600">Thank you for shopping with us!</p>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p>
              <strong>Order ID:</strong> #{orderId.slice(0, 8).toUpperCase()}
            </p>
            <p>
              <strong>Date:</strong> {orderDate.toLocaleDateString('bn-BD')}
            </p>
            <p>
              <strong>Payment:</strong> {getPaymentMethodText(paymentMethod)}
            </p>
          </div>
          <div className="text-right">
            <p>
              <strong>Customer:</strong> {customerName}
            </p>
            <p>
              <strong>Phone:</strong> {phone}
            </p>
            {email && (
              <p>
                <strong>Email:</strong> {email}
              </p>
            )}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="mb-6 p-3 bg-gray-100 rounded text-sm">
          <p className="font-semibold mb-1">Delivery Address:</p>
          <p>
            {address}, {city}
          </p>
          <p className="text-gray-600">
            ({deliveryArea === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})
          </p>
        </div>

        {/* Order Items */}
        <table className="w-full mb-6 text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2">Product</th>
              <th className="text-center py-2">Qty</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-2">
                  {item.product_name}
                  {item.selected_size && (
                    <span className="text-gray-500"> (Size: {item.selected_size})</span>
                  )}
                  {item.selected_color && (
                    <span className="text-gray-500"> (Color: {item.selected_color})</span>
                  )}
                </td>
                <td className="text-center py-2">{item.quantity}</td>
                <td className="text-right py-2">৳{item.price.toFixed(2)}</td>
                <td className="text-right py-2">৳{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t-2 border-gray-300 pt-4 text-sm">
          <div className="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>৳{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Delivery Charge:</span>
            <span>৳{shippingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2 mt-2">
            <span>Grand Total:</span>
            <span>৳{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Status */}
        <div className="mt-6 p-3 rounded text-center text-sm bg-gray-100">
          {paymentMethod === 'cod' ? (
            <p>
              <strong>Amount to Pay on Delivery:</strong> ৳{grandTotal.toFixed(2)}
            </p>
          ) : (
            <p className="text-green-700 font-semibold">✓ Payment Completed via {getPaymentMethodText(paymentMethod)}</p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>This is a computer-generated voucher. No signature required.</p>
          <p className="mt-2">
            For any queries, contact us at: <strong>+880 1XXX-XXXXXX</strong>
          </p>
          <p>Website: www.yourstore.com</p>
        </div>
      </div>
    );
  }
);

OrderVoucher.displayName = 'OrderVoucher';
