import React from 'react';
import {
  Menu,
  RefreshCw,
  Store,
  Database,
  Terminal,
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
    title: 'Dashboard',
    subtitle: 'Resumen general del rendimiento de tu tienda y pedidos recientes',
  },
  productos: {
    title: 'Productos',
    subtitle: 'Gestión de catálogo maestro, multimedia, precios y estado',
  },
  categorias: {
    title: 'Categorías',
    subtitle: 'Organización de colecciones y estructura visible en el catálogo',
  },
  inventario: {
    title: 'Inventario',
    subtitle: 'Control de existencias, rotación y alertas de reposición',
  },
  pedidos: {
    title: 'Pedidos',
    subtitle: 'Gestión de órdenes entrantes, logística y confirmación de pagos',
  },
  clientes: {
    title: 'Clientes',
    subtitle: 'Directorio de compradores, historial de pedidos y contactos',
  },
  ventas: {
    title: 'Ventas',
    subtitle: 'Métricas de ingresos, ticket promedio y métodos de pago',
  },
  configuracion: {
    title: 'Configuración',
    subtitle: 'Datos de la boutique, redes sociales y conexión a Supabase',
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
    <header className="sticky top-0 z-30 bg-[#0d0d11]/90 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile menu button & page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-stone-300 hover:text-white lg:hidden cursor-pointer"
          >
            <Menu size={18} />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-wide">
              {currentInfo.title}
            </h1>
            <p className="text-xs text-stone-400 hidden sm:block font-light">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Fix SQL Button if available */}
          {onOpenSqlFix && (
            <button
              onClick={onOpenSqlFix}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Consola de permisos Supabase"
            >
              <Terminal size={13} className="text-amber-400" />
              <span className="hidden sm:inline">Consola SQL</span>
            </button>
          )}

          {/* Supabase Status pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-stone-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Database size={12} className="text-[#c5a059]" />
            <span className="text-[11px] text-stone-400">Supabase:</span>
            <span className="text-emerald-400 font-medium text-[11px]">Conectado</span>
          </div>

          {/* Sync / Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-stone-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-[#c5a059]' : 'text-stone-400'} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          {/* Ver Tienda button */}
          <button
            onClick={onGoToStore}
            className="px-3 py-1.5 rounded-lg bg-[#c5a059]/15 hover:bg-[#c5a059]/25 border border-[#c5a059]/30 text-[#c5a059] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ir a la tienda pública"
          >
            <Store size={13} />
            <span className="hidden sm:inline">Ver Tienda</span>
          </button>
        </div>
      </div>
    </header>
  );
};
