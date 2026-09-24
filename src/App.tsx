import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CartProvider } from './context/CartContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { StoreConfigProvider, useStoreConfig } from './context/StoreConfigContext';
import { useAdminNavigation } from './hooks/useAdminRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import { Header } from './components/common/Header';
import { Hero } from './components/hero/Hero';
import { CategoryFilter } from './components/catalog/CategoryFilter';
import { ProductGrid } from './components/catalog/ProductGrid';
import { ProductGridSkeleton } from './components/catalog/ProductGridSkeleton';
import { FeaturesSection } from './components/common/FeaturesSection';
import { Footer } from './components/common/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutDemoModal } from './components/checkout/CheckoutDemoModal';
import { ToastNotification } from './components/common/ToastNotification';
import { fetchCatalogData, CatalogError } from './services/catalogService';
import { getSupabaseConfig, getSupabaseClient } from './lib/supabase';
import { Categoria, Producto } from './types/database';

export type LoadStatus = 'loading' | 'unconfigured' | 'error' | 'empty' | 'success';

interface StoreAppProps {
  onOpenAdmin: () => void;
}

function StoreApp({ onOpenAdmin }: StoreAppProps) {
  const { config } = useStoreConfig();
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [catalogError, setCatalogError] = useState<CatalogError | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  // Load real catalog data from Supabase
  const loadData = useCallback(async () => {
    setStatus('loading');
    setCatalogError(null);

    try {
      const result = await fetchCatalogData();

      if (!result.isConfigured) {
        setStatus('unconfigured');
        setCategories([]);
        setProducts([]);
        return;
      }

      setCategories(result.categories);
      setProducts(result.products);

      if (result.products.length === 0) {
        setStatus('empty');
      } else {
        setStatus('success');
      }
    } catch (err: unknown) {
      console.warn('[Supabase Query Error]', err);
      const castError = err as CatalogError;
      setCatalogError({
        failedQuery: castError.failedQuery || 'connection',
        message: castError.message || 'Error inesperado al cargar el catálogo.',
        details: castError.details,
        hint: castError.hint,
        code: castError.code,
      });
      setCategories([]);
      setProducts([]);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    loadData();

    // Supabase Realtime subscriptions: Listen to products and categories updates
    try {
      const supabase = getSupabaseClient();
      const channel = supabase
        .channel('store-realtime-catalog')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'productos' },
          () => {
            loadData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'categorias' },
          () => {
            loadData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'inventario' },
          () => {
            loadData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      // Realtime channel creation fallback
    }
  }, [loadData]);

  // Compute products count per category (only active products)
  const productCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.activo) {
        counts[p.categoria_id] = (counts[p.categoria_id] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const totalActiveProducts = useMemo(() => {
    return products.filter((p) => p.activo).length;
  }, [products]);

  const handleExploreClick = () => {
    const el = document.getElementById('catalogo');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCategoriesClick = () => {
    const el = document.getElementById('categorias');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Clean public Header */}
      <Header
        onNavigateSection={handleNavigateSection}
        onOpenAdmin={onOpenAdmin}
      />

      {/* Hero with dynamic user video */}
      <div id="hero">
        <Hero
          videoUrl={config.hero_video_url}
          onExploreClick={handleExploreClick}
          onCategoriesClick={handleCategoriesClick}
        />
      </div>

      {/* Categories Filter Strip */}
      {status !== 'unconfigured' && status !== 'error' && (
        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(id) => {
            setSelectedCategoryId(id);
            const el = document.getElementById('catalogo');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          productCountMap={productCountMap}
          totalProductsCount={totalActiveProducts}
        />
      )}

      {/* Main Catalog Section */}
      <main className="flex-1">
        {status === 'loading' ? (
          <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProductGridSkeleton />
          </section>
        ) : status === 'error' ? (
          <section className="max-w-xl mx-auto py-16 px-4 text-center">
            <p className="text-slate-400 text-sm mb-4">No se pudo cargar el catálogo en este momento.</p>
            <button
              onClick={loadData}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Reintentar
            </button>
          </section>
        ) : (
          <ProductGrid
            products={products}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        )}

        {/* Benefits & Value Proposition */}
        <FeaturesSection />
      </main>

      {/* Clean Footer */}
      <Footer
        categories={categories}
        onSelectCategory={setSelectedCategoryId}
        onOpenAdmin={onOpenAdmin}
      />

      {/* Interactive Cart Slide-over Drawer */}
      <CartDrawer />

      {/* Interactive Checkout Demo Modal */}
      <CheckoutDemoModal />

      {/* Floating Add to Cart Toast Notification */}
      <ToastNotification />
    </div>
  );
}

function MainRoot() {
  const { isAdmin, currentTab, navigateToAdmin, navigateToStore } = useAdminNavigation();

  if (isAdmin) {
    return (
      <AdminLayout
        currentTab={currentTab}
        onNavigateTab={navigateToAdmin}
        onGoToStore={navigateToStore}
      />
    );
  }

  return <StoreApp onOpenAdmin={() => navigateToAdmin('dashboard')} />;
}

export default function App() {
  return (
    <AdminAuthProvider>
      <StoreConfigProvider>
        <CartProvider>
          <MainRoot />
        </CartProvider>
      </StoreConfigProvider>
    </AdminAuthProvider>
  );
}
