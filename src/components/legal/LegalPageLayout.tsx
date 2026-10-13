import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useStoreConfig } from '../../context/StoreConfigContext';

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: React.ReactNode;
}

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  title,
  subtitle,
  onBack,
  children,
}) => {
  const { config } = useStoreConfig();

  return (
    <div className="min-h-screen bg-[#09080b] text-stone-200 pt-24 pb-20">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#c5a059] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Volver a la Tienda</span>
        </button>

        <div className="space-y-2 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 text-xs text-[#c5a059] font-bold uppercase tracking-widest">
            <ShieldCheck size={16} />
            <span>{config.nombre_tienda || 'Pretty-Store'} · Documento Oficial</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif-luxury font-bold text-white tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 font-light">{subtitle}</p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};
