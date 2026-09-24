import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, PackageOpen, RotateCcw } from 'lucide-react';
import { Producto, Categoria } from '../../types/database';
import { useStoreConfig } from '../../context/StoreConfigContext';
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
  const { config } = useStoreConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Producto | null>(null);

  const catalogVideoUrl =
    config.catalog_video_url ||
    'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-black-dress-41618-large.mp4';

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
        // Must be active
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
      ? 'Todos los Productos'
      : categoryMap.get(selectedCategoryId) || 'Catálogo';

  return (
    <section id="catalogo" className="relative py-20 bg-slate-950 text-slate-100 overflow-hidden">
      {/* Dynamic Background Video behind products */}
      {catalogVideoUrl && (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <video
            src={catalogVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover scale-105 opacity-70 filter contrast-115 brightness-95"
          />
          {/* Subtle smooth gradients so the video is vividly visible while text and cards remain crisp */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/35 to-slate-950/85" />
          <div className="absolute inset-0 bg-slate-950/15" />
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-800/80">
          <div>
            <span className="text-amber-400 text-xs uppercase tracking-widest font-semibold block mb-1">
              Catálogo Oficial
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif-luxury tracking-tight">
              {activeCategoryTitle}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Mostrando {filteredProducts.length} de {products.length} productos disponibles
            </p>
          </div>

          {/* Search and Sort Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Select */}
            <div className="relative flex items-center">
              <SlidersHorizontal
                size={16}
                className="absolute left-3.5 text-slate-400 pointer-events-none"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-9 pr-8 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
              >
                <option value="featured">Destacados</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="name">Alfabético: A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid or Empty State */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          /* Empty state */
          <div className="py-20 text-center max-w-md mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-500 mb-4 border border-slate-800">
              <PackageOpen size={32} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              No se encontraron productos
            </h3>
            <p className="text-sm text-slate-400 mb-6 text-center">
              No hay artículos que coincidan con los filtros seleccionados o la búsqueda &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                onSelectCategory('all');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <RotateCcw size={16} />
              <span>Restablecer Filtros</span>
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
