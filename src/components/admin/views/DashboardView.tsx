import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Boxes,
  Layers,
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
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Entregado</span>;
      case 'confirmado':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">Confirmado</span>;
      case 'preparando':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Preparando</span>;
      case 'enviado':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Enviado</span>;
      case 'cancelado':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Cancelado</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Pendiente</span>;
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

      {/* Top Banner / Quick Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs uppercase font-bold tracking-widest text-amber-400 block mb-1">
            Resumen General de Operaciones
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif-luxury">
            Bienvenido al Panel de Control
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
            Supervisa en vivo tus pedidos, existencias de inventario en tiempo real y transacciones registradas en Supabase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={() => onNavigate('productos')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Package size={15} />
            <span>+ Agregar Producto</span>
          </button>
          <button
            onClick={() => onNavigate('pedidos')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag size={15} />
            <span>Ver Pedidos</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Ventas Hoy */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/30 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Ventas de Hoy</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-serif-luxury">
            {formatMoney(stats.ventas_hoy)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{stats.pedidos_hoy}</span>
            <span>pedido(s) recibidos hoy</span>
          </p>
        </div>

        {/* Card 2: Ventas del Mes */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/30 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Ventas del Mes</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-serif-luxury">
            {formatMoney(stats.ventas_mes)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Mes calendario actual
          </p>
        </div>

        {/* Card 3: Pedidos Pendientes */}
        <div
          onClick={() => onNavigate('pedidos')}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all shadow-xl cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Pedidos Pendientes</span>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
              <Clock size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-serif-luxury">
            {stats.pedidos_pendientes}
          </div>
          <p className="text-[11px] text-amber-400/90 mt-2 flex items-center gap-1">
            <span>Requieren atención</span>
            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </p>
        </div>

        {/* Card 4: Alertas de Stock */}
        <div
          onClick={() => onNavigate('inventario')}
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/30 transition-all shadow-xl cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Alertas de Inventario</span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-400 font-serif-luxury">
              {stats.productos_agotados}
            </span>
            <span className="text-xs text-slate-400">agotados</span>
            <span className="text-slate-600">•</span>
            <span className="text-sm font-bold text-amber-400">
              {stats.productos_stock_bajo}
            </span>
            <span className="text-[11px] text-slate-400">bajo</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span>De {stats.total_productos} productos totales</span>
            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </p>
        </div>
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales by Day Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block mb-0.5">
                Evolución de Ingresos
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white font-serif-luxury">
                Ventas por Día
              </h3>
            </div>

            {/* Period switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setPeriod(7)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  period === 7 ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Últimos 7 días
              </button>
              <button
                onClick={() => setPeriod(30)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  period === 30 ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Últimos 30 días
              </button>
            </div>
          </div>

          {/* Dynamic SVG / CSS Bars Chart */}
          <div className="h-64 flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-2">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                No hay pedidos registrados en este periodo aún.
              </div>
            ) : (
              chartData.map((d, idx) => {
                const heightPercent = maxSaleValue > 0 ? Math.max(6, (d.total / maxSaleValue) * 100) : 6;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Hover tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-700 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap shadow-xl z-20 font-mono">
                      {d.label}: {formatMoney(d.total)} ({d.orders} pedidos)
                    </div>

                    <div className="w-full flex items-end justify-center h-48">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 ${
                          d.total > 0
                            ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-lg shadow-amber-500/20 group-hover:from-amber-500 group-hover:to-amber-300'
                            : 'bg-slate-800/60'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 truncate w-full text-center">
                      {d.label.split(' ')[0]}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Valores calculados dinámicamente desde <code>public.pedidos</code></span>
            <span className="text-amber-400 font-mono">Total Periodo: {formatMoney(chartData.reduce((acc, c) => acc + c.total, 0))}</span>
          </div>
        </div>

        {/* Top Products Card (1 col) */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block mb-0.5">
                  Rendimiento
                </span>
                <h3 className="text-base font-bold text-white font-serif-luxury">
                  Más Vendidos
                </h3>
              </div>
              <button
                onClick={() => onNavigate('productos')}
                className="text-xs text-amber-400 hover:underline cursor-pointer"
              >
                Ver catálogo
              </button>
            </div>

            <div className="space-y-3.5">
              {topProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Aún no se han completado pedidos con detalle de productos.
                </div>
              ) : (
                topProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-[11px] font-bold text-amber-400 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {p.imagen_url ? (
                      <img
                        src={p.imagen_url}
                        alt={p.nombre}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-900 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                        <Package size={16} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {p.nombre}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {p.cantidad} unidades vendidas
                      </p>
                    </div>

                    <span className="text-xs font-bold text-amber-400 font-mono">
                      {formatMoney(p.total_ventas)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            Basado en <code>public.detalle_pedidos</code>
          </div>
        </div>
      </div>

      {/* Recent Orders & Quick Management */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block mb-0.5">
              Últimas Transacciones
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white font-serif-luxury">
              Pedidos Recientes
            </h3>
          </div>

          <button
            onClick={() => onNavigate('pedidos')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Ver todos los pedidos</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No hay pedidos registrados todavía. Cuando un cliente realice un checkout, aparecerá aquí inmediatamente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Pedido</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente / Contacto</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      #PED-{order.id.replace(/-/g, '').slice(0, 6).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
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
                      <div className="font-semibold text-white">
                        {order.cliente?.nombre || 'Cliente sin registro'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {order.cliente?.telefono || order.direccion || '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 uppercase text-slate-300 font-mono text-[11px]">
                      {order.metodo_pago}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white font-mono">
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
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline"
                      >
                        Detalle
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
