import React from 'react';
import { Menu, Store, RefreshCw, Database } from 'lucide-react';
import { AdminTab } from './AdminSidebar';

interface AdminHeaderProps {
  currentTab: AdminTab;
  onToggleSidebar?: () => void;
  onGoToStore: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const TAB_DESCRIPTIONS: Record<AdminTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Resumen general del rendimiento de tu tienda y pedidos recientes',
  },
  products: {
    title: 'Productos',
    subtitle: 'Gestión de catálogo maestro, multimedia, precios y estado',
  },
  categories: {
    title: 'Categorías',
    subtitle: 'Organización de colecciones y estructura visible en el catálogo',
  },
  novedades: {
    title: 'Novedades & Banners',
    subtitle: 'Gestión del carrusel infinito de la tienda, activación, orden y subida de imágenes a Supabase',
  },
  inventory: {
    title: 'Inventario',
    subtitle: 'Control de existencias, rotación y alertas de reposición',
  },
  orders: {
    title: 'Pedidos',
    subtitle: 'Gestión de órdenes entrantes, logística y confirmación de pagos',
  },
  clients: {
    title: 'Clientes',
    subtitle: 'Directorio de compradores, historial de pedidos y contactos',
  },
  sales: {
    title: 'Ventas',
    subtitle: 'Métricas de ingresos, ticket promedio y métodos de pago',
  },
  settings: {
    title: 'Configuración',
    subtitle: 'Datos de la boutique, redes sociales y conexión a Supabase',
  },
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentTab,
  onToggleSidebar,
  onGoToStore,
  onRefresh,
  isRefreshing = false,
}) => {
  const current = TAB_DESCRIPTIONS[currentTab] || TAB_DESCRIPTIONS.dashboard;

  return (
    <header className="sticky top-0 z-30 bg-[#0d0d11]/90 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Title and Subtitle */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-stone-300 hover:text-white lg:hidden cursor-pointer"
              aria-label="Abrir menú"
            >
              <Menu size={18} />
            </button>
          )}
          <div>
            <h1 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-wide">
              {current.title}
            </h1>
            <p className="text-xs text-stone-400 hidden sm:block font-light">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Right status badges and actions */}
        <div className="flex items-center gap-2.5">
          {/* Supabase status badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-stone-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Database size={12} className="text-[#c5a059]" />
            <span className="text-[11px] text-stone-400">Supabase:</span>
            <span className="text-emerald-400 font-medium text-[11px]">Conectado</span>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-stone-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Actualizar datos"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-[#c5a059]' : 'text-stone-400'} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          )}

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
