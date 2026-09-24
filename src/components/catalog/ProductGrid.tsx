import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, PackageOpen, RotateCcw } from 'lucide-react';
import { Producto, Categoria } from '../../types/database';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';

interface ProductGridProps {
  products: Producto[];
  categories: Categoria[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Producto | null>(null);

  // Category map for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => map.set(cat.id, cat.nombre));
    return map;
  }, [categories]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        if (!product.activo) return false;

        // Filter by category
        if (selectedCategoryId !== 'all' && product.categoria_id !== selectedCategoryId) {
          return false;
        }

        // Filter by search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = product.nombre.toLowerCase().includes(q);
          const matchDesc = product.descripcion?.toLowerCase().includes(q) || false;
          if (!matchName && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.precio - b.precio;
        if (sortBy === 'price-desc') return b.precio - a.precio;
        if (sortBy === 'name') return a.nombre.localeCompare(b.nombre);
        return 0; // default order
      });
  }, [products, selectedCategoryId, searchQuery, sortBy]);

  const activeCategoryTitle =
    selectedCategoryId === 'all'
      ? 'Todas las Piezas'
      : categoryMap.get(selectedCategoryId) || 'Catálogo';

  return (
    <section id="catalogo" className="py-20 sm:py-28 bg-[#09090b] text-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Collection Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b border-white/[0.08]">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#c5a059] font-medium block">
              Catálogo Oficial
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif-luxury font-light text-white tracking-tight">
              {activeCategoryTitle}
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 font-light">
              Mostrando {filteredProducts.length} de {products.length} piezas exclusivas
            </p>
          </div>

          {/* Minimalist Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Buscar pieza..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-7 py-2 bg-stone-900/60 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-white/30 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-white"
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Select */}
            <div className="relative flex items-center">
              <SlidersHorizontal
                size={13}
                className="absolute left-3.5 text-stone-400 pointer-events-none"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-9 pr-8 py-2 bg-stone-900/60 border border-white/10 text-xs text-stone-300 focus:outline-none focus:border-white/30 appearance-none cursor-pointer"
              >
                <option value="featured">Destacados</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="name">Alfabético: A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={categoryMap.get(product.categoria_id)}
                onQuickView={(p) => setSelectedProductForModal(p)}
              />
            ))}
          </div>
        ) : (
          /* Clean Empty State */
          <div className="py-20 text-center max-w-sm mx-auto flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-stone-500 mb-4 bg-stone-900">
              <PackageOpen size={22} className="stroke-[1.5]" />
            </div>
            <h3 className="text-base font-serif-luxury font-normal text-white mb-1">
              No se encontraron piezas
            </h3>
            <p className="text-xs text-stone-400 mb-6 font-light">
              No hay artículos que coincidan con la búsqueda &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                onSelectCategory('all');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-xs uppercase tracking-[0.16em] transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Ver Todo</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <ProductDetailModal
        product={selectedProductForModal}
        categories={categories}
        onClose={() => setSelectedProductForModal(null)}
      />
    </section>
  );
};
