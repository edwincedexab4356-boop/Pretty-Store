import React from 'react';
import { ArrowLeft, ShoppingBag, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { useCart } from '../../context/CartContext';
import { Footer } from '../common/Footer';

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  badge: string;
  canonicalPath: '/terminos-y-condiciones' | '/politica-de-privacidad';
  onGoToStore: () => void;
  onGoToOtherPage: () => void;
  otherPageTitle: string;
  otherPagePath: string;
  onOpenAdmin?: () => void;
  children: React.ReactNode;
}

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  title,
  subtitle,
  badge,
  canonicalPath,
  onGoToStore,
  onGoToOtherPage,
  otherPageTitle,
  otherPagePath,
  onOpenAdmin,
  children,
}) => {
  const { config } = useStoreConfig();
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-stone-200 flex flex-col font-sans selection:bg-[#c5a059] selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onGoToStore}
              className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-400 hover:text-white transition-colors cursor-pointer group py-1.5"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform text-[#c5a059]" />
              <span>Volver a la Tienda</span>
            </button>
          </div>

          {/* Center Brand */}
          <button
            onClick={onGoToStore}
            className="flex items-center gap-2.5 cursor-pointer text-left group"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-stone-900 shrink-0">
              <img
                src={config.logo_url || '/images/logo/logotipo.jpeg'}
                alt={config.nombre_tienda || 'Pretty Store'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-serif-luxury font-semibold tracking-[0.18em] text-white uppercase leading-none group-hover:text-[#c5a059] transition-colors">
                {config.nombre_tienda || 'Pretty Store'}
              </span>
              <span className="text-[8px] uppercase tracking-[0.3em] text-stone-400 mt-0.5 font-light">
                Atelier & Boutique
              </span>
            </div>
          </button>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <a
              href={otherPagePath}
              onClick={(e) => {
                e.preventDefault();
                onGoToOtherPage();
              }}
              className="hidden md:inline-flex text-[11px] uppercase tracking-[0.16em] text-stone-400 hover:text-[#c5a059] transition-colors py-1.5"
            >
              {otherPageTitle}
            </a>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-stone-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Abrir Carrito"
            >
              <ShoppingBag size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#c5a059] text-black text-[9px] font-bold flex items-center justify-center font-mono">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Title Section */}
      <section className="relative border-b border-white/[0.06] bg-gradient-to-b from-stone-950/80 to-transparent py-12 sm:py-16">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-8">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium">
            <button onClick={onGoToStore} className="hover:text-white transition-colors cursor-pointer">
              Inicio
            </button>
            <ChevronRight size={10} className="text-stone-600" />
            <span className="text-[#c5a059] font-medium">{title}</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-[0.2em] text-[#c5a059] font-medium mb-3">
            {canonicalPath === '/terminos-y-condiciones' ? (
              <FileText size={12} className="text-[#c5a059]" />
            ) : (
              <ShieldCheck size={12} className="text-[#c5a059]" />
            )}
            <span>{badge}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif-luxury font-semibold text-white tracking-[0.02em] leading-tight mb-4">
            {title}
          </h1>

          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl font-light leading-relaxed">
            {subtitle}
          </p>

          <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-[11px] text-stone-500 font-light">
            <span>Última actualización: Septiembre de 2026</span>
            <span>Jurisdicción: República de Panamá</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1000px] w-full mx-auto px-4 sm:px-8 py-10 sm:py-14">
        {children}

        {/* Switch link at bottom of page */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02] p-6 rounded-2xl border border-white/[0.06]">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 block mb-1">
              Documentación Legal Complementaria
            </span>
            <p className="text-xs text-white font-medium">
              ¿Deseas consultar nuestra {otherPageTitle}?
            </p>
          </div>
          <a
            href={otherPagePath}
            onClick={(e) => {
              e.preventDefault();
              onGoToOtherPage();
            }}
            className="px-5 py-2.5 bg-white/[0.06] hover:bg-white text-stone-200 hover:text-black text-xs font-semibold uppercase tracking-[0.16em] transition-all rounded-lg border border-white/10"
          >
            Leer {otherPageTitle}
          </a>
        </div>
      </main>

      {/* Footer */}
      <Footer
        categories={[]}
        onSelectCategory={() => onGoToStore()}
        onOpenAdmin={onOpenAdmin}
      />
    </div>
  );
};
