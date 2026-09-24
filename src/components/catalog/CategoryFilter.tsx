import React from 'react';
import { Sparkles, Watch, Briefcase, Award, Shield, Layers } from 'lucide-react';
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
  const getCategoryIcon = (cat: Categoria) => {
    const n = `${cat.nombre} ${cat.id}`.toLowerCase();
    if (n.includes('perfume') || n.includes('fragancia') || n.includes('aroma')) {
      return <Sparkles size={18} />;
    }
    if (n.includes('reloj') || n.includes('watch') || n.includes('tiempo')) {
      return <Watch size={18} />;
    }
    if (n.includes('cartera') || n.includes('bolso') || n.includes('billetera') || n.includes('maletin')) {
      return <Briefcase size={18} />;
    }
    if (n.includes('gorra') || n.includes('sombrero') || n.includes('cap')) {
      return <Award size={18} />;
    }
    if (n.includes('correa') || n.includes('cinturon') || n.includes('belt') || n.includes('faja')) {
      return <Shield size={18} />;
    }
    return <Layers size={18} />;
  };

  return (
    <section id="categorias" className="py-12 bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif-luxury tracking-wide">
            Colecciones & Categorías
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Navega por nuestras líneas exclusivas diseñadas con los más altos estándares de calidad.
          </p>
        </div>

        {/* Categories horizontal bar / pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2.5 overflow-x-auto pb-4 no-scrollbar">
          {/* "Todos" button */}
          <button
            onClick={() => onSelectCategory('all')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              selectedCategoryId === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-102 font-bold'
                : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Layers size={18} />
            <span>Todos</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                selectedCategoryId === 'all'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {totalProductsCount}
            </span>
          </button>

          {/* Dynamic categories from database schema */}
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const count = productCountMap[cat.id] || 0;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-102 font-bold'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {getCategoryIcon(cat)}
                <span>{cat.nombre}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-slate-950/20 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
