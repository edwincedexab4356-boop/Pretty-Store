import React from 'react';
import { Check, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const ToastNotification: React.FC = () => {
  const { notification, clearNotification, setIsCartOpen } = useCart();

  if (!notification) return null;

  const handleOpenCart = () => {
    clearNotification();
    setIsCartOpen(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-[#0c0c0f] border border-white/15 p-4 shadow-2xl flex items-center gap-3.5">
        {/* Check Icon or thumbnail */}
        {notification.image ? (
          <img
            src={notification.image}
            alt={notification.productName}
            className="w-12 h-14 object-cover border border-white/10 shrink-0"
          />
        ) : (
          <div className="w-10 h-10 border border-white/15 text-[#c5a059] flex items-center justify-center shrink-0 bg-stone-900">
            <Check size={16} className="stroke-[2.5]" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#c5a059] flex items-center gap-1">
            <Check size={12} className="stroke-[2.5]" /> Añadido a la bolsa
          </p>
          <p className="text-xs font-serif-luxury font-normal text-white truncate mt-0.5">
            {notification.productName}
          </p>
          <button
            onClick={handleOpenCart}
            className="text-[11px] text-stone-300 hover:text-white font-medium uppercase tracking-[0.16em] mt-1.5 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag size={11} />
            <span>Ver Bolsa</span>
          </button>
        </div>

        <button
          onClick={clearNotification}
          className="p-1 text-stone-500 hover:text-white transition-colors cursor-pointer"
          aria-label="Cerrar notificación"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
