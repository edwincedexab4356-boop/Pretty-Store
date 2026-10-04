import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowRight,
  Boxes,
  ChevronRight,
} from 'lucide-react';
import {
  fetchDashboardStats,
  fetchSalesByPeriod,
  fetchTopProducts,
  getAdminOrders,
  ChartDayPoint,
  TopProductItem,
} from '../../../services/adminService';
import { DashboardStats, Pedido } from '../../../types/database';
import { AdminTab } from '../../../hooks/useAdminRoute';
import { isPermissionError } from '../../../utils/supabaseSqlFix';
import { PermissionErrorBanner } from '../PermissionErrorBanner';

interface DashboardViewProps {
  onNavigate: (tab: AdminTab) => void;
  onSelectOrder?: (order: Pedido) => void;
  onOpenSqlFix?: (desc?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectOrder,
  onOpenSqlFix,
}) => {
  const [stats, setStats] = useState<DashboardStats>({
    ventas_hoy: 0,
    ventas_mes: 0,
    pedidos_hoy: 0,
    pedidos_pendientes: 0,
    total_productos: 0,
    productos_agotados: 0,
    productos_stock_bajo: 0,
  });

  const [period, setPeriod] = useState<7 | 30>(7);
  const [chartData, setChartData] = useState<ChartDayPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [s, chart, top, orders] = await Promise.all([
        fetchDashboardStats(),
        fetchSalesByPeriod(period),
        fetchTopProducts(),
        getAdminOrders(),
      ]);

      setStats(s);
      setChartData(chart);
      setTopProducts(top);
      setRecentOrders(orders.slice(0, 5));
    } catch (e: any) {
      const msg = e?.message || 'Error al conectar con la base de datos de Supabase.';
      console.warn('Error loading dashboard data:', e);
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [period]);

  const maxSaleValue = Math.max(...chartData.map((d) => d.total), 10);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'entregado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Entregado
          </span>
        );
      case 'confirmado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Confirmado
          </span>
        );
      case 'preparando':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Preparando
          </span>
        );
      case 'enviado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30">
            Enviado
          </span>
        );
      case 'cancelado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-500/15 text-stone-300 border border-stone-500/30">
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Permission Warning Banner if any error */}
      {loadError && isPermissionError(loadError) && (
        <PermissionErrorBanner
          errorMessage={loadError}
          onOpenFixModal={() => onOpenSqlFix?.('Permisos en tablas de métricas (pedidos, productos, inventario)')}
          onDismiss={() => setLoadError(null)}
        />
      )}

      {/* Top Welcome Banner */}
      <div className="rounded-2xl bg-[#0e0e12] border border-white/[0.08] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#c5a059] font-medium block mb-1">
            Resumen General
          </span>
          <h2 className="text-xl sm:text-2xl font-serif-luxury font-semibold text-white tracking-wide">
            Panel de Control
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-xl font-light">
            Supervisa en tiempo real las ventas, inventario y pedidos de tu boutique Pretty Store.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('productos')}
            className="px-4 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Package size={15} />
            <span>Nuevo Producto</span>
          </button>
          <button
            onClick={() => onNavigate('pedidos')}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-stone-200 font-medium text-xs border border-white/[0.08] transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ShoppingBag size={15} />
            <span>Ver Pedidos</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Module 1: Ventas Hoy */}
        <div className="p-5 rounded-2xl bg-[#0e0e12] border border-white/[0.08] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">
                Hoy
              </span>
              <h4 className="text-xs font-medium text-stone-300 mt-0.5">Ventas de Hoy</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/20 flex items-center justify-center text-[#c5a059]">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-semibold text-white font-mono">
            {formatMoney(stats.ventas_hoy)}
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-stone-400">
            <span className="text-[#c5a059]">{stats.pedidos_hoy} pedidos hoy</span>
            <span className="text-stone-500 text-[11px]">En tiempo real</span>
          </div>
        </div>

        {/* Module 2: Ventas del Mes */}
        <div className="p-5 rounded-2xl bg-[#0e0e12] border border-white/[0.08] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">
                Mes Actual
              </span>
              <h4 className="text-xs font-medium text-stone-300 mt-0.5">Ventas del Mes</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-semibold text-white font-mono">
            {formatMoney(stats.ventas_mes)}
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-stone-400">
            <span className="text-purple-300">Periodo activo</span>
            <span className="text-stone-500 text-[11px]">Últimos 30 días</span>
          </div>
        </div>

        {/* Module 3: Pedidos Pendientes */}
        <div
          onClick={() => onNavigate('pedidos')}
          className="p-5 rounded-2xl bg-[#0e0e12] border border-white/[0.08] hover:border-amber-500/30 transition-all shadow-lg cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">
                Por Atender
              </span>
              <h4 className="text-xs font-medium text-stone-300 mt-0.5">Pedidos Pendientes</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl font-semibold text-amber-300 font-mono">
            {stats.pedidos_pendientes}
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-stone-400">
            <span className="text-amber-400 flex items-center gap-1">
              <span>Gestionar pedidos</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>

        {/* Module 4: Alertas de Inventario */}
        <div
          onClick={() => onNavigate('inventario')}
          className="p-5 rounded-2xl bg-[#0e0e12] border border-white/[0.08] hover:border-rose-500/30 transition-all shadow-lg cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">
                Stock
              </span>
              <h4 className="text-xs font-medium text-stone-300 mt-0.5">Alertas de Inventario</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-2xl font-semibold text-rose-400">
              {stats.productos_agotados}
            </span>
            <span className="text-xs text-rose-400/80">agotados</span>
            <span className="text-stone-600">•</span>
            <span className="text-base font-medium text-amber-400">
              {stats.productos_stock_bajo}
            </span>
            <span className="text-[11px] text-amber-400/80">bajo stock</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-stone-400">
            <span>De {stats.total_productos} productos</span>
            <span className="text-stone-500 text-[11px]">Ver inventario</span>
          </div>
        </div>
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales by Day Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0e0e12] border border-white/[0.08] shadow-lg flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/[0.06]">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#c5a059] block mb-0.5 font-medium">
                Rendimiento Financiero
              </span>
              <h3 className="text-base font-serif-luxury font-semibold text-white tracking-wide">
                Ventas por Día
              </h3>
            </div>

            {/* Period switcher */}
            <div className="flex items-center bg-white/[0.03] p-1 rounded-xl border border-white/[0.08] text-xs">
              <button
                onClick={() => setPeriod(7)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  period === 7
                    ? 'bg-[#c5a059] text-black font-semibold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                7 Días
              </button>
              <button
                onClick={() => setPeriod(30)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  period === 30
                    ? 'bg-[#c5a059] text-black font-semibold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                30 Días
              </button>
            </div>
          </div>

          {/* Clean Bars Chart */}
          <div className="h-64 flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-2 relative">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-stone-500">
                No hay ventas registradas en este periodo
              </div>
            ) : (
              chartData.map((d, idx) => {
                const heightPercent = maxSaleValue > 0 ? Math.max(6, (d.total / maxSaleValue) * 100) : 6;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative z-10">
                    {/* Hover tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/20 text-white text-[10px] py-1 px-2.5 rounded-md pointer-events-none whitespace-nowrap shadow-lg z-20 font-mono">
                      {d.label}: {formatMoney(d.total)} ({d.orders} ped)
                    </div>

                    <div className="w-full flex items-end justify-center h-48">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[28px] rounded-t transition-all duration-300 ${
                          d.total > 0
                            ? 'bg-gradient-to-t from-[#9a7837] to-[#c5a059] hover:brightness-110'
                            : 'bg-white/[0.04]'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-stone-400 mt-2 truncate w-full text-center">
                      {d.label.split(' ')[0]}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-400 gap-2">
            <span className="text-stone-500">
              Datos registrados desde pedidos
            </span>
            <span className="text-[#c5a059] font-medium">
              Total periodo: {formatMoney(chartData.reduce((acc, c) => acc + c.total, 0))}
            </span>
          </div>
        </div>

        {/* Top Products Card (1 col) */}
        <div className="p-6 rounded-2xl bg-[#0e0e12] border border-white/[0.08] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#c5a059] block mb-0.5 font-medium">
                  Populares
                </span>
                <h3 className="text-base font-serif-luxury font-semibold text-white">
                  Más Vendidos
                </h3>
              </div>
              <button
                onClick={() => onNavigate('productos')}
                className="text-xs text-[#c5a059] hover:underline cursor-pointer"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {topProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-500">
                  No hay ventas registradas aún
                </div>
              ) : (
                topProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-colors">
                    <span className="w-6 h-6 rounded-full bg-white/[0.05] text-[10px] font-bold text-[#c5a059] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {p.imagen_url ? (
                      <img
                        src={p.imagen_url}
                        alt={p.nombre}
                        className="w-10 h-10 rounded-lg object-cover bg-black border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-black border border-white/10 flex items-center justify-center text-stone-600 shrink-0">
                        <Package size={16} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {p.nombre}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        {p.cantidad} unidades
                      </p>
                    </div>

                    <span className="text-xs font-semibold text-white font-mono shrink-0">
                      {formatMoney(p.total_ventas)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] text-stone-500">
            Calculado en base a órdenes confirmadas
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="p-6 rounded-2xl bg-[#0e0e12] border border-white/[0.08] shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/[0.06]">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#c5a059] block mb-0.5 font-medium">
              Actividad Reciente
            </span>
            <h3 className="text-base sm:text-lg font-serif-luxury font-semibold text-white">
              Últimos Pedidos
            </h3>
          </div>

          <button
            onClick={() => onNavigate('pedidos')}
            className="text-xs text-[#c5a059] hover:text-white font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>Ver todos los pedidos</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500">
            No hay pedidos registrados en la tienda todavía
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-stone-400 uppercase text-[10px] font-medium border-b border-white/[0.06]">
                <tr>
                  <th className="py-3 px-4">Pedido</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-white">
                      #{String(order.id || '').replace(/-/g, '').slice(0, 6).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 text-stone-400 text-[11px]">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">
                        {order.cliente?.nombre || 'Cliente sin registro'}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {order.cliente?.telefono || order.direccion || '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 uppercase text-stone-300 text-[11px]">
                      {order.metodo_pago}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white font-mono">
                      {formatMoney(order.total)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(order.estado)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          if (onSelectOrder) onSelectOrder(order);
                          onNavigate('pedidos');
                        }}
                        className="text-xs text-[#c5a059] hover:underline cursor-pointer"
                      >
                        Ver Detalle
                      </button>
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
