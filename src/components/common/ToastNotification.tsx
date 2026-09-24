import React from 'react';
import { CheckCircle2, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const ToastNotification: React.FC = () => {
  const { notification, clearNotification, setIsCartOpen } = useCart();

  if (!notification) return null;

  const handleOpenCart = () => {
    clearNotification();
    setIsCartOpen(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce-short">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-4 shadow-2xl shadow-black/50 flex items-center gap-3.5">
        {/* Check Icon or thumbnail */}
        {notification.image ? (
          <img
            src={notification.image}
            alt={notification.productName}
            className="w-12 h-12 rounded-xl object-cover border border-amber-500/30 shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={13} /> {notification.message}
          </p>
          <p className="text-xs font-semibold text-white truncate mt-0.5">
            {notification.productName}
          </p>
          <button
            onClick={handleOpenCart}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline mt-1 inline-flex items-center gap-1 cursor-pointer"
          >
            <ShoppingBag size={12} />
            <span>Abrir Carrito</span>
          </button>
        </div>

        <button
          onClick={clearNotification}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Cerrar notificación"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
