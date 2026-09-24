import React from 'react';
import { Categoria } from '../../types/database';

interface CategoryFilterProps {
  categories: Categoria[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  productCountMap: Record<string, number>;
  totalProductsCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  productCountMap,
  totalProductsCount,
}) => {
  return (
    <section id="categorias" className="pt-20 pb-8 bg-[#09090b] text-stone-100 border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Minimal Editorial Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-[#c5a059] font-medium block mb-2">
            Selección Exclusiva
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif-luxury font-light text-white tracking-tight">
            Colecciones
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-stone-400 font-light">
            Explora cada línea de producto según tu preferencia de estilo y ocasión.
          </p>
        </div>

        {/* Minimalist Tab Navigation Bar */}
        <div className="flex items-center justify-start sm:justify-center gap-6 sm:gap-8 overflow-x-auto pb-4 no-scrollbar border-b border-white/[0.06]">
          {/* 'Todos' Tab */}
          <button
            onClick={() => onSelectCategory('all')}
            className={`pb-3 text-xs uppercase tracking-[0.2em] transition-all whitespace-nowrap cursor-pointer shrink-0 relative flex items-center gap-1.5 ${
              selectedCategoryId === 'all'
                ? 'text-white font-medium'
                : 'text-stone-400 hover:text-stone-200 font-normal'
            }`}
          >
            <span>Todas</span>
            <span className="text-[10px] text-stone-500 font-mono tabular-nums">
              ({totalProductsCount})
            </span>
            {selectedCategoryId === 'all' && (
              <span className="absolute bottom-0 inset-x-0 h-[1.5px] bg-[#c5a059]" />
            )}
          </button>

          {/* Dynamic Categories */}
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const count = productCountMap[cat.id] || 0;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`pb-3 text-xs uppercase tracking-[0.2em] transition-all whitespace-nowrap cursor-pointer shrink-0 relative flex items-center gap-1.5 ${
                  isSelected
                    ? 'text-white font-medium'
                    : 'text-stone-400 hover:text-stone-200 font-normal'
                }`}
              >
                <span>{cat.nombre}</span>
                <span className="text-[10px] text-stone-500 font-mono tabular-nums">
                  ({count})
                </span>
                {isSelected && (
                  <span className="absolute bottom-0 inset-x-0 h-[1.5px] bg-[#c5a059]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
