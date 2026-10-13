import React from 'react';
import { ShoppingCart, Check } from 'lucide-react';

interface ToastNotificationProps {
  notification: { id: string; name: string; image?: string | null } | null;
  onOpenCart: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ notification, onOpenCart }) => {
  if (!notification) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#121118] border border-[#c5a059]/40 rounded-2xl p-4 shadow-2xl shadow-black/80 flex items-center gap-3.5 max-w-sm">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <Check size={18} className="stroke-[3]" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#c5a059] block">
            Añadido al Carrito
          </span>
          <p className="text-xs font-semibold text-white truncate">{notification.name}</p>
        </div>
        <button
          onClick={onOpenCart}
          className="px-3 py-1.5 rounded-lg bg-[#c5a059] hover:bg-[#b5914a] text-black font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          <ShoppingCart size={13} />
          <span>Ver</span>
        </button>
      </div>
    </div>
  );
};
