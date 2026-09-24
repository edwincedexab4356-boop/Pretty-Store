import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Filter,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Download,
} from 'lucide-react';
import { getAdminSales } from '../../../services/adminService';
import { isPermissionError } from '../../../utils/supabaseSqlFix';
import { PermissionErrorBanner } from '../PermissionErrorBanner';

interface SalesViewProps {
  onOpenSqlFix?: (desc?: string) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ onOpenSqlFix }) => {
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('month');
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getAdminSales();
      setSales(data);
    } catch (e: any) {
      const msg = e?.message || 'Error al cargar ventas.';
      console.warn('Error loading sales:', e);
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Metrics
  const totalSalesAll = sales.reduce((acc, s) => acc + (s.total || 0), 0);
  const totalSalesToday = sales
    .filter((s) => (s.fecha || '') >= startOfToday)
    .reduce((acc, s) => acc + (s.total || 0), 0);
  const totalSalesWeek = sales
    .filter((s) => (s.fecha || '') >= startOfWeek)
    .reduce((acc, s) => acc + (s.total || 0), 0);
  const totalSalesMonth = sales
    .filter((s) => (s.fecha || '') >= startOfMonth)
    .reduce((acc, s) => acc + (s.total || 0), 0);

  // Filtered rows
  const filteredSales = sales.filter((s) => {
    const f = s.fecha || '';
    if (timeFilter === 'today') return f >= startOfToday;
    if (timeFilter === 'week') return f >= startOfWeek;
    if (timeFilter === 'month') return f >= startOfMonth;
    return true;
  });

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Permission Warning Banner if any error */}
      {loadError && isPermissionError(loadError) && (
        <PermissionErrorBanner
          errorMessage={loadError}
          onOpenFixModal={() => onOpenSqlFix?.('Permisos en tabla pedidos / clientes')}
          onDismiss={() => setLoadError(null)}
        />
      )}

      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-luxury">
            Reporte de Ventas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Supervisa el flujo de caja, ingresos netos y métodos de pago registrados en tus pedidos.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors self-start md:self-auto"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Actualizar Ventas</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Ventas de Hoy</span>
          <div className="text-2xl font-bold text-white font-mono">{formatMoney(totalSalesToday)}</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Últimos 7 Días</span>
          <div className="text-2xl font-bold text-amber-400 font-mono">{formatMoney(totalSalesWeek)}</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Este Mes</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{formatMoney(totalSalesMonth)}</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Total Histórico</span>
          <div className="text-2xl font-bold text-white font-mono">{formatMoney(totalSalesAll)}</div>
        </div>
      </div>

      {/* Time Filter Switcher */}
      <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit text-xs">
        <button
          onClick={() => setTimeFilter('today')}
          className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
            timeFilter === 'today' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Hoy
        </button>
        <button
          onClick={() => setTimeFilter('week')}
          className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
            timeFilter === 'week' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Esta Semana
        </button>
        <button
          onClick={() => setTimeFilter('month')}
          className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
            timeFilter === 'month' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Este Mes
        </button>
        <button
          onClick={() => setTimeFilter('all')}
          className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
            timeFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Histórico Total
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-amber-400" />
            <span>Cargando transacciones de venta...</span>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <TrendingUp size={36} className="mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-white">No hay transacciones registradas en este periodo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Fecha y Hora</th>
                  <th className="py-3.5 px-4">Pedido</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Método de Pago</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Monto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {s.fecha
                        ? new Date(s.fecha).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      #PED-{s.pedido_id.replace(/-/g, '').slice(0, 6).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 text-white font-semibold">
                      {s.cliente?.nombre || 'Cliente General'}
                    </td>
                    <td className="py-3.5 px-4 uppercase font-mono text-[11px] text-slate-300">
                      {s.metodo_pago}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                        {s.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-base text-white">
                      {formatMoney(s.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
