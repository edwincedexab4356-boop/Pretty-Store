import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Boxes,
  Search,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import {
  getAdminInventory,
  updateInventoryStock,
  InventoryItemRow,
} from '../../../services/adminService';
import { isPermissionError } from '../../../utils/supabaseSqlFix';
import { PermissionErrorBanner } from '../PermissionErrorBanner';

interface InventoryViewProps {
  onOpenSqlFix?: (actionDesc?: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onOpenSqlFix }) => {
  const [items, setItems] = useState<InventoryItemRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterState, setFilterState] = useState<'all' | 'out_of_stock' | 'low_stock' | 'in_stock'>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Category horizontal scroll ref
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  const [tempMinStock, setTempMinStock] = useState<number>(5);
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminInventory();
      setItems(data);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error cargando inventario.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartEdit = (item: InventoryItemRow) => {
    setEditingId(item.producto_id);
    setTempStock(item.stock_actual);
    setTempMinStock(item.stock_minimo);
  };

  const handleSaveEdit = async (productoId: string) => {
    setIsSaving(true);
    try {
      await updateInventoryStock(productoId, tempStock, tempMinStock);
      setItems((prev) =>
        prev.map((i) =>
          i.producto_id === productoId
            ? { ...i, stock_actual: tempStock, stock_minimo: tempMinStock }
            : i
        )
      );
      setEditingId(null);
      setActionMessage({
        type: 'success',
        text: 'Stock actualizado con éxito en Supabase y sincronizado con la tienda.',
      });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al actualizar inventario.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Distinct categories with counts
  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; outOfStock: number; lowStock: number; totalUnits: number }>();
    items.forEach((item) => {
      const cat = item.categoria_nombre || 'Sin categoría';
      const prev = map.get(cat) || { count: 0, outOfStock: 0, lowStock: 0, totalUnits: 0 };
      map.set(cat, {
        count: prev.count + 1,
        outOfStock: prev.outOfStock + (item.stock_actual <= 0 ? 1 : 0),
        lowStock: prev.lowStock + (item.stock_actual > 0 && item.stock_actual <= item.stock_minimo ? 1 : 0),
        totalUnits: prev.totalUnits + Math.max(0, item.stock_actual),
      });
    });
    return map;
  }, [items]);

  const uniqueCategories = useMemo(() => {
    return Array.from(categoryStats.keys()).sort((a, b) => a.localeCompare(b));
  }, [categoryStats]);

  // Filter items by search (product name), selected category, and status
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Search strictly by Product Name (and SKU/ID if present)
      const matchesSearch =
        !searchTerm.trim() ||
        item.nombre_producto.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
        item.producto_id.toLowerCase().includes(searchTerm.trim().toLowerCase());

      // 2. Filter by Category
      const matchesCategory =
        selectedCategory === 'all' ||
        (item.categoria_nombre || 'Sin categoría') === selectedCategory;

      // 3. Filter by Stock State
      let matchesState = true;
      if (filterState === 'out_of_stock') matchesState = item.stock_actual <= 0;
      if (filterState === 'low_stock')
        matchesState = item.stock_actual > 0 && item.stock_actual <= item.stock_minimo;
      if (filterState === 'in_stock') matchesState = item.stock_actual > item.stock_minimo;

      return matchesSearch && matchesCategory && matchesState;
    });
  }, [items, searchTerm, selectedCategory, filterState]);

  // Group filtered items by category
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, InventoryItemRow[]> = {};
    filteredItems.forEach((item) => {
      const cat = item.categoria_nombre || 'Sin categoría';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems]);

  const toggleCategoryCollapse = (catName: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (!categoryScrollRef.current) return;
    const amount = 240;
    categoryScrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const outOfStockCount = items.filter((i) => i.stock_actual <= 0).length;
  const lowStockCount = items.filter(
    (i) => i.stock_actual > 0 && i.stock_actual <= i.stock_minimo
  ).length;
  const totalStockUnits = items.reduce((acc, curr) => acc + Math.max(0, curr.stock_actual), 0);

  return (
    <div className="space-y-6">
      {/* Toast Alert / Permission Alert */}
      {actionMessage && isPermissionError(actionMessage.text) ? (
        <PermissionErrorBanner
          errorMessage={actionMessage.text}
          onOpenFixModal={() => onOpenSqlFix?.('Permisos en tabla inventario')}
          onDismiss={() => setActionMessage(null)}
        />
      ) : actionMessage ? (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="p-1 hover:bg-black/20 rounded cursor-pointer text-stone-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      {/* Header and Summary Cards */}
      <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#c5a059] font-medium block mb-1">
            Control de Existencias
          </span>
          <h2 className="text-xl sm:text-2xl font-serif-luxury font-semibold text-white tracking-wide">
            Inventario por Categorías
          </h2>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Supervisión dividida por colecciones con búsqueda directa por nombre de producto y edición rápida de stock.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <span className="font-semibold text-base block font-mono">{outOfStockCount}</span>
            <span className="text-[10px] text-rose-400 uppercase">Agotados</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <span className="font-semibold text-base block font-mono">{lowStockCount}</span>
            <span className="text-[10px] text-amber-400 uppercase">Stock Bajo</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
            <span className="font-semibold text-base block text-emerald-400 font-mono">{totalStockUnits}</span>
            <span className="text-[10px] text-emerald-300 uppercase">Unidades Totales</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-stone-300 text-xs">
            <span className="font-semibold text-base block text-white font-mono">{items.length}</span>
            <span className="text-[10px] text-stone-400 uppercase">Productos</span>
          </div>
        </div>
      </div>

      {/* Primary Search Bar & Control Filters */}
      <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* 1. Búsqueda por Nombre de Producto (Prominente y con botón de borrado) */}
          <div className="relative md:col-span-6">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c5a059]" />
            <input
              type="text"
              placeholder="Buscar por nombre de producto (ej. Rolex, Perfume, Anillo)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/40 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-0.5 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 2. Selector de Categoría (Dropdown alternativo) */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-stone-200 focus:outline-none focus:border-[#c5a059] cursor-pointer transition-colors"
            >
              <option value="all">Todas las Categorías ({items.length})</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({categoryStats.get(cat)?.count || 0})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Selector de Estado de Stock */}
          <div className="md:col-span-3">
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-stone-200 focus:outline-none focus:border-[#c5a059] cursor-pointer transition-colors"
            >
              <option value="all">Todas las Existencias</option>
              <option value="out_of_stock">Solo Agotados (Stock 0)</option>
              <option value="low_stock">Solo Stock Bajo (≤ Mínimo)</option>
              <option value="in_stock">Solo Disponibles (&gt; Mínimo)</option>
            </select>
          </div>
        </div>

        {/* Horizontal Category Badges Bar with counts */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0 text-[11px] uppercase tracking-wider text-stone-400 font-medium">
            <Layers size={13} className="text-[#c5a059]" />
            <span className="hidden sm:inline">Categorías:</span>
          </div>

          {/* Scrollable category pills */}
          <div className="relative flex-1 min-w-0">
            <div
              ref={categoryScrollRef}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1"
            >
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-[#c5a059] text-black font-semibold shadow-md shadow-[#c5a059]/20'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 hover:text-white border border-white/[0.06]'
                }`}
              >
                <span>Todas</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === 'all' ? 'bg-black/20 text-black' : 'bg-black/40 text-stone-400'
                }`}>
                  {items.length}
                </span>
              </button>

              {uniqueCategories.map((cat) => {
                const stat = categoryStats.get(cat);
                const isSelected = selectedCategory === cat;
                const hasAlert = (stat?.outOfStock || 0) > 0 || (stat?.lowStock || 0) > 0;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      isSelected
                        ? 'bg-[#c5a059] text-black font-semibold shadow-md shadow-[#c5a059]/20'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-black/20 text-black' : 'bg-black/40 text-stone-400'
                    }`}>
                      {stat?.count || 0}
                    </span>
                    {hasAlert && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Contiene items con stock bajo o agotados" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Switcher: Divided by Category vs Flat List */}
          <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-white/[0.06]">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'grouped' ? 'list' : 'grouped')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grouped'
                  ? 'border-[#c5a059]/40 bg-[#c5a059]/10 text-[#c5a059]'
                  : 'border-white/10 bg-white/[0.02] text-stone-400 hover:text-stone-200'
              }`}
              title="Cambiar entre vista dividida por secciones de categoría o lista continua"
            >
              <SlidersHorizontal size={12} />
              <span className="hidden sm:inline">
                {viewMode === 'grouped' ? 'Dividido por Categoría' : 'Lista Completa'}
              </span>
            </button>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(searchTerm || selectedCategory !== 'all' || filterState !== 'all') && (
          <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-white/[0.04] flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span>Filtros activos:</span>
              {searchTerm && (
                <span className="px-2 py-0.5 rounded bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30 font-medium">
                  Nombre: "{searchTerm}"
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-white/10 text-stone-200 border border-white/15">
                  Categoría: {selectedCategory}
                </span>
              )}
              {filterState !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Estado: {filterState === 'out_of_stock' ? 'Agotados' : filterState === 'low_stock' ? 'Stock Bajo' : 'Disponibles'}
                </span>
              )}
              <span className="text-stone-500">
                ({filteredItems.length} de {items.length} productos coincidentes)
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setFilterState('all');
              }}
              className="text-[#c5a059] hover:underline text-[11px] cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-16 text-center text-xs text-[#c5a059] flex flex-col items-center justify-center gap-3">
          <RefreshCw size={24} className="animate-spin text-[#c5a059]" />
          <span>Sincronizando inventario con Supabase...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-16 text-center text-xs text-stone-400 space-y-3">
          <Boxes size={42} className="mx-auto text-stone-600 mb-2" />
          <p className="font-semibold text-white text-base">
            No se encontraron productos en el inventario
          </p>
          <p className="text-stone-500 max-w-sm mx-auto font-light">
            {searchTerm
              ? `No hay productos cuyo nombre coincida con "${searchTerm}".`
              : 'No hay productos con los filtros seleccionados.'}
          </p>
          {(searchTerm || selectedCategory !== 'all' || filterState !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setFilterState('all');
              }}
              className="mt-3 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-stone-200 text-xs transition-colors cursor-pointer"
            >
              Mostrar todo el inventario
            </button>
          )}
        </div>
      ) : viewMode === 'grouped' ? (
        /* VISTA 1: DIVIDIDO POR CATEGORÍA (SECCIONES AGRUPADAS CON DETALLE) */
        <div className="space-y-6">
          {Object.entries(groupedByCategory).map(([categoryName, categoryItems]) => {
            const isCollapsed = Boolean(collapsedCategories[categoryName]);
            const catStats = categoryStats.get(categoryName);
            const outCount = categoryItems.filter((i) => i.stock_actual <= 0).length;
            const lowCount = categoryItems.filter(
              (i) => i.stock_actual > 0 && i.stock_actual <= i.stock_minimo
            ).length;
            const totalUnits = categoryItems.reduce(
              (acc, curr) => acc + Math.max(0, curr.stock_actual),
              0
            );

            return (
              <div
                key={categoryName}
                className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden transition-all"
              >
                {/* Category Header Accordion Bar */}
                <div
                  onClick={() => toggleCategoryCollapse(categoryName)}
                  className="p-4 sm:p-5 bg-gradient-to-r from-white/[0.03] to-transparent border-b border-white/[0.06] flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors select-none gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] shrink-0">
                      <Layers size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white text-base leading-tight capitalize">
                          {categoryName}
                        </h3>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-stone-300">
                          {categoryItems.length} {categoryItems.length === 1 ? 'producto' : 'productos'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 font-light mt-0.5">
                        Total en stock: <strong className="text-white font-mono">{totalUnits}</strong> unidades
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Alertas de stock en esta categoría */}
                    {outCount > 0 && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        {outCount} agotado(s)
                      </span>
                    )}
                    {lowCount > 0 && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {lowCount} stock bajo
                      </span>
                    )}

                    <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-stone-400 hover:text-white transition-colors">
                      {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </div>
                  </div>
                </div>

                {/* Table for this Category */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/[0.015] text-stone-400 uppercase text-[10px] font-medium border-b border-white/[0.06]">
                        <tr>
                          <th className="py-3 px-4">Producto</th>
                          <th className="py-3 px-4">Precio</th>
                          <th className="py-3 px-4">Stock Actual</th>
                          <th className="py-3 px-4">Stock Mínimo</th>
                          <th className="py-3 px-4">Estado</th>
                          <th className="py-3 px-4 text-right">Modificar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {categoryItems.map((item) => {
                          const isEditingThis = editingId === item.producto_id;
                          const isOutOfStock = item.stock_actual <= 0;
                          const isLowStock =
                            item.stock_actual > 0 && item.stock_actual <= item.stock_minimo;

                          return (
                            <tr
                              key={item.producto_id}
                              className="hover:bg-white/[0.02] transition-colors"
                            >
                              {/* Product Info */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImage({ url: item.imagen_url || '/images/products/gorra-1.webp', title: item.nombre_producto })}
                                    className="relative group shrink-0 cursor-pointer"
                                    title="Ver foto en tamaño completo"
                                  >
                                    <img
                                      src={item.imagen_url || '/images/products/gorra-1.webp'}
                                      alt={item.nombre_producto}
                                      className="w-12 h-12 rounded-xl object-cover bg-black/60 border border-white/15 group-hover:border-[#fbbf24] transition-all shadow-sm"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (!target.src.endsWith('/images/products/gorra-1.webp')) {
                                          target.src = '/images/products/gorra-1.webp';
                                        }
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-[10px]">
                                      🔍
                                    </div>
                                  </button>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-white truncate max-w-[240px] sm:max-w-xs text-sm">
                                      {item.nombre_producto}
                                    </p>
                                    <p className="text-[10px] text-stone-400 font-mono">
                                      ID: {item.producto_id.slice(0, 16)}...
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Price */}
                              <td className="py-3.5 px-4 font-mono text-stone-200">
                                ${item.precio.toFixed(2)}
                              </td>

                              {/* Stock Actual */}
                              <td className="py-3.5 px-4">
                                {isEditingThis ? (
                                  <input
                                    type="number"
                                    min="0"
                                    value={tempStock}
                                    onChange={(e) =>
                                      setTempStock(Math.max(0, parseInt(e.target.value) || 0))
                                    }
                                    className="w-20 px-2 py-1 rounded-lg bg-black border border-[#c5a059] text-white font-mono text-xs focus:outline-none"
                                    autoFocus
                                  />
                                ) : (
                                  <span
                                    className={`font-mono text-sm font-bold ${
                                      isOutOfStock
                                        ? 'text-rose-400'
                                        : isLowStock
                                        ? 'text-amber-400'
                                        : 'text-emerald-400'
                                    }`}
                                  >
                                    {item.stock_actual}
                                  </span>
                                )}
                              </td>

                              {/* Stock Mínimo */}
                              <td className="py-3.5 px-4">
                                {isEditingThis ? (
                                  <input
                                    type="number"
                                    min="1"
                                    value={tempMinStock}
                                    onChange={(e) =>
                                      setTempMinStock(Math.max(1, parseInt(e.target.value) || 1))
                                    }
                                    className="w-16 px-2 py-1 rounded-lg bg-black border border-[#c5a059] text-white font-mono text-xs focus:outline-none"
                                  />
                                ) : (
                                  <span className="font-mono text-stone-400">
                                    {item.stock_minimo}
                                  </span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-4">
                                {isOutOfStock ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    <span>Agotado (0)</span>
                                  </span>
                                ) : isLowStock ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <span>Stock bajo</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span>Disponible</span>
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right">
                                {isEditingThis ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleSaveEdit(item.producto_id)}
                                      disabled={isSaving}
                                      className="px-2.5 py-1 bg-[#c5a059] hover:bg-[#b5914a] text-black font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 text-xs shadow-md shadow-[#c5a059]/20"
                                    >
                                      <Check size={13} />
                                      <span>Guardar</span>
                                    </button>
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="p-1 rounded-lg bg-white/10 text-stone-300 hover:text-white cursor-pointer"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleStartEdit(item)}
                                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer border border-white/[0.08]"
                                  >
                                    Editar Stock
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA 2: LISTA CONTINUA (TABLA GENERAL) */
        <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-stone-400 uppercase text-[10px] font-medium border-b border-white/[0.06]">
                <tr>
                  <th className="py-3.5 px-4">Producto</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Stock Actual</th>
                  <th className="py-3.5 px-4">Stock Mínimo</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredItems.map((item) => {
                  const isEditingThis = editingId === item.producto_id;
                  const isOutOfStock = item.stock_actual <= 0;
                  const isLowStock =
                    item.stock_actual > 0 && item.stock_actual <= item.stock_minimo;

                  return (
                    <tr
                      key={item.producto_id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ url: item.imagen_url || '/images/products/gorra-1.webp', title: item.nombre_producto })}
                            className="relative group shrink-0 cursor-pointer"
                            title="Ver foto en tamaño completo"
                          >
                            <img
                              src={item.imagen_url || '/images/products/gorra-1.webp'}
                              alt={item.nombre_producto}
                              className="w-12 h-12 rounded-xl object-cover bg-black/60 border border-white/15 group-hover:border-[#fbbf24] transition-all shadow-sm"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.src.endsWith('/images/products/gorra-1.webp')) {
                                  target.src = '/images/products/gorra-1.webp';
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-[10px]">
                              🔍
                            </div>
                          </button>
                          <div>
                            <p className="font-semibold text-white truncate max-w-[200px] text-sm">
                              {item.nombre_producto}
                            </p>
                            <p className="text-[11px] text-[#fbbf24] font-mono font-medium">
                              ${item.precio.toFixed(2)} USD
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-stone-300">
                        <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-[11px] font-medium">
                          {item.categoria_nombre}
                        </span>
                      </td>

                      {/* Stock Actual */}
                      <td className="py-3.5 px-4">
                        {isEditingThis ? (
                          <input
                            type="number"
                            min="0"
                            value={tempStock}
                            onChange={(e) =>
                              setTempStock(Math.max(0, parseInt(e.target.value) || 0))
                            }
                            className="w-20 px-2 py-1 rounded-lg bg-black border border-[#c5a059] text-white font-mono text-xs focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <span
                            className={`font-mono text-sm font-bold ${
                              isOutOfStock
                                ? 'text-rose-400'
                                : isLowStock
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {item.stock_actual}
                          </span>
                        )}
                      </td>

                      {/* Stock Mínimo */}
                      <td className="py-3.5 px-4">
                        {isEditingThis ? (
                          <input
                            type="number"
                            min="1"
                            value={tempMinStock}
                            onChange={(e) =>
                              setTempMinStock(Math.max(1, parseInt(e.target.value) || 1))
                            }
                            className="w-16 px-2 py-1 rounded-lg bg-black border border-[#c5a059] text-white font-mono text-xs focus:outline-none"
                          />
                        ) : (
                          <span className="font-mono text-stone-400">
                            {item.stock_minimo}
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>Agotado (0)</span>
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>Stock bajo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Disponible</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isEditingThis ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(item.producto_id)}
                              disabled={isSaving}
                              className="px-2.5 py-1 bg-[#c5a059] hover:bg-[#b5914a] text-black font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 text-xs shadow-md shadow-[#c5a059]/20"
                            >
                              <Check size={13} />
                              <span>Guardar</span>
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded-lg bg-white/10 text-stone-300 hover:text-white cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer border border-white/[0.08]"
                          >
                            Editar Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Modal de Vista Previa de Imagen del Producto */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-[#121216] border border-white/15 rounded-2xl p-4 max-w-lg w-full max-h-[90vh] flex flex-col items-center shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <span className="text-xs font-semibold text-white truncate pr-4">
                {previewImage.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="w-full max-h-[70vh] flex items-center justify-center overflow-hidden rounded-xl bg-black">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
