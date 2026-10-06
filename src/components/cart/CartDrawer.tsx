import React, { useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Tag,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { isLegendaryCap } from '../../utils/promoUtils';

export const CartDrawer: React.FC = () => {
  const {
    items,
    totalItems,
    subtotal,
    discount,
    promo,
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

          {/* Banner Promoción: 2 Gorras Legendarias por $55 */}
          {items.length > 0 && promo.hasPromo && (
            <div className="px-6 py-2.5 bg-[#c5a059]/10 border-b border-[#c5a059]/20 text-xs flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#c5a059] shrink-0" />
                <span className="text-white text-[11px] font-medium">
                  {promo.promoTitle}: <strong className="text-[#c5a059] font-mono">-${promo.discount.toFixed(2)} USD</strong>
                </span>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ¡Aplicado!
              </span>
            </div>
          )}

          {/* Sugerencia de Promoción si falta 1 gorra */}
          {items.length > 0 && !promo.hasPromo && promo.nextPromoHint && (
            <div className="px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <Tag size={13} className="text-amber-400 shrink-0" />
              <span className="text-stone-300 text-[11px] font-light">
                {promo.nextPromoHint}
              </span>
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono tabular-nums text-[#c5a059]">
                          ${item.product.precio.toFixed(2)}
                        </span>
                        {isLegendaryCap(item.product, item.product?.categoria?.nombre) && (
                          <span className="text-[9px] text-amber-300 font-medium px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                            Promo 2x $55
                          </span>
                        )}
                      </div>
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
                {discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1.5 rounded border border-emerald-500/20">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Tag size={12} className="shrink-0" />
                      <span>{promo.promoTitle}</span>
                    </span>
                    <span className="font-mono tabular-nums font-semibold">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-sm">
                  <span className="uppercase tracking-[0.16em] text-xs font-medium text-white">Total</span>
                  <span className="text-xl font-mono tabular-nums font-semibold text-white">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-[#fbbf24] font-medium text-right pt-0.5">
                  * El costo de envío se calcula y agrega al total en el siguiente paso
                </p>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-4 bg-white hover:bg-stone-200 text-stone-950 font-sans-clean font-semibold uppercase tracking-[0.2em] text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] min-h-[48px]"
              >
                <span>Ir a pagar</span>
                <ArrowRight size={14} className="stroke-[2]" />
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
