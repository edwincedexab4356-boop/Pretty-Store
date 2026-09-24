import React from 'react';
import {
  Menu,
  RefreshCw,
  Store,
  Database,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { AdminTab } from '../../hooks/useAdminRoute';

interface AdminHeaderProps {
  currentTab: AdminTab;
  onOpenMobileMenu: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onGoToStore: () => void;
  onOpenSqlFix?: () => void;
}

const TAB_TITLES: Record<AdminTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Panel General',
    subtitle: 'Métricas en tiempo real, pedidos y rendimiento de la tienda',
  },
  productos: {
    title: 'Catálogo de Productos',
    subtitle: 'Administra productos, precios, fotos y disponibilidad',
  },
  categorias: {
    title: 'Categorías',
    subtitle: 'Organiza las categorías visibles en el menú y filtros de la tienda',
  },
  inventario: {
    title: 'Control de Inventario',
    subtitle: 'Supervisa existencias, umbrales mínimos y alertas de stock',
  },
  pedidos: {
    title: 'Gestión de Pedidos',
    subtitle: 'Revisa órdenes recibidas, detalles de clientes y cambia estados',
  },
  clientes: {
    title: 'Directorio de Clientes',
    subtitle: 'Historial de compras, teléfonos y datos de entrega',
  },
  ventas: {
    title: 'Reporte de Ventas',
    subtitle: 'Ingresos por periodo, métodos de pago y transacciones',
  },
  configuracion: {
    title: 'Configuración de la Tienda',
    subtitle: 'Identidad, redes, video principal del Hero y permisos de Supabase',
  },
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onRefresh,
  isRefreshing,
  onGoToStore,
  onOpenSqlFix,
}) => {
  const currentInfo = TAB_TITLES[currentTab] || TAB_TITLES.dashboard;

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white lg:hidden cursor-pointer"
          >
            <Menu size={18} />
          </button>

          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white font-serif-luxury tracking-wide">
              {currentInfo.title}
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Fix SQL Button */}
          {onOpenSqlFix && (
            <button
              onClick={onOpenSqlFix}
              className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Script de solución de permisos Supabase (Error 42501)"
            >
              <ShieldAlert size={14} />
              <span className="hidden sm:inline">Permisos SQL</span>
            </button>
          )}

          {/* Supabase Status pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Database size={11} />
            <span className="font-mono text-[11px]">xypdbyccffztaxnvgvrl</span>
          </div>

          {/* Sync Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Recargar datos de Supabase"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-amber-400' : ''} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>

          {/* Visit Store */}
          <button
            onClick={onGoToStore}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/10 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Store size={14} />
            <span className="hidden sm:inline">Ver Tienda</span>
            <ExternalLink size={12} className="opacity-70" />
          </button>
        </div>
      </div>
    </header>
  );
};
