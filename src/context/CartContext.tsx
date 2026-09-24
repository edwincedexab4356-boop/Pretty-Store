import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Producto } from '../types/database';

interface CartNotification {
  id: string;
  message: string;
  productName: string;
  image?: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Producto, quantity?: number) => boolean;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  shipping: number;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  notification: CartNotification | null;
  clearNotification: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'aura_store_cart_v1';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [notification, setNotification] = useState<CartNotification | null>(null);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore in private modes
    }
  }, [items]);

  const clearNotification = () => {
    setNotification(null);
  };

  const showNotification = (productName: string, image?: string | null) => {
    const id = Date.now().toString();
    setNotification({
      id,
      message: '✓ Producto agregado al carrito',
      productName,
      image,
    });

    setTimeout(() => {
      setNotification((prev) => (prev?.id === id ? null : prev));
    }, 3500);
  };

  const addItem = (product: Producto, quantity = 1): boolean => {
    if (product.stock <= 0) {
      return false;
    }

    let addedSuccessfully = false;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.product.id === product.id);

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const newQty = Math.min(currentQty + quantity, product.stock);

        if (newQty === currentQty) {
          // Ya alcanzó el stock máximo
          return prevItems;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal: Number((newQty * product.precio).toFixed(2)),
        };
        addedSuccessfully = true;
        return updated;
      } else {
        const validQty = Math.min(quantity, product.stock);
        if (validQty <= 0) return prevItems;

        addedSuccessfully = true;
        return [
          ...prevItems,
          {
            product,
            quantity: validQty,
            subtotal: Number((validQty * product.precio).toFixed(2)),
          },
        ];
      }
    });

    if (quantity > 0) {
      showNotification(product.nombre, product.imagen_url);
    }

    return addedSuccessfully;
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.product.id === productId) {
          // Limit to available stock
          const safeQty = Math.min(quantity, item.product.stock);
          return {
            ...item,
            quantity: safeQty,
            subtotal: Number((safeQty * item.product.precio).toFixed(2)),
          };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  // Computations
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = Number(
    items.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2)
  );

  // Envío gratis en compras mayores a $100, de lo contrario $5.00
  const shipping = items.length === 0 ? 0 : subtotal >= 100 ? 0 : 5.0;

  const total = Number((subtotal + shipping).toFixed(2));

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        subtotal,
        shipping,
        total,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        notification,
        clearNotification,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
