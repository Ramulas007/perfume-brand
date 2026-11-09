import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Product } from '@/types/product';
import { trackAddToCart } from '@/lib/metaPixel';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, size?: string, color?: string, volume?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product: Product, quantity = 1, size?: string, color?: string, volume?: string) => {
    trackAddToCart({
      content_ids: [product.id],
      content_name: product.name,
      value: product.price * quantity,
      contents: [{ id: product.id, quantity }],
    });
    setItems((prev) => {
      const existingItem = prev.find(
        (item) =>
          item.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color &&
          item.selectedVolume === volume
      );

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color &&
          item.selectedVolume === volume
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prev, { ...product, quantity, selectedSize: size, selectedColor: color, selectedVolume: volume }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
