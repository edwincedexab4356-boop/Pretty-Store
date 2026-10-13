import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Producto, ProductoOpcion } from '../types/database';
import { calculatePromotions, PromoCalculationResult } from '../utils/promoUtils';

interface CartContextType {
  items: CartItem[];
  addItem: (
    product: Producto,
    quantity?: number,
    selectedSize?: string,
    selectedOption?: ProductoOpcion
  ) => boolean;
  removeItem: (productId: string, selectedSize?: string, optionId?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    selectedSize?: string,
    optionId?: string
  ) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  discount: number;
  promo: PromoCalculationResult;
  shipping: number;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  notification: { id: string; name: string; image?: string | null } | null;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'pretty_store_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState<{ id: string; name: string; image?: string | null } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Error saving cart to localStorage:', e);
    }
  }, [items]);

  const showNotification = (name: string, image?: string | null) => {
    const id = Date.now().toString();
    setNotification({ id, name, image });
    setTimeout(() => {
      setNotification((prev) => (prev?.id === id ? null : prev));
    }, 3500);
  };

  const addItem = (
    product: Producto,
    quantity = 1,
    selectedSize?: string,
    selectedOption?: ProductoOpcion
  ): boolean => {
    if (product.stock <= 0) return false;

    const cleanSize = selectedSize?.trim() || undefined;
    const optionKey = selectedOption?.id || selectedOption?.nombre || undefined;
    const unitPrice = typeof selectedOption?.precio === 'number' ? selectedOption.precio : product.precio;
    let added = false;

    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (it) =>
          it.product.id === product.id &&
          (it.selectedSize || undefined) === cleanSize &&
          (it.selectedOption?.id || it.selectedOption?.nombre || undefined) === optionKey
      );

      if (existingIdx > -1) {
        const curQty = prev[existingIdx].quantity;
        const newQty = Math.min(curQty + quantity, product.stock);
        if (newQty === curQty) return prev;

        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: newQty,
          subtotal: Number((newQty * unitPrice).toFixed(2)),
          selectedSize: cleanSize,
          selectedOption: selectedOption || next[existingIdx].selectedOption,
        };
        added = true;
        return next;
      } else {
        const validQty = Math.min(quantity, product.stock);
        if (validQty <= 0) return prev;
        added = true;
        return [
          ...prev,
          {
            product,
            quantity: validQty,
            subtotal: Number((validQty * unitPrice).toFixed(2)),
            selectedSize: cleanSize,
            selectedOption,
          },
        ];
      }
    });

    if (quantity > 0) {
      let label = product.nombre;
      if (selectedOption?.nombre) {
        label = `${product.nombre} (${selectedOption.nombre})`;
      } else if (cleanSize) {
        label = `${product.nombre} (${cleanSize})`;
      }
      showNotification(label, product.imagen_url);
    }

    return added;
  };

  const removeItem = (productId: string, selectedSize?: string, optionId?: string) => {
    const cleanSize = selectedSize?.trim() || undefined;
    const cleanOpt = optionId?.trim() || undefined;
    setItems((prev) =>
      prev.filter(
        (it) =>
          !(
            it.product.id === productId &&
            (it.selectedSize || undefined) === cleanSize &&
            (it.selectedOption?.id || it.selectedOption?.nombre || undefined) === cleanOpt
          )
      )
    );
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    selectedSize?: string,
    optionId?: string
  ) => {
    const cleanSize = selectedSize?.trim() || undefined;
    const cleanOpt = optionId?.trim() || undefined;
    if (quantity <= 0) {
      removeItem(productId, cleanSize, cleanOpt);
      return;
    }

    setItems((prev) =>
      prev.map((it) => {
        if (
          it.product.id === productId &&
          (it.selectedSize || undefined) === cleanSize &&
          (it.selectedOption?.id || it.selectedOption?.nombre || undefined) === cleanOpt
        ) {
          const validQty = Math.min(quantity, it.product.stock);
          const unitPrice = typeof it.selectedOption?.precio === 'number' ? it.selectedOption.precio : it.product.precio;
          return {
            ...it,
            quantity: validQty,
            subtotal: Number((validQty * unitPrice).toFixed(2)),
          };
        }
        return it;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = Number(
    items
      .reduce((acc, it) => {
        const unitPrice = typeof it.selectedOption?.precio === 'number' ? it.selectedOption.precio : it.product.precio;
        return acc + unitPrice * it.quantity;
      }, 0)
      .toFixed(2)
  );
  const promo = calculatePromotions(items);
  const discount = promo.totalDiscount;
  const shipping = 0;
  const total = Number(Math.max(0, subtotal - discount + shipping).toFixed(2));

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        discount,
        promo,
        shipping,
        total,
        isCartOpen,
        setIsCartOpen,
        notification,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
