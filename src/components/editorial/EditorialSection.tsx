import React from 'react';
import { ArrowRight } from 'lucide-react';

interface EditorialSectionProps {
  onSelectCategory?: (categoryId: string) => void;
  onExploreClick?: () => void;
}

export const EditorialSection: React.FC<EditorialSectionProps> = ({
  onSelectCategory,
  onExploreClick,
}) => {
  const handleAction = (categoryId?: string) => {
    if (categoryId && onSelectCategory) {
      onSelectCategory(categoryId);
    }
    const el = document.getElementById('catalogo');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="editoriales" className="py-24 sm:py-32 bg-[#09090b] text-stone-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28 sm:space-y-40">
        {/* Editorial Block 1: Image Left + Text Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Large Image Frame */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-stone-900 border border-white/[0.08] group">
              <img
                src="/images/banners/banner-1.jpg"
                alt="Colección de Cronógrafos y Accesorios de Lujo"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('relojes.jpg')) {
                    target.src = '/images/categories/relojes.jpg';
                  }
                }}
                className="w-full h-full object-cover object-center grayscale-[15%] group-hover:scale-103 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          </div>

          {/* Text Right */}
          <div className="lg:col-span-5 lg:pl-6 space-y-6">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[#c5a059] font-medium block">
              Maestría & Precisión
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif-luxury font-light text-white tracking-tight leading-[1.1]">
              Hecho Para Destacar
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 font-light leading-relaxed max-w-md">
              Cada pieza encarna una búsqueda constante de la perfección. Cronógrafos con líneas arquitectónicas, materiales nobles y una presencia sutilmente imponente que trasciende temporadas.
            </p>
            <div className="pt-2">
              <button
                onClick={() => handleAction()}
                className="inline-flex items-center gap-2.5 text-xs uppercase tracking-[0.2em] font-medium text-white hover:text-[#c5a059] transition-colors group cursor-pointer"
              >
                <span>Descubrir colección</span>
                <ArrowRight size={14} className="stroke-[2] transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Editorial Block 2: Text Left + Image Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Text Left (ordered first on lg, second on mobile) */}
          <div className="lg:col-span-5 order-2 lg:order-1 lg:pr-6 space-y-6">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[#c5a059] font-medium block">
              Atelier Exclusivo
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif-luxury font-light text-white tracking-tight leading-[1.1]">
              La Esencia de la Distinción
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 font-light leading-relaxed max-w-md">
              Desde acordes olfativos en concentraciones excepcionales hasta marroquinería en piel seleccionada, creamos una experiencia donde el lujo se manifiesta en el tacto, el aroma y la serenidad de los detalles.
            </p>
            <div className="pt-2">
              <button
                onClick={() => handleAction()}
                className="inline-flex items-center gap-2.5 text-xs uppercase tracking-[0.2em] font-medium text-white hover:text-[#c5a059] transition-colors group cursor-pointer"
              >
                <span>Explorar catálogo</span>
                <ArrowRight size={14} className="stroke-[2] transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Large Image Frame Right */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-stone-900 border border-white/[0.08] group">
              <img
                src="/images/banners/banner-2.jpg"
                alt="Alta Perfumería y Marroquinería de Lujo"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('perfumes.jpg')) {
                    target.src = '/images/categories/perfumes.jpg';
                  }
                }}
                className="w-full h-full object-cover object-center grayscale-[15%] group-hover:scale-103 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
