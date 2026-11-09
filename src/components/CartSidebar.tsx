import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';

export const CartSidebar = () => {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice } = useCart();
  const navigate = useNavigate();

  const goToCheckout = () => {
    setIsCartOpen(false);
    setTimeout(() => navigate('/checkout'), 0);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-background shadow-2xl z-50 flex flex-col border-l border-border rounded-l-sm overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ShoppingBag size={16} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-heading font-semibold text-base leading-none">Your Cart</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                  <div className="w-16 h-16 bg-secondary rounded-sm flex items-center justify-center">
                    <ShoppingBag size={28} className="text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Your cart is empty</p>
                    <p className="text-sm text-muted-foreground mt-1">Add products to get started</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setIsCartOpen(false); navigate('/shop'); }}
                    className="mt-2 gap-2"
                  >
                    Browse Products
                    <ArrowRight size={14} />
                  </Button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={`${item.id}-${item.selectedSize}-${item.selectedColor}-${item.selectedVolume}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                        layout
                        className="flex gap-3 p-3 bg-secondary/30 rounded-sm border border-border/40 hover:border-border/70 transition-colors"
                      >
                        {/* Image */}
                        <div className="w-18 h-18 flex-shrink-0 bg-secondary rounded-lg overflow-hidden" style={{ width: 72, height: 72 }}>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 leading-snug">{item.name}</h4>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {item.selectedSize && (
                              <span className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{item.selectedSize}</span>
                            )}
                            {item.selectedColor && (
                              <span className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{item.selectedColor}</span>
                            )}
                            {item.selectedVolume && (
                              <span className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{item.selectedVolume}</span>
                            )}
                          </div>
                          <p className="font-bold text-primary text-sm mt-1.5">৳ {(item.price * item.quantity).toLocaleString()}</p>

                          {/* Qty controls */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-border rounded-lg overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-8 h-7 flex items-center justify-center text-xs font-semibold border-x border-border">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-border space-y-3 bg-background">
                {/* Order summary */}
                <div className="bg-secondary/40 rounded-sm p-3 space-y-1.5">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground">৳ {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Shipping</span>
                    <span className="text-accent font-medium">Calculated at checkout</span>
                  </div>
                  <div className="border-t border-border/50 pt-1.5 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary text-base">৳ {totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <Button className="w-full py-5 btn-primary btn-shine gap-2 text-sm font-semibold" onClick={goToCheckout}>
                  Proceed to Checkout
                  <ArrowRight size={16} />
                </Button>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors py-1"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
