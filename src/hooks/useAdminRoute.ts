import { useState, useEffect, useCallback } from 'react';

export type AdminTab =
  | 'dashboard'
  | 'productos'
  | 'categorias'
  | 'inventario'
  | 'pedidos'
  | 'clientes'
  | 'ventas'
  | 'configuracion';

export function parseAdminRoute(): { isAdmin: boolean; tab: AdminTab } {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  const isPathAdmin = path === '/admin' || path.startsWith('/admin/');
  const isHashAdmin = hash === '#admin' || hash.startsWith('#admin');

  if (!isPathAdmin && !isHashAdmin) {
    return { isAdmin: false, tab: 'dashboard' };
  }

  let sub = 'dashboard';
  if (isPathAdmin) {
    const parts = path.replace('/admin', '').split('/').filter(Boolean);
    if (parts.length > 0) sub = parts[0];
  } else if (isHashAdmin) {
    const parts = hash.replace('#admin', '').replace(/^\//, '').split('/').filter(Boolean);
    if (parts.length > 0) sub = parts[0];
  }

  const validTabs: AdminTab[] = [
    'dashboard',
    'productos',
    'categorias',
    'inventario',
    'pedidos',
    'clientes',
    'ventas',
    'configuracion',
  ];

  const matched = validTabs.find((t) => t === sub) || 'dashboard';
  return { isAdmin: true, tab: matched };
}

export function useAdminNavigation() {
  const [route, setRoute] = useState(parseAdminRoute);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseAdminRoute());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigateToAdmin = useCallback((tab: AdminTab = 'dashboard') => {
    const targetUrl = tab === 'dashboard' ? '/admin' : `/admin/${tab}`;
    try {
      window.history.pushState({}, '', targetUrl);
    } catch (e) {
      window.location.hash = `admin/${tab}`;
    }
    setRoute({ isAdmin: true, tab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToStore = useCallback(() => {
    try {
      window.history.pushState({}, '', '/');
    } catch (e) {
      window.location.hash = '';
    }
    setRoute({ isAdmin: false, tab: 'dashboard' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return {
    isAdmin: route.isAdmin,
    currentTab: route.tab,
    navigateToAdmin,
    navigateToStore,
  };
}
