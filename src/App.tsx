import React, { useState, useEffect, useMemo } from 'react';
import { StoreConfigProvider, useStoreConfig } from './context/StoreConfigContext';
import { CartProvider, useCart } from './context/CartContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { Header } from './components/common/Header';
import { Hero } from './components/hero/Hero';
import { CategorySection } from './components/catalog/CategorySection';
import { ProductGrid } from './components/catalog/ProductGrid';
import { BenefitsBar } from './components/common/BenefitsBar';
import { ProductDetailModal } from './components/catalog/ProductDetailModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutDemoModal } from './components/checkout/CheckoutDemoModal';
import { Footer } from './components/common/Footer';
import { LegalModal } from './components/common/LegalModal';
import { TermsPage } from './components/legal/TermsPage';
import { PrivacyPage } from './components/legal/PrivacyPage';
import { ToastNotification } from './components/common/ToastNotification';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminSidebar, AdminTab } from './components/admin/AdminSidebar';
import { AdminHeader } from './components/admin/AdminHeader';
import { DashboardView } from './components/admin/views/DashboardView';
import { OrdersView } from './components/admin/views/OrdersView';
import { ProductsView } from './components/admin/views/ProductsView';
import { CategoriesView } from './components/admin/views/CategoriesView';
import { ClientsView } from './components/admin/views/ClientsView';
import { InventoryView } from './components/admin/views/InventoryView';
import { SalesView } from './components/admin/views/SalesView';
import { SettingsView } from './components/admin/views/SettingsView';
import { NovedadesView } from './components/admin/views/NovedadesView';
import { NovedadesSection } from './components/catalog/NovedadesSection';
import { getActiveCategories, getActiveProducts } from './services/catalogService';
import { notifyNovedadesChanged } from './services/adminService';
import { Categoria, Producto } from './types/database';

function MainAppContent() {
  const { isCartOpen, setIsCartOpen, notification } = useCart();
  const { isAuthenticated, logout } = useAdminAuth();
  const { config } = useStoreConfig();

  // Navigation states
  const [currentView, setCurrentView] = useState<'store' | 'admin' | 'terms' | 'privacy'>('store');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Legal modal tab
  const [legalModalTab, setLegalModalTab] = useState<'terminos' | 'privacidad' | null>(null);

  // Catalog state
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  // Modals
  const [quickViewProduct, setQuickViewProduct] = useState<Producto | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Keep page title synced and refresh public novedades
  useEffect(() => {
    if (currentView === 'store') {
      document.title = 'prettystroe.store';
      notifyNovedadesChanged();
    }
  }, [currentView]);

  // Fetch catalog data
  const loadCatalog = async () => {
    setIsLoadingCatalog(true);
    try {
      const [cats, prods] = await Promise.all([
        getActiveCategories(),
        getActiveProducts(),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (e) {
      console.warn('Error loading catalog:', e);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const productCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      if (p.activo && p.categoria_id) {
        map[p.categoria_id] = (map[p.categoria_id] || 0) + 1;
      }
    });
    return map;
  }, [products]);

  // Las categorías con productos van primero; las categorías vacías ("Próximamente") van a lo último
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const countA = productCountMap[a.id] || 0;
      const countB = productCountMap[b.id] || 0;
      if (countA > 0 && countB === 0) return -1;
      if (countA === 0 && countB > 0) return 1;
      return 0;
    });
  }, [categories, productCountMap]);

  // Admin Screen
  if (currentView === 'admin') {
    if (!isAuthenticated) {
      return (
        <AdminLogin
          onBackToStore={() => {
            setCurrentView('store');
          }}
        />
      );
    }

    return (
      <div className="flex h-screen bg-[#070608] text-stone-100 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/80 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <AdminSidebar
            currentTab={adminTab}
            onSelectTab={(tab) => {
              setAdminTab(tab);
              setSidebarOpen(false);
            }}
            onLogout={() => {
              logout();
              setCurrentView('store');
            }}
            onGoToStore={() => setCurrentView('store')}
          />
        </div>

        {/* Main Admin View Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminHeader
            currentTab={adminTab}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onGoToStore={() => setCurrentView('store')}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {adminTab === 'dashboard' && <DashboardView onNavigateTab={(tab) => setAdminTab(tab)} />}
              {adminTab === 'orders' && <OrdersView />}
              {adminTab === 'products' && <ProductsView />}
              {adminTab === 'categories' && <CategoriesView />}
              {adminTab === 'clients' && <ClientsView />}
              {adminTab === 'inventory' && <InventoryView />}
              {adminTab === 'sales' && <SalesView />}
              {adminTab === 'novedades' && <NovedadesView />}
              {adminTab === 'settings' && <SettingsView />}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Full Page Terms
  if (currentView === 'terms') {
    return <TermsPage onBack={() => setCurrentView('store')} />;
  }

  // Full Page Privacy
  if (currentView === 'privacy') {
    return <PrivacyPage onBack={() => setCurrentView('store')} />;
  }

  // Main Storefront
  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f6] flex flex-col selection:bg-[#fbbf24] selection:text-black font-sans-clean">
      {/* Header */}
      <Header
        categories={sortedCategories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(id) => {
          setSelectedCategoryId(id);
        }}
        onOpenAdmin={() => setCurrentView('admin')}
      />

      {/* Hero Section */}
      <div id="hero">
        <Hero
          videoUrl={config.hero_video_url}
          onExploreClick={() => {
            const el = document.getElementById('catalogo');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onCategoriesClick={() => {
            const el = document.getElementById('categorias');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </div>

      {/* Apartado de Novedades (Bucle Infinito Horizontal) */}
      <div id="novedades">
        <NovedadesSection
          onExploreCatalog={() => {
            const el = document.getElementById('catalogo');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </div>

      {/* Collections / Category Showcase Bar */}
      <CategorySection
        categories={sortedCategories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(id) => {
          setSelectedCategoryId(id);
          const el = document.getElementById('catalogo');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        productCountMap={productCountMap}
        totalProductsCount={products.filter((p) => p.activo).length}
      />

      {/* Main Catalog & Guarantees */}
      <main className="flex-1">
        <ProductGrid
          products={products}
          categories={sortedCategories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onQuickView={(p) => setQuickViewProduct(p)}
          isLoading={isLoadingCatalog}
        />

        <BenefitsBar />
      </main>

      {/* Footer */}
      <Footer
        categories={sortedCategories}
        onSelectCategory={(id) => {
          setSelectedCategoryId(id);
          const el = document.getElementById('catalogo');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenAdmin={() => setCurrentView('admin')}
        onOpenTerms={() => setCurrentView('terms')}
        onOpenPrivacy={() => setCurrentView('privacy')}
        onOpenLegal={(tab) => setLegalModalTab(tab)}
      />

      {/* Modals & Drawers */}
      {quickViewProduct && (
        <ProductDetailModal
          product={quickViewProduct}
          categories={sortedCategories}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

      <CartDrawer
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {isCheckoutOpen && (
        <CheckoutDemoModal onClose={() => setIsCheckoutOpen(false)} />
      )}

      {legalModalTab && (
        <LegalModal
          initialTab={legalModalTab}
          onClose={() => setLegalModalTab(null)}
        />
      )}

      {/* Cart Toast Notification */}
      <ToastNotification
        notification={notification}
        onOpenCart={() => setIsCartOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <StoreConfigProvider>
      <AdminAuthProvider>
        <CartProvider>
          <MainAppContent />
        </CartProvider>
      </AdminAuthProvider>
    </StoreConfigProvider>
  );
}
