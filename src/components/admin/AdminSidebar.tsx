import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Users,
  Boxes,
  TrendingUp,
  Settings,
  LogOut,
  Store,
  Shield,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useStoreConfig } from '../../context/StoreConfigContext';

export type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'categories'
  | 'clients'
  | 'inventory'
  | 'sales'
  | 'settings';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogout: () => void;
  onGoToStore: () => void;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  onGoToStore,
  onCloseMobile,
}) => {
  const { user } = useAdminAuth();
  const { config } = useStoreConfig();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'categories', label: 'Categorías', icon: Layers },
    { id: 'inventory', label: 'Inventario', icon: Boxes },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'sales', label: 'Ventas', icon: TrendingUp },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0d0d11] border-r border-white/[0.08] flex flex-col justify-between h-full select-none">
      {/* Top Header */}
      <div>
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-black border border-white/15 flex items-center justify-center shrink-0 shadow-md">
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
                {config.nombre_tienda || 'Pretty Store'}
              </h2>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#c5a059] block mt-0.5 font-medium">
                Administración
              </span>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/5 transition-colors lg:hidden cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="py-4 px-3 space-y-1">
          <div className="px-3 pb-2 pt-1 text-[10px] uppercase tracking-[0.25em] text-stone-500 font-medium">
            Gestión
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id as AdminTab);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#c5a059]/15 text-[#c5a059] border-l-2 border-[#c5a059] font-semibold'
                    : 'text-stone-400 hover:text-white hover:bg-white/5 font-medium'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[#c5a059]' : 'text-stone-400'} />
                <span className="tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile & Actions */}
      <div className="p-4 border-t border-white/[0.08] bg-[#09090c] space-y-2">
        <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Shield size={12} className="text-[#c5a059]" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#c5a059]">
              Administrador
            </span>
          </div>
          <p className="text-xs text-stone-300 truncate font-mono">
            {user?.email || 'admin@prettystore.store'}
          </p>
        </div>

        <button
          onClick={onGoToStore}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-stone-300 hover:text-white hover:bg-white/5 border border-white/[0.08] transition-colors cursor-pointer"
        >
          <Store size={14} className="text-[#c5a059]" />
          <span>Ver Tienda Pública</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer font-medium"
        >
          <LogOut size={14} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
