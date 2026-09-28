import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Store,
  X,
  Shield,
  Terminal,
} from 'lucide-react';
import { AdminTab } from '../../hooks/useAdminRoute';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useStoreConfig } from '../../context/StoreConfigContext';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onGoToStore: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenSqlFix?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  onGoToStore,
  isOpenMobile,
  onCloseMobile,
  onOpenSqlFix,
}) => {
  const { user, signOut, role, isAdmin } = useAdminAuth();
  const { config } = useStoreConfig();

  const allNavItems: { id: AdminTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'productos', label: 'Productos', icon: <Package size={18} /> },
    { id: 'categorias', label: 'Categorías', icon: <Layers size={18} />, adminOnly: true },
    { id: 'inventario', label: 'Inventario', icon: <Boxes size={18} /> },
    { id: 'pedidos', label: 'Pedidos', icon: <ShoppingBag size={18} /> },
    { id: 'clientes', label: 'Clientes', icon: <Users size={18} /> },
    { id: 'ventas', label: 'Ventas', icon: <TrendingUp size={18} /> },
    { id: 'configuracion', label: 'Configuración', icon: <Settings size={18} />, adminOnly: true },
  ];

  const navItems = allNavItems.filter((item) => (item.adminOnly ? isAdmin : true));

  const handleSelect = (tab: AdminTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#0d0d11] border-r border-white/[0.08] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-black border border-white/15 flex items-center justify-center shrink-0">
              <img
                src={config.logo_url || '/images/logo/logotipo.jpeg'}
                alt={config.nombre_tienda || 'Logo'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.endsWith('/images/logo/logo.png')) {
                    target.src = '/images/logo/logo.png';
                  }
                }}
              />
            </div>

            <div className="overflow-hidden">
              <h2 className="text-sm font-serif-luxury font-semibold text-white tracking-[0.12em] uppercase truncate">
                {config.nombre_tienda || 'Pretty-Store'}
              </h2>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#c5a059] block mt-0.5">
                Administración
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/5 transition-colors lg:hidden cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 pt-1 text-[10px] uppercase tracking-[0.25em] text-stone-500 font-medium">
            Gestión
          </div>

          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#c5a059]/15 text-[#c5a059] border-l-2 border-[#c5a059] font-semibold'
                    : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={isActive ? 'text-[#c5a059]' : 'text-stone-400'}>
                  {item.icon}
                </span>
                <span className="tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User profile & actions */}
        <div className="p-4 border-t border-white/[0.08] bg-[#09090c] space-y-2">
          {/* User info */}
          <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Shield size={12} className={isAdmin ? 'text-[#c5a059]' : 'text-blue-400'} />
              <span className={`text-[10px] uppercase tracking-wider font-medium ${isAdmin ? 'text-[#c5a059]' : 'text-blue-400'}`}>
                {isAdmin ? 'Administrador' : role === 'cajero' ? 'Cajero' : 'Personal'}
              </span>
            </div>
            <p className="text-xs text-stone-300 truncate">
              {user?.email || 'usuario@pretty-store.com'}
            </p>
          </div>

          {/* Go to store button */}
          <button
            onClick={onGoToStore}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-stone-300 hover:text-white hover:bg-white/5 border border-white/[0.08] transition-colors cursor-pointer"
          >
            <Store size={14} className="text-[#c5a059]" />
            <span>Ver Tienda Pública</span>
          </button>

          {/* SQL permissions fix button */}
          {onOpenSqlFix && (
            <button
              onClick={() => {
                onOpenSqlFix();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-amber-300/90 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/20 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-amber-400" />
                <span>Consola SQL (RLS)</span>
              </div>
            </button>
          )}

          {/* Logout button */}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};
