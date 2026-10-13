import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getProductPromo } from '../../utils/promoUtils';
import { getPrimaryProductImage } from '../../utils/productImages';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    items,
    removeItem,
    updateQuantity,
    totalItems,
    subtotal,
    discount,
    promo,
    total,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0e0d12] border-l border-white/10 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
                <ShoppingCart size={16} />
              </div>
              <h3 className="font-serif-luxury font-bold text-white text-base">
                Tu Carrito ({totalItems})
              </h3>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Active Promo Notice */}
          {items.length > 0 && promo.hasPromo && (
            <div className="px-5 py-2.5 bg-gradient-to-r from-amber-500/15 via-[#c5a059]/10 to-transparent border-b border-amber-500/20 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#fbbf24] shrink-0" />
                <span className="text-white text-[11px] font-semibold">
                  {promo.promoTitle}: <strong className="text-[#fbbf24] font-mono">-${promo.discount.toFixed(2)} USD</strong>
                </span>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ¡Aplicado!
              </span>
            </div>
          )}

          {/* Next Promo Hint */}
          {items.length > 0 && !promo.hasPromo && promo.nextPromoHint && (
            <div className="px-5 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs flex items-center gap-2">
              <Tag size={13} className="text-amber-400 shrink-0" />
              <span className="text-stone-300 text-[11px] font-light">
                {promo.nextPromoHint}
              </span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-white/[0.06]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center text-stone-600 bg-black/40">
                  <ShoppingCart size={24} />
                </div>
                <h4 className="font-serif-luxury font-bold text-white text-base">Tu carrito está vacío</h4>
                <p className="text-xs text-stone-400 max-w-xs font-light">
                  Explora nuestras gorras legendarias, perfumes virales y promociones exclusivas.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-6 py-2.5 bg-[#c5a059] hover:bg-[#b5914a] text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Explorar Tienda
                </button>
              </div>
            ) : (
              items.map((item) => {
                const itemPromo = getProductPromo(item.product, item.product?.categoria?.nombre);
                const itemKey = `${item.product.id}-${item.selectedSize || 'default'}`;

                return (
                  <div key={itemKey} className="pt-4 first:pt-0 flex gap-3.5">
                    {/* Thumbnail */}
                    <div className="w-18 h-18 rounded-xl bg-black/60 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                      <img
                        src={getPrimaryProductImage(item.product, '/images/logo/logotipo.jpeg')}
                        alt={item.product.nombre}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/images/logo/logotipo.jpeg';
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-white truncate">
                            {item.product.nombre}
                          </h4>
                          <button
                            onClick={() => removeItem(item.product.id, item.selectedSize)}
                            className="text-stone-500 hover:text-rose-400 transition-colors cursor-pointer p-1"
                            title="Eliminar artículo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs font-mono font-bold text-[#c5a059]">
                            ${item.product.precio.toFixed(2)}
                          </span>
                          {item.selectedSize && (
                            <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-medium">
                              Talla: {item.selectedSize}
                            </span>
                          )}
                          {itemPromo && (
                            <span className="text-[9px] text-amber-300 font-medium px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                              {itemPromo.shortBadge}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stepper Controls & Subtotal */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center border border-white/15 bg-black/50 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedSize)}
                            className="w-7 h-7 flex items-center justify-center text-stone-300 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedSize)}
                            className="w-7 h-7 flex items-center justify-center text-stone-300 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <span className="text-sm font-mono font-bold text-white">
                          ${(item.product.precio * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-white/10 bg-[#070608] space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-400 font-light">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Descuento Promocional</span>
                    <span className="font-mono">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-white/10 flex justify-between text-base font-bold text-white">
                  <span>Total a Pagar</span>
                  <span className="font-mono text-[#fbbf24]">${total.toFixed(2)} USD</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#b5914a] hover:from-[#d5b069] hover:to-[#c5a059] text-black font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#c5a059]/25 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 hover:scale-102"
              >
                <span>Tramitar Pedido</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
