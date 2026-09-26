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
  Plus,
  CheckCircle2,
  X,
} from 'lucide-react';
import { getAdminSales } from '../../../services/adminService';
import { isPermissionError } from '../../../utils/supabaseSqlFix';
import { PermissionErrorBanner } from '../PermissionErrorBanner';
import { ManualSaleModal } from '../ManualSaleModal';

interface SalesViewProps {
  onOpenSqlFix?: (desc?: string) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ onOpenSqlFix }) => {
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('month');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isManualSaleOpen, setIsManualSaleOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      {/* Success notification banner */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-stone-400 hover:text-white p-1 rounded cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Permission Warning Banner if any error */}
      {loadError && isPermissionError(loadError) && (
        <PermissionErrorBanner
          errorMessage={loadError}
          onOpenFixModal={() => onOpenSqlFix?.('Permisos en tabla pedidos / clientes')}
          onDismiss={() => setLoadError(null)}
        />
      )}

      {/* Header */}
      <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#c5a059] font-medium block mb-1">
            Métricas Comerciales
          </span>
          <h2 className="text-xl sm:text-2xl font-serif-luxury font-semibold text-white tracking-wide">
            Reporte de Ventas & Facturación
          </h2>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Seguimiento de ingresos, volumen transaccional y registro manual de ventas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={() => setIsManualSaleOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#d4af37] hover:opacity-95 text-black font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-[#c5a059]/20"
          >
            <Plus size={15} />
            <span>Registrar Venta Manual</span>
          </button>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-stone-200 hover:text-white text-xs font-medium border border-white/[0.08] flex items-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#c5a059]' : 'text-stone-400'} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0e0e12] border border-white/[0.08] shadow-xl">
          <span className="text-[10px] text-stone-400 uppercase tracking-wider block mb-1 font-medium">
            Ventas Hoy
          </span>
          <div className="text-2xl font-semibold text-white font-mono">{formatMoney(totalSalesToday)}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e0e12] border border-white/[0.08] shadow-xl">
          <span className="text-[10px] text-[#c5a059] uppercase tracking-wider block mb-1 font-medium">
            Últimos 7 Días
          </span>
          <div className="text-2xl font-semibold text-[#c5a059] font-mono">{formatMoney(totalSalesWeek)}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e0e12] border border-white/[0.08] shadow-xl">
          <span className="text-[10px] text-emerald-400 uppercase tracking-wider block mb-1 font-medium">
            Este Mes
          </span>
          <div className="text-2xl font-semibold text-emerald-400 font-mono">{formatMoney(totalSalesMonth)}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e0e12] border border-white/[0.08] shadow-xl">
          <span className="text-[10px] text-stone-400 uppercase tracking-wider block mb-1 font-medium">
            Total Histórico
          </span>
          <div className="text-2xl font-semibold text-stone-200 font-mono">{formatMoney(totalSalesAll)}</div>
        </div>
      </div>

      {/* Time Filter Switcher */}
      <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/[0.08] w-fit text-xs">
        <button
          onClick={() => setTimeFilter('today')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
            timeFilter === 'today'
              ? 'bg-[#c5a059] text-black font-semibold'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          Hoy
        </button>
        <button
          onClick={() => setTimeFilter('week')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
            timeFilter === 'week'
              ? 'bg-[#c5a059] text-black font-semibold'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          Esta Semana
        </button>
        <button
          onClick={() => setTimeFilter('month')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
            timeFilter === 'month'
              ? 'bg-[#c5a059] text-black font-semibold'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          Este Mes
        </button>
        <button
          onClick={() => setTimeFilter('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
            timeFilter === 'all'
              ? 'bg-[#c5a059] text-black font-semibold'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          Histórico Completo
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-[#c5a059]" />
            <span>Calculando métricas de ventas...</span>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400 space-y-2">
            <TrendingUp size={36} className="mx-auto text-stone-600 mb-2" />
            <p className="font-serif-luxury font-semibold text-white text-base">No hay ventas en este período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-stone-400 uppercase text-[10px] font-medium tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Nº Pedido</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Método</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 text-stone-400 font-light">
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
                    <td className="py-3.5 px-4 font-mono font-medium text-[#c5a059]">
                      #PED-{String(s.pedido_id || s.id || '').replace(/-/g, '').slice(0, 6).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 text-white font-medium">
                      {s.cliente?.nombre || 'Cliente General'}
                    </td>
                    <td className="py-3.5 px-4 uppercase font-mono text-[11px] text-stone-300">
                      {s.metodo_pago}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                        {s.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-base text-white">
                      {formatMoney(s.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Sale Creation Modal */}
      <ManualSaleModal
        isOpen={isManualSaleOpen}
        onClose={() => setIsManualSaleOpen(false)}
        onSuccess={() => {
          setSuccessMsg('¡Venta manual registrada exitosamente en el sistema!');
          loadData();
        }}
      />
    </div>
  );
};
