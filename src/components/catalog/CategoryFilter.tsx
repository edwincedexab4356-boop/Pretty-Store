import React from 'react';
import { Categoria } from '../../types/database';
import { Sparkles } from 'lucide-react';
import { PROMO_RULES } from '../../utils/promoUtils';

interface CategoryFilterProps {
  categories: Categoria[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  return (
    <div className="w-full space-y-4">
      {/* Scrollable category pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => onSelectCategory('')}
          className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
            selectedCategoryId === ''
              ? 'bg-[#c5a059] text-black shadow-lg shadow-[#c5a059]/25 scale-[1.02]'
              : 'bg-white/[0.04] text-stone-300 hover:text-white hover:bg-white/[0.08] border border-white/10'
          }`}
        >
          Todas
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const hasPromo = PROMO_RULES.some(
            (p) => (p.categoryIds && p.categoryIds.includes(cat.id)) || cat.nombre.toLowerCase().includes(p.key)
          );

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#c5a059] text-black shadow-lg shadow-[#c5a059]/25 scale-[1.02]'
                  : 'bg-white/[0.04] text-stone-300 hover:text-white hover:bg-white/[0.08] border border-white/10'
              }`}
            >
              <span>{cat.nombre}</span>
              {hasPromo && (
                <Sparkles size={11} className={isSelected ? 'text-black' : 'text-amber-400'} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
