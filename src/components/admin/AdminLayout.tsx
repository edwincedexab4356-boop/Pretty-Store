import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLogin } from './AdminLogin';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminTab } from '../../hooks/useAdminRoute';
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { CategoriesView } from './views/CategoriesView';
import { InventoryView } from './views/InventoryView';
import { OrdersView } from './views/OrdersView';
import { ClientsView } from './views/ClientsView';
import { SalesView } from './views/SalesView';
import { SettingsView } from './views/SettingsView';
import { SupabasePermissionsModal } from './SupabasePermissionsModal';
import { SupabaseQuotaModal } from './SupabaseQuotaModal';
import { Pedido } from '../../types/database';
import { RefreshCw } from 'lucide-react';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onNavigateTab: (tab: AdminTab) => void;
  onGoToStore: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onNavigateTab,
  onGoToStore,
}) => {
  const { session, isLoading, isStaff, role, profile, isActive, signOut, user } = useAdminAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Pedido | null>(null);
  const [isSqlFixOpen, setIsSqlFixOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [failedActionDescription, setFailedActionDescription] = useState<string | undefined>(undefined);

  const handleOpenSqlFix = (desc?: string) => {
    setFailedActionDescription(desc);
    setIsSqlFixOpen(true);
  };

  // If loading session or determining role
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-stone-300 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-stone-800 border-t-[#c5a059] animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-[#c5a059] font-medium">
            Pretty Store Atelier
          </p>
          <span className="text-[11px] text-stone-500 block">
            Cargando panel de administración...
          </span>
        </div>
      </div>
    );
  }

  // If not authenticated, show login page
  if (!session) {
    return <AdminLogin onBackToStore={onGoToStore} />;
  }

  // If authenticated but account is inactive or not staff
  if (!isStaff) {
    const isInactive = !isActive || profile?.activo === false;
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-stone-100 selection:bg-[#c5a059] selection:text-black">
        <div className="w-full max-w-md bg-[#0e0e12] border border-rose-500/20 rounded-2xl p-8 sm:p-10 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-rose-400 font-semibold block mb-1">
              Acceso Restringido (403)
            </span>
            <h1 className="text-xl font-serif-luxury font-semibold text-white">
              {isInactive ? 'Cuenta Desactivada' : 'Cuenta no autorizada'}
            </h1>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              {isInactive ? (
                <>
                  La cuenta <strong className="text-white">{user?.email}</strong> se encuentra actualmente desactivada. Contacta al administrador para reactivar tu acceso.
                </>
              ) : (
                <>
                  La cuenta <strong className="text-white">{user?.email}</strong> está registrada con rol de <strong className="text-amber-300 capitalize">{role || 'Cliente'}</strong>. Este panel es privado y está reservado para el personal administrativo y cajeros de Pretty Store.
                </>
              )}
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={onGoToStore}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-stone-200 text-black font-medium text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Volver a la Tienda
            </button>
            <button
              onClick={signOut}
              className="w-full py-2.5 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-stone-400 hover:text-white text-xs transition-colors cursor-pointer"
            >
              Cerrar Sesión e Ingresar con Otra Cuenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleSelectOrderFromDashboard = (order: Pedido) => {
    setSelectedOrderForDetail(order);
    onNavigateTab('pedidos');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-stone-100 flex flex-col selection:bg-[#c5a059] selection:text-black">
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <AdminSidebar
          currentTab={currentTab}
          onSelectTab={onNavigateTab}
          onGoToStore={onGoToStore}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenSqlFix={() => handleOpenSqlFix()}
        />

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          {/* Header */}
          <AdminHeader
            currentTab={currentTab}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onGoToStore={onGoToStore}
            onOpenSqlFix={() => handleOpenSqlFix()}
            onOpenQuotaModal={() => setIsQuotaModalOpen(true)}
          />

          {/* Content body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1720px] mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                onNavigate={onNavigateTab}
                onSelectOrder={handleSelectOrderFromDashboard}
                onOpenSqlFix={handleOpenSqlFix}
              />
            )}

            {currentTab === 'productos' && (
              <ProductsView
                onOpenSqlFix={handleOpenSqlFix}
                onOpenQuotaModal={() => setIsQuotaModalOpen(true)}
              />
            )}

            {currentTab === 'categorias' && <CategoriesView onOpenSqlFix={handleOpenSqlFix} />}

            {currentTab === 'inventario' && <InventoryView onOpenSqlFix={handleOpenSqlFix} />}

            {currentTab === 'pedidos' && (
              <OrdersView
                initialSelectedOrder={selectedOrderForDetail}
                onOpenSqlFix={handleOpenSqlFix}
              />
            )}

            {currentTab === 'clientes' && <ClientsView onOpenSqlFix={handleOpenSqlFix} />}

            {currentTab === 'ventas' && <SalesView onOpenSqlFix={handleOpenSqlFix} />}

            {currentTab === 'configuracion' && (
              <SettingsView onOpenQuotaModal={() => setIsQuotaModalOpen(true)} />
            )}
          </main>
        </div>
      </div>

      {/* Supabase Permissions Repair Modal */}
      <SupabasePermissionsModal
        isOpen={isSqlFixOpen}
        onClose={() => setIsSqlFixOpen(false)}
        failedActionDescription={failedActionDescription}
        onPermissionsFixed={handleRefresh}
      />

      {/* Supabase Storage and Limits Quota Modal */}
      <SupabaseQuotaModal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
      />
    </div>
  );
};
