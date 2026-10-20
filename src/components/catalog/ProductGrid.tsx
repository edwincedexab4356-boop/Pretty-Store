import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Package, RefreshCw } from 'lucide-react';
import { Producto, Categoria } from '../../types/database';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Producto[];
  categories: Categoria[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  onQuickView: (product: Producto) => void;
  isLoading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onQuickView,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.nombre));
    return map;
  }, [categories]);

  const categoryOrderMap = useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach((c, idx) => map.set(String(c.id), idx));
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (!p.activo) return false;
        if (selectedCategoryId !== 'all' && selectedCategoryId !== '' && p.categoria_id !== selectedCategoryId) {
          return false;
        }
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = p.nombre.toLowerCase().includes(q);
          const matchDesc = p.descripcion?.toLowerCase().includes(q) || false;
          if (!matchName && !matchDesc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.precio - b.precio;
        if (sortBy === 'price-desc') return b.precio - a.precio;
        if (sortBy === 'name') return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });

        const orderA = categoryOrderMap.get(String(a.categoria_id)) ?? 9999;
        const orderB = categoryOrderMap.get(String(b.categoria_id)) ?? 9999;
        return orderA === orderB
          ? a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
          : orderA - orderB;
      });
  }, [products, selectedCategoryId, searchTerm, sortBy, categoryOrderMap]);

  const currentCategoryTitle =
    selectedCategoryId === 'all' || selectedCategoryId === ''
      ? 'Todas las Piezas'
      : categoryNameMap.get(selectedCategoryId) || 'Catálogo';

  const isSelectedCategory = selectedCategoryId !== 'all' && selectedCategoryId !== '';
  const totalInCategory = useMemo(() => {
    if (!isSelectedCategory) return products.filter((p) => p.activo).length;
    return products.filter((p) => p.activo && p.categoria_id === selectedCategoryId).length;
  }, [products, isSelectedCategory, selectedCategoryId]);

  const isCategoryEmpty = isSelectedCategory && totalInCategory === 0;

  if (isLoading) {
    return (
      <section id="catalogo" className="py-20 sm:py-28 bg-[#09090b] text-stone-100">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-6 lg:gap-8">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-[#121215] aspect-[4/5] rounded-2xl border border-white/5" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="catalogo" className="py-20 sm:py-28 bg-[#09090b] text-stone-100">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Header bar with controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b border-white/[0.08]">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#c5a059] font-medium block">
              Catálogo Oficial
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif-luxury font-light text-white tracking-tight">
              {currentCategoryTitle}
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 font-light">
              Mostrando {filteredProducts.length} de {products.length} piezas exclusivas
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar pieza..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-7 py-2.5 bg-stone-900/60 border border-white/10 text-xs text-white placeholder-stone-500 rounded-xl focus:outline-none focus:border-[#c5a059]/50 focus:ring-1 focus:ring-[#c5a059]/30 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-white p-1"
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Select */}
            <div className="relative flex items-center">
              <SlidersHorizontal size={13} className="absolute left-3.5 text-stone-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-auto pl-9 pr-8 py-2.5 bg-stone-900/60 border border-white/10 text-xs text-stone-300 rounded-xl focus:outline-none focus:border-[#c5a059]/50 focus:ring-1 focus:ring-[#c5a059]/30 appearance-none cursor-pointer transition-all"
              >
                <option value="featured">Destacados</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="name">Alfabético: A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-6 lg:gap-8">
            {filteredProducts.map((p, idx) => (
              <ProductCard
                key={p.id}
                product={p}
                categoryName={p.categoria_id ? categoryNameMap.get(p.categoria_id) : undefined}
                onQuickView={onQuickView}
                priority={idx < 4}
              />
            ))}
          </div>
        ) : isCategoryEmpty ? (
          <div className="py-20 sm:py-28 text-center max-w-md mx-auto flex flex-col items-center animate-fadeIn px-4">
            <h3 className="text-3xl sm:text-4xl font-serif-luxury font-bold text-white mb-6 tracking-wide">
              Próximamente
            </h3>

            <button
              onClick={() => {
                setSearchTerm('');
                onSelectCategory('all');
              }}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#c5a059] hover:bg-[#b5914a] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-[#c5a059]/20 hover:scale-105 active:scale-95"
            >
              <RefreshCw size={14} />
              <span>Ver Catálogo Completo</span>
            </button>
          </div>
        ) : (
          <div className="py-20 text-center max-w-sm mx-auto flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-stone-500 mb-4 bg-stone-900">
              <Package size={22} className="stroke-[1.5]" />
            </div>
            <h3 className="text-base font-serif-luxury font-normal text-white mb-1">No se encontraron piezas</h3>
            <p className="text-xs text-stone-400 mb-6 font-light">
              {searchTerm ? `No hay artículos que coincidan con la búsqueda “${searchTerm}”.` : 'No hay piezas disponibles en este momento.'}
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                onSelectCategory('all');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c5a059] hover:bg-[#b5914a] text-black text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-md shadow-[#c5a059]/20 hover:scale-105 active:scale-95"
            >
              <RefreshCw size={13} />
              <span>Ver Catálogo Completo</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
