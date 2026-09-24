import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Truck, CreditCard } from 'lucide-react';

interface HeroContentProps {
  onExploreClick: () => void;
  onCategoriesClick: () => void;
}

export const HeroContent: React.FC<HeroContentProps> = ({
  onExploreClick,
  onCategoriesClick,
}) => {
  return (
    <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16 md:pt-32 md:pb-24 flex flex-col items-center justify-center min-h-[75vh] md:min-h-[85vh]">
      {/* Category badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-medium tracking-wide uppercase mb-6 backdrop-blur-md animate-fade-in shadow-lg shadow-amber-500/5">
        <Sparkles size={14} className="text-amber-400 animate-pulse" />
        <span>Colección Exclusiva 2026 • Accesorios de Alta Gama</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 font-serif-luxury leading-tight max-w-4xl drop-shadow-md">
        Elegancia & Distinción en Cada Detalle
      </h1>

      {/* Description */}
      <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
        Descubre nuestra selecta línea de perfumes de alta concentración, relojes cronógrafos de precisión,
        carteras en piel genuina, gorras y correas con acabados de primera calidad.
      </p>

      {/* Call to Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
        <button
          onClick={onExploreClick}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-base shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        >
          <span>Ver Productos</span>
          <ArrowRight size={18} />
        </button>

        <button
          onClick={onCategoriesClick}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-white font-medium text-base border border-slate-700/80 backdrop-blur-md hover:border-slate-500 transition-all duration-200 cursor-pointer"
        >
          <span>Explorar Categorías</span>
        </button>
      </div>

      {/* Trust badges footer within hero */}
      <div className="mt-14 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl text-left">
        <div className="flex items-center gap-3.5 bg-slate-900/40 backdrop-blur-sm p-3 rounded-lg border border-white/5">
          <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 shrink-0">
            <Truck size={20} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Envíos Rápidos</h4>
            <p className="text-[11px] text-slate-400">Gratis en compras desde $100</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 bg-slate-900/40 backdrop-blur-sm p-3 rounded-lg border border-white/5">
          <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">100% Original</h4>
            <p className="text-[11px] text-slate-400">Garantía total de autenticidad</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 bg-slate-900/40 backdrop-blur-sm p-3 rounded-lg border border-white/5">
          <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 shrink-0">
            <CreditCard size={20} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Pagos Locales</h4>
            <p className="text-[11px] text-slate-400">Yappy, Tarjeta & Transferencia</p>
          </div>
        </div>
      </div>
    </div>
  );
};
