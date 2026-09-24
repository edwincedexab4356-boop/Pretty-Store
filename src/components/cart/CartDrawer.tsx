import React, { useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ImageOff
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
    clearCart,
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
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          className="w-screen max-w-md md:max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-title"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <ShoppingBag size={22} />
              </div>
              <div>
                <h2 id="cart-title" className="text-xl font-bold text-white font-serif-luxury">
                  Mi Carrito
                </h2>
                <p className="text-xs text-slate-400">
                  {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'} agregados
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Cerrar carrito"
            >
              <X size={22} />
            </button>
          </div>

          {/* Free shipping banner */}
          {items.length > 0 && (
            <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 text-xs text-slate-300">
              <div className="flex items-center justify-between mb-1.5 font-medium">
                {remainingForFreeShipping > 0 ? (
                  <span>
                    Agrega <strong className="text-amber-400">${remainingForFreeShipping.toFixed(2)}</strong> más para <span className="text-emerald-400">Envío Gratis</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <Sparkles size={14} /> ¡Felicidades! Tienes Envío Gratis
                  </span>
                )}
                <span className="text-slate-400 font-mono">{Math.round(freeShippingProgress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-600 mb-4 border border-slate-800">
                  <ShoppingBag size={36} />
                </div>
                <h3 className="text-lg font-bold text-white font-serif-luxury mb-1">
                  Tu carrito está vacío
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mb-6">
                  Explora nuestra colección y añade tus piezas favoritas de perfumes, relojes y accesorios.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              items.map((item) => {
                const { product, quantity, subtotal: itemSubtotal } = item;
                const isMax = quantity >= product.stock;

                return (
                  <div
                    key={product.id}
                    className="flex gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-800 flex items-center justify-center">
                      {product.imagen_url ? (
                        <img
                          src={product.imagen_url}
                          alt={product.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageOff size={24} className="text-slate-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-white truncate">
                            {product.nombre}
                          </h4>
                          <button
                            onClick={() => removeItem(product.id)}
                            className="text-slate-400 hover:text-rose-400 p-1 transition-colors cursor-pointer shrink-0"
                            title="Eliminar producto"
                            aria-label={`Eliminar ${product.nombre} del carrito`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Unitario:{' '}
                          <span className="text-amber-400/90 font-mono font-medium">
                            ${product.precio.toFixed(2)}
                          </span>
                        </p>
                      </div>

                      {/* Stepper and item subtotal */}
                      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800/60">
                        {/* Stepper */}
                        <div className="inline-flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            disabled={quantity <= 1}
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer"
                            aria-label="Disminuir cantidad"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold text-white">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            disabled={isMax}
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer"
                            aria-label="Aumentar cantidad"
                            title={isMax ? 'Stock máximo alcanzado' : undefined}
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase">
                            Subtotal
                          </span>
                          <span className="text-sm font-bold text-white font-mono">
                            ${itemSubtotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {isMax && (
                        <p className="text-[10px] text-amber-400/90 mt-1 flex items-center gap-1">
                          <AlertTriangle size={11} /> Stock máx. alcanzado ({product.stock} disponibles)
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with totals and checkout button */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-800 bg-slate-950/80 space-y-4">
              {/* Order Calculations */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Envío</span>
                  <span className="font-mono">
                    {shipping === 0 ? (
                      <span className="text-emerald-400 font-semibold uppercase text-xs">Gratis</span>
                    ) : (
                      <span className="text-white">${shipping.toFixed(2)}</span>
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-base font-bold text-white">
                  <span className="font-serif-luxury tracking-wide">Total Estimado</span>
                  <span className="text-xl font-mono text-amber-400">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-base shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <span>Proceder al Checkout</span>
                  <ArrowRight size={18} />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Continuar Comprando
                  </button>
                  <button
                    onClick={clearCart}
                    className="py-2.5 px-4 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 hover:text-rose-200 border border-rose-900/40 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Vaciar todo el carrito"
                  >
                    <Trash2 size={14} />
                    <span>Vaciar</span>
                  </button>
                </div>
              </div>

              {/* Security guarantee */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Compra protegida y preparada para sincronización con Supabase</span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
