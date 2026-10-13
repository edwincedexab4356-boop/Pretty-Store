import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertTriangle, Check, Save } from 'lucide-react';
import { Producto } from '../../../types/database';
import { getAdminProducts, updateAdminStock } from '../../../services/adminService';
import { getPrimaryProductImage } from '../../../utils/productImages';

export const InventoryView: React.FC = () => {
  const [products, setProducts] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockChanges, setStockChanges] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminProducts();
      setProducts(data);
      const initial: Record<string, number> = {};
      data.forEach((p) => {
        initial[p.id] = p.stock;
      });
      setStockChanges(initial);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStockChange = (id: string, val: number) => {
    setStockChanges((prev) => ({ ...prev, [id]: Math.max(0, val) }));
  };

  const handleSaveStock = async (id: string) => {
    const newStock = stockChanges[id];
    if (newStock === undefined) return;
    setSavingId(id);
    try {
      await updateAdminStock(id, newStock);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
      );
    } finally {
      setSavingId(null);
    }
  };

  const filtered = products.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Buscar por producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-[#100f14] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-stone-400 bg-black/40">
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4 text-center">Estado de Stock</th>
                <th className="py-3 px-4 text-center">Ajustar Unidades</th>
                <th className="py-3 px-4 text-right">Guardar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-stone-300">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-stone-500">
                    Cargando inventario...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-stone-500">
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const currentStock = stockChanges[p.id] !== undefined ? stockChanges[p.id] : p.stock;
                  const hasChanged = currentStock !== p.stock;

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                            <img
                              src={getPrimaryProductImage(p, '/images/logo/logotipo.jpeg')}
                              alt={p.nombre}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/images/logo/logotipo.jpeg';
                              }}
                            />
                          </div>
                          <span className="truncate">{p.nombre}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {p.stock <= 0 ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase">
                            Agotado (0)
                          </span>
                        ) : p.stock <= 5 ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase">
                            Bajo Stock ({p.stock})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                            Suficiente ({p.stock})
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleStockChange(p.id, currentStock - 1)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={currentStock}
                            onChange={(e) => handleStockChange(p.id, parseInt(e.target.value, 10) || 0)}
                            className="w-16 px-2 py-1 text-center font-mono font-bold text-white bg-black/60 border border-white/20 rounded-lg"
                          />
                          <button
                            onClick={() => handleStockChange(p.id, currentStock + 1)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleSaveStock(p.id)}
                          disabled={!hasChanged || savingId === p.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ml-auto cursor-pointer ${
                            hasChanged
                              ? 'bg-[#c5a059] text-black font-bold shadow-md'
                              : 'bg-white/5 text-stone-500 cursor-not-allowed'
                          }`}
                        >
                          <Save size={13} />
                          <span>{savingId === p.id ? 'Guardando...' : 'Aplicar'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
