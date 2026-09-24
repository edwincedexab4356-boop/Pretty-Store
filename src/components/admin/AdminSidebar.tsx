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
  ShieldCheck,
  ShieldAlert,
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
  const { user, signOut } = useAdminAuth();
  const { config } = useStoreConfig();

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'productos', label: 'Productos', icon: <Package size={18} /> },
    { id: 'categorias', label: 'Categorías', icon: <Layers size={18} /> },
    { id: 'inventario', label: 'Inventario', icon: <Boxes size={18} /> },
    { id: 'pedidos', label: 'Pedidos', icon: <ShoppingBag size={18} /> },
    { id: 'clientes', label: 'Clientes', icon: <Users size={18} /> },
    { id: 'ventas', label: 'Ventas', icon: <TrendingUp size={18} /> },
    { id: 'configuracion', label: 'Configuración', icon: <Settings size={18} /> },
  ];

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
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold text-lg">
              É
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide truncate max-w-[130px]">
                {config.nombre_tienda || 'Élégance'}
              </h2>
              <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">
                Panel Admin
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navegación
          </div>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className={isActive ? 'text-slate-950' : 'text-amber-400/80'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User profile & actions */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          {/* User info */}
          <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Admin Autenticado
              </span>
            </div>
            <p className="text-xs text-white truncate font-medium">
              {user?.email || 'Administrador'}
            </p>
          </div>

          {/* Go to store button */}
          <button
            onClick={onGoToStore}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Store size={15} />
            <span>Ver Tienda Pública</span>
          </button>

          {/* SQL permissions fix button */}
          {onOpenSqlFix && (
            <button
              onClick={() => {
                onOpenSqlFix();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 transition-colors cursor-pointer"
            >
              <ShieldAlert size={15} className="text-amber-400" />
              <span>Permisos SQL (RLS)</span>
            </button>
          )}

          {/* Logout button */}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut size={15} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};
