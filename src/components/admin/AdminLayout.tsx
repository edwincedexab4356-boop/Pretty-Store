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
  const { session, isLoading } = useAdminAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Pedido | null>(null);
  const [isSqlFixOpen, setIsSqlFixOpen] = useState(false);
  const [failedActionDescription, setFailedActionDescription] = useState<string | undefined>(undefined);

  const handleOpenSqlFix = (desc?: string) => {
    setFailedActionDescription(desc);
    setIsSqlFixOpen(true);
  };

  // If loading session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-stone-300 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-stone-800 border-t-[#c5a059] animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-[#c5a059] font-medium">
            Pretty-Store Atelier
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

            {currentTab === 'productos' && <ProductsView onOpenSqlFix={handleOpenSqlFix} />}

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

            {currentTab === 'configuracion' && <SettingsView />}
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
    </div>
  );
};
