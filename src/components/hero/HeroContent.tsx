import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroContentProps {
  onExploreClick: () => void;
  onCategoriesClick?: () => void;
}

export const HeroContent: React.FC<HeroContentProps> = ({
  onExploreClick,
}) => {
  return (
    <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center min-h-[85vh] sm:min-h-[90vh]">
      {/* 1. Small category or collection text */}
      <div className="text-[10px] sm:text-xs uppercase tracking-[0.35em] font-medium text-[#c5a059] mb-6">
        The New Collection
      </div>

      {/* 2. Large and elegant title */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif-luxury font-light text-white tracking-tight leading-[1.06] mb-6 max-w-3xl drop-shadow-md">
        Define your style.
      </h1>

      {/* 3. Short phrase */}
      <p className="text-xs sm:text-sm md:text-base text-stone-200/90 max-w-lg mx-auto font-light leading-relaxed mb-10">
        Piezas de distinción concebidas con los más altos estándares de artesanía y elegancia contemporánea.
      </p>

      {/* 4. One main button */}
      <div>
        <button
          onClick={onExploreClick}
          className="inline-flex items-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 bg-white hover:bg-stone-100 text-stone-950 font-sans-clean font-semibold uppercase tracking-[0.22em] text-[11px] sm:text-xs transition-all duration-300 hover:tracking-[0.26em] cursor-pointer group shadow-2xl shadow-black/60"
        >
          <span>Descubre la colección</span>
          <ArrowRight size={14} className="stroke-[2] transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
