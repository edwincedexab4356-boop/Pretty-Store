import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Package,
  Plus,
  ArrowRight,
  Eye,
  Calendar,
} from 'lucide-react';
import { Pedido, Producto } from '../../../types/database';
import { getAdminOrders, getAdminProducts } from '../../../services/adminService';
import { AdminTab } from '../AdminSidebar';

interface DashboardStats {
  ventas_hoy: number;
  ventas_mes: number;
  pedidos_hoy: number;
  pedidos_pendientes: number;
  total_productos: number;
  productos_agotados: number;
  productos_stock_bajo: number;
}

interface DailySales {
  date: string;
  label: string;
  total: number;
}

export const DashboardView: React.FC<{ onNavigateTab: (tab: AdminTab) => void }> = ({ onNavigateTab }) => {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    ventas_hoy: 0,
    ventas_mes: 0,
    pedidos_hoy: 0,
    pedidos_pendientes: 0,
    total_productos: 0,
    productos_agotados: 0,
    productos_stock_bajo: 0,
  });
  const [daysFilter, setDaysFilter] = useState<number>(7);
  const [salesHistory, setSalesHistory] = useState<DailySales[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([getAdminOrders(), getAdminProducts()])
      .then(([oList, pList]) => {
        setOrders(oList);
        setProducts(pList);

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        let vHoy = 0;
        let vMes = 0;
        let pHoy = 0;
        let pPend = 0;

        oList.forEach((o) => {
          const createdAt = o.created_at || '';
          const total = Number(o.total) || 0;
          const isAprobado = o.estado !== 'pendiente' && o.estado !== 'cancelado';
          if (createdAt >= startOfDay && isAprobado) {
            vHoy += total;
            pHoy += 1;
          }
          if (createdAt >= startOfMonth && isAprobado) {
            vMes += total;
          }
          if (o.estado === 'pendiente') {
            pPend += 1;
          }
        });

        let pAgotados = 0;
        let pBajo = 0;
        pList.forEach((p) => {
          const stock = Number(p.stock) || 0;
          if (stock <= 0) pAgotados += 1;
          else if (stock <= 5) pBajo += 1;
        });

        setStats({
          ventas_hoy: vHoy,
          ventas_mes: vMes,
          pedidos_hoy: pHoy,
          pedidos_pendientes: pPend,
          total_productos: pList.length,
          productos_agotados: pAgotados,
          productos_stock_bajo: pBajo,
        });

        const history: DailySales[] = [];
        for (let i = daysFilter - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const dayLabel = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });

          const dayTotal = oList
            .filter((ord) => ord.created_at && ord.created_at.startsWith(dateStr) && ord.estado !== 'pendiente' && ord.estado !== 'cancelado')
            .reduce((sum, ord) => sum + (Number(ord.total) || 0), 0);

          history.push({ date: dateStr, label: dayLabel, total: dayTotal });
        }
        setSalesHistory(history);
      })
      .finally(() => setIsLoading(false));
  }, [daysFilter]);

  const formatUSD = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

  const maxDailySale = Math.max(...salesHistory.map((s) => s.total), 50);

  const renderStatusBadge = (estado?: string) => {
    switch (estado) {
      case 'entregado':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Entregado
          </span>
        );
      case 'confirmado':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Confirmado
          </span>
        );
      case 'preparando':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Preparando
          </span>
        );
      case 'enviado':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            Enviado
          </span>
        );
      case 'cancelado':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-500/15 text-stone-300 border border-stone-500/30">
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Banner / Control Panel Card */}
      <div className="rounded-2xl bg-[#0e0e12] border border-white/[0.08] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#c5a059] font-semibold block mb-1">
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
            onClick={() => onNavigateTab('products')}
            className="px-4 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-[#c5a059]/20"
          >
            <Plus size={15} />
            <span>Nuevo Producto</span>
          </button>
          <button
            onClick={() => onNavigateTab('orders')}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-stone-200 font-medium text-xs border border-white/[0.08] transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ShoppingCart size={15} className="text-[#c5a059]" />
            <span>Ver Pedidos</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Ventas de Hoy */}
        <div className="p-5 rounded-2xl bg-[#0e0e12] border border-white/[0.08] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">
                Hoy
              </span>
              <h4 className="text-xs font-medium text-stone-300 mt-0.5">Ventas de Hoy</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/20 flex items-center justify-center text-[#c5a059]">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-semibold text-white font-mono">{formatUSD(stats.ventas_hoy)}</div>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-stone-400">
            <span className="text-[#c5a059] font-medium">{stats.pedidos_hoy} pedidos hoy</span>
            <span className="text-stone-500 text-[11px]">En tiempo real</span>
          </div>
        </div>

        {/* Card 2: Ventas del Mes */}
        <div className="p-5 rounded-2xl bg-[#0e0e12] border border-white/[0.08] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">
                Mes Actual
              </span>
              <h4 className="text-xs font-medium text-stone-300 mt-0.5">Ventas del Mes</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-semibold text-white font-mono">{formatUSD(stats.ventas_mes)}</div>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-stone-400">
            <span className="text-purple-300 font-medium">Periodo activo</span>
            <span className="text-stone-500 text-[11px]">Últimos 30 días</span>
          </div>
        </div>

        {/* Card 3: Pedidos Pendientes */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="p-5 rounded-2xl bg-[#0e0e12] border border-white/[0.08] hover:border-amber-500/30 transition-all shadow-lg cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">
                Por Atender
              </span>
              <h4 className="text-xs font-medium text-stone-300 mt-0.5">Pedidos Pendientes</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <ShoppingCart size={18} />
            </div>
          </div>
          <div className="text-2xl font-semibold text-amber-300 font-mono">{stats.pedidos_pendientes}</div>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-stone-400">
            <span className="text-amber-400 flex items-center gap-1 font-medium">
              <span>Gestionar pedidos</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>

        {/* Card 4: Alertas de Inventario */}
        <div
          onClick={() => onNavigateTab('inventory')}
          className="p-5 rounded-2xl bg-[#0e0e12] border border-white/[0.08] hover:border-rose-500/30 transition-all shadow-lg cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">
                Stock
              </span>
              <h4 className="text-xs font-medium text-stone-300 mt-0.5">Alertas de Inventario</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-2xl font-semibold text-rose-400">{stats.productos_agotados}</span>
            <span className="text-xs text-rose-400/80">agotados</span>
            <span className="text-stone-600">•</span>
            <span className="text-base font-medium text-amber-400">{stats.productos_stock_bajo}</span>
            <span className="text-[11px] text-amber-400/80">bajo stock</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-stone-400">
            <span>De {stats.total_productos} productos</span>
            <span className="text-stone-500 text-[11px]">Ver inventario</span>
          </div>
        </div>
      </div>

      {/* Financial Performance Chart and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0e0e12] border border-white/[0.08] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/[0.06]">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#c5a059] block mb-0.5 font-semibold">
                  Rendimiento Financiero
                </span>
                <h3 className="text-base font-serif-luxury font-semibold text-white">
                  Ingresos de Ventas ({daysFilter} días)
                </h3>
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDaysFilter(d)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      daysFilter === d
                        ? 'bg-[#c5a059] text-black font-bold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="h-44 flex items-end gap-2 sm:gap-4 pt-6">
              {salesHistory.map((s, idx) => {
                const heightPercent = maxDailySale > 0 ? Math.max(10, Math.round((s.total / maxDailySale) * 100)) : 10;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] text-stone-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      ${s.total}
                    </span>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        s.total > 0
                          ? 'bg-gradient-to-t from-[#c5a059]/40 to-[#c5a059] shadow-md shadow-[#c5a059]/20'
                          : 'bg-white/5'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[9px] text-stone-400 font-mono truncate w-full text-center">
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="p-6 rounded-2xl bg-[#0e0e12] border border-white/[0.08] shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#c5a059] block mb-0.5 font-semibold">
              Accesos Rápidos
            </span>
            <h3 className="text-base font-serif-luxury font-semibold text-white mb-4 pb-4 border-b border-white/[0.06]">
              Operaciones Frecuentes
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => onNavigateTab('orders')}
                className="w-full p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <ShoppingCart size={15} />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-white">Revisar Pedidos</h5>
                    <p className="text-[10px] text-stone-400 font-light">Comprobantes y envíos</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-stone-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => onNavigateTab('products')}
                className="w-full p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#c5a059]/10 border border-[#c5a059]/20 flex items-center justify-center text-[#c5a059]">
                    <Package size={15} />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-white">Catálogo de Productos</h5>
                    <p className="text-[10px] text-stone-400 font-light">{products.length} productos en tienda</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-stone-500 group-hover:text-[#c5a059] group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => onNavigateTab('categories')}
                className="w-full p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-white">Categorías y Tallas</h5>
                    <p className="text-[10px] text-stone-400 font-light">Ordenar y configurar opciones</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-stone-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders List with Safe ID Stringification (prevents TypeError: o.id.slice) */}
      <div className="p-6 rounded-2xl bg-[#0e0e12] border border-white/[0.08] shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#c5a059] block mb-0.5 font-semibold">
              Actividad Reciente
            </span>
            <h3 className="text-base font-serif-luxury font-semibold text-white">
              Últimos Pedidos Recibidos
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs text-[#c5a059] hover:text-[#e4be6c] flex items-center gap-1 font-semibold cursor-pointer"
          >
            <span>Ver todos los pedidos</span>
            <ArrowRight size={12} />
          </button>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {orders.slice(0, 5).map((o) => {
            const safeId = String(o.id || '');
            const displayId = o.numero_orden || (safeId.length > 8 ? safeId.slice(0, 8) : safeId);

            return (
              <div
                key={safeId}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-stone-300 font-mono text-xs shrink-0">
                    #{displayId}
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-white">
                      {o.cliente_nombre || o.cliente?.nombre || 'Cliente'}
                    </h5>
                    <p className="text-[11px] text-stone-400">
                      {o.cliente_telefono || o.cliente?.telefono || 'Sin teléfono'} •{' '}
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('es-PA') : 'Fecha no registrada'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-sm font-bold text-white font-mono block">
                      {formatUSD(Number(o.total) || 0)}
                    </span>
                    <span className="text-[10px] text-stone-500 uppercase">{o.metodo_pago || 'yappy'}</span>
                  </div>
                  <div>{renderStatusBadge(o.estado)}</div>
                  <button
                    onClick={() => onNavigateTab('orders')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
                    title="Ver detalles"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {orders.length === 0 && !isLoading && (
            <p className="py-8 text-center text-xs text-stone-500">
              No hay pedidos registrados en este momento.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
