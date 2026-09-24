import React, { useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const CartDrawer: React.FC = () => {
  const {
    items,
    totalItems,
    subtotal,
    shipping,
    total,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    setIsCheckoutOpen,
  } = useCart();

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };
    if (isCartOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const freeShippingThreshold = 100;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <aside
          className="w-screen max-w-md bg-[#0c0c0f] border-l border-white/[0.08] shadow-2xl flex flex-col transform transition-transform duration-300 ease-out"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-title"
        >
          {/* Cart Header */}
          <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-[#09090b]">
            <div className="flex items-center gap-3">
              <ShoppingBag size={18} className="stroke-[1.5] text-stone-200" />
              <div>
                <h2 id="cart-title" className="text-base font-serif-luxury font-medium tracking-wide text-white">
                  Bolsa de Compras
                </h2>
                <p className="text-[11px] text-stone-400 font-light">
                  {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-stone-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Cerrar bolsa de compras"
            >
              <X size={18} />
            </button>
          </div>

          {/* Free Shipping Notice */}
          {items.length > 0 && (
            <div className="px-6 py-2.5 bg-stone-900/60 border-b border-white/[0.06] text-xs text-stone-300 flex items-center justify-between">
              {remainingForFreeShipping > 0 ? (
                <span className="font-light text-[11px]">
                  Agrega <strong className="text-white font-mono font-medium">${remainingForFreeShipping.toFixed(2)}</strong> para <span className="text-[#c5a059]">envío sin costo</span>
                </span>
              ) : (
                <span className="text-[#c5a059] font-medium text-[11px]">
                  Envío prioritario sin costo incluido
                </span>
              )}
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 divide-y divide-white/[0.06]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-stone-500 mb-4 bg-stone-900/50">
                  <ShoppingBag size={22} className="stroke-[1.5]" />
                </div>
                <h3 className="text-base font-serif-luxury font-normal text-white mb-1">
                  Tu bolsa está vacía
                </h3>
                <p className="text-xs text-stone-400 max-w-xs mb-6 font-light">
                  Descubre nuestras piezas de perfumería, relojería y accesorios exclusivos.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-white hover:bg-stone-200 text-stone-950 text-xs uppercase tracking-[0.16em] font-medium transition-colors cursor-pointer"
                >
                  Explorar Tienda
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="pt-5 first:pt-0 flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-18 h-22 sm:w-20 sm:h-24 bg-stone-900 border border-white/10 shrink-0 overflow-hidden">
                    <img
                      src={item.product.imagen_url || '/images/logo/logotipo.jpeg'}
                      alt={item.product.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/logo/logotipo.jpeg';
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-serif-luxury font-normal text-white truncate">
                          {item.product.nombre}
                        </h4>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-stone-500 hover:text-rose-400 transition-colors cursor-pointer p-1"
                          title="Eliminar artículo"
                          aria-label={`Eliminar ${item.product.nombre}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-xs font-mono tabular-nums text-[#c5a059] mt-0.5">
                        ${item.product.precio.toFixed(2)}
                      </p>
                    </div>

                    {/* Stepper Controls & Subtotal */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-white/15">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-stone-300 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
                          disabled={item.quantity <= 1}
                          aria-label="Disminuir cantidad"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-8 text-center text-xs font-mono tabular-nums text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-stone-300 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
                          disabled={item.quantity >= item.product.stock}
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <span className="text-sm font-mono tabular-nums text-white font-medium">
                        ${(item.product.precio * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-white/[0.08] bg-[#09090b] space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-400 font-light">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-400 font-light">
                  <span>Envío</span>
                  <span className="font-mono tabular-nums text-white">
                    {shipping === 0 ? (
                      <span className="text-[#c5a059]">Gratis</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-sm">
                  <span className="uppercase tracking-[0.16em] text-xs font-medium text-white">Total</span>
                  <span className="text-lg font-mono tabular-nums font-semibold text-white">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 bg-white hover:bg-stone-200 text-stone-950 font-sans-clean font-semibold uppercase tracking-[0.2em] text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Tramitar Pedido</span>
                <ArrowRight size={14} className="stroke-[2]" />
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
