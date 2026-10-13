import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Grid, List, Sparkles } from 'lucide-react';
import { Categoria } from '../../types/database';

interface CategorySectionProps {
  categories: Categoria[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  productCountMap?: Record<string, number>;
  totalProductsCount?: number;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  categories = [],
  selectedCategoryId,
  onSelectCategory,
  productCountMap = {},
  totalProductsCount = 0,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isGridView, setIsGridView] = useState(false);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  const isInitial = useRef(true);
  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    const el = scrollContainerRef.current;
    if (!el) return;
    const activeBtn = el.querySelector('[data-active="true"]') as HTMLElement;
    if (activeBtn) {
      const containerRect = el.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      const offset = btnRect.left - containerRect.left - el.clientWidth / 2 + btnRect.width / 2;
      el.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }, [selectedCategoryId]);

  const scrollByDirection = (dir: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(260, el.clientWidth * 0.65);
    el.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  return (
    <section id="categorias" className="pt-20 pb-8 bg-[#09090b] text-stone-100 border-b border-white/[0.06] relative">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Title header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-[#c5a059] font-medium block mb-2">
            Selección Exclusiva
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif-luxury font-light text-white tracking-tight">
            Colecciones
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-stone-400 font-light">
            Explora las {categories.length} líneas de producto de alta gama disponibles en tienda.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsGridView(!isGridView)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 hover:border-[#c5a059]/50 bg-white/[0.03] hover:bg-[#c5a059]/10 text-stone-300 hover:text-white text-xs transition-all cursor-pointer"
            >
              {isGridView ? (
                <>
                  <List size={13} className="text-[#c5a059]" />
                  <span>Ver en Barra Deslizable</span>
                </>
              ) : (
                <>
                  <Grid size={13} className="text-[#c5a059]" />
                  <span>Ver Todas las {categories.length} Categorías en Cuadrícula</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* View content */}
        {isGridView ? (
          <div className="py-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
              {/* All categories pill */}
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('all');
                  setIsGridView(false);
                }}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between min-h-[78px] ${
                  selectedCategoryId === 'all'
                    ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-1 ring-[#c5a059] shadow-lg shadow-[#c5a059]/10'
                    : 'border-white/10 bg-black/40 text-stone-300 hover:border-white/25 hover:bg-stone-900/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-semibold text-xs text-white">Todas las Colecciones</span>
                  <Sparkles size={12} className={selectedCategoryId === 'all' ? 'text-[#c5a059]' : 'text-stone-500'} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400 font-mono">
                  <span>Catálogo completo</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-stone-300">{totalProductsCount}</span>
                </div>
              </button>

              {/* Individual categories */}
              {categories.map((c) => {
                const isSelected = selectedCategoryId === c.id;
                const count = productCountMap[c.id] || 0;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(c.id);
                      setIsGridView(false);
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between min-h-[78px] ${
                      isSelected
                        ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-1 ring-[#c5a059] shadow-lg shadow-[#c5a059]/10'
                        : 'border-white/10 bg-black/40 text-stone-300 hover:border-white/25 hover:bg-stone-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="font-semibold text-xs text-white leading-snug capitalize">{c.nombre}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-[#c5a059] shrink-0 mt-1" />}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400 font-mono">
                      <span className="truncate text-stone-500 font-sans text-[9px]">
                        {c.descripcion ? c.descripcion.slice(0, 24) + '...' : 'Colección'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-stone-300 font-mono">{count}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="relative group/carousel">
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollByDirection('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 sm:-ml-4 z-20 w-8 h-8 rounded-full bg-[#09090b]/95 border border-white/20 text-[#c5a059] hover:text-white hover:border-[#c5a059] shadow-xl flex items-center justify-center cursor-pointer transition-all backdrop-blur-md"
                aria-label="Desplazar categorías hacia la izquierda"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-[#09090b] to-transparent pointer-events-none z-10" />
            )}

            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex items-center justify-start gap-2.5 overflow-x-auto pb-4 pt-1 scrollbar-none scroll-smooth"
            >
              <button
                type="button"
                data-active={selectedCategoryId === 'all'}
                onClick={() => onSelectCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 ${
                  selectedCategoryId === 'all'
                    ? 'bg-[#c5a059] text-black shadow-lg shadow-[#c5a059]/20 font-bold scale-[1.02]'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 hover:text-white border border-white/[0.08]'
                }`}
              >
                <span>Todas</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    selectedCategoryId === 'all' ? 'bg-black/20 text-black' : 'bg-black/40 text-stone-400'
                  }`}
                >
                  {totalProductsCount}
                </span>
              </button>

              {categories.map((c) => {
                const isSelected = selectedCategoryId === c.id;
                const count = productCountMap[c.id] || 0;
                return (
                  <button
                    key={c.id}
                    type="button"
                    data-active={isSelected}
                    onClick={() => onSelectCategory(c.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 capitalize ${
                      isSelected
                        ? 'bg-[#c5a059] text-black shadow-lg shadow-[#c5a059]/20 font-bold scale-[1.02]'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 hover:text-white border border-white/[0.08]'
                    }`}
                  >
                    <span>{c.nombre}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isSelected ? 'bg-black/20 text-black' : 'bg-black/40 text-stone-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[#09090b] to-transparent pointer-events-none z-10" />
            )}

            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollByDirection('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 sm:-mr-4 z-20 w-8 h-8 rounded-full bg-[#09090b]/95 border border-white/20 text-[#c5a059] hover:text-white hover:border-[#c5a059] shadow-xl flex items-center justify-center cursor-pointer transition-all backdrop-blur-md"
                aria-label="Desplazar categorías hacia la derecha"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
