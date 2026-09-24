import React, { useState, useEffect } from 'react';
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
  const [filterState, setFilterState] = useState<'all' | 'out_of_stock' | 'low_stock' | 'in_stock'>('all');

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

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoria_nombre.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesState = true;
    if (filterState === 'out_of_stock') matchesState = item.stock_actual <= 0;
    if (filterState === 'low_stock')
      matchesState = item.stock_actual > 0 && item.stock_actual <= item.stock_minimo;
    if (filterState === 'in_stock') matchesState = item.stock_actual > item.stock_minimo;

    return matchesSearch && matchesState;
  });

  const outOfStockCount = items.filter((i) => i.stock_actual <= 0).length;
  const lowStockCount = items.filter(
    (i) => i.stock_actual > 0 && i.stock_actual <= i.stock_minimo
  ).length;

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
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs ${
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
            className="p-1 hover:bg-black/20 rounded cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      {/* Header and Summary Cards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-luxury">
            Inventario & Existencias
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cuando el stock llega a 0, la tienda desactiva automáticamente "Agregar al carrito" y muestra "AGOTADO".
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            <span className="font-bold text-base block font-mono">{outOfStockCount}</span>
            <span>Agotados (0)</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            <span className="font-bold text-base block font-mono">{lowStockCount}</span>
            <span>Stock Bajo</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 text-xs">
            <span className="font-bold text-base block font-mono text-white">{items.length}</span>
            <span>Total Artículos</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por producto o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value as any)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">Todas las existencias</option>
            <option value="out_of_stock">🔴 Solo Agotados (Stock 0)</option>
            <option value="low_stock">🟡 Solo Stock Bajo (≤ Mínimo)</option>
            <option value="in_stock">🟢 Solo Disponibles (&gt; Mínimo)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-amber-400" />
            <span>Cargando inventario de Supabase...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Boxes size={36} className="mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-white">No hay productos en esta vista de inventario.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Producto</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Stock Actual</th>
                  <th className="py-3.5 px-4">Stock Mínimo</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((item) => {
                  const isEditingThis = editingId === item.producto_id;
                  const isOutOfStock = item.stock_actual <= 0;
                  const isLowStock = item.stock_actual > 0 && item.stock_actual <= item.stock_minimo;

                  return (
                    <tr key={item.producto_id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {item.imagen_url ? (
                            <img
                              src={item.imagen_url}
                              alt={item.nombre_producto}
                              className="w-10 h-10 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-800"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                              <Package size={16} />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white truncate max-w-[200px]">
                              {item.nombre_producto}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              ${item.precio.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
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
                            onChange={(e) => setTempStock(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-20 px-2 py-1 rounded bg-slate-950 border border-amber-500 text-white font-mono text-xs focus:outline-none"
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
                            onChange={(e) => setTempMinStock(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 px-2 py-1 rounded bg-slate-950 border border-amber-500 text-white font-mono text-xs focus:outline-none"
                          />
                        ) : (
                          <span className="font-mono text-slate-400">
                            {item.stock_minimo}
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>🔴 Agotado</span>
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>🟡 Stock bajo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>🟢 Disponible</span>
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
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Check size={13} />
                              <span>Guardar</span>
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Modificar Stock
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
    </div>
  );
};
