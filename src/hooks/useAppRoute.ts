import { useState, useEffect, useCallback } from 'react';
import { AdminTab } from './useAdminRoute';

export type AppRouteType = 'store' | 'admin' | 'terms' | 'privacy';

export interface AppRoute {
  type: AppRouteType;
  adminTab: AdminTab;
}

export function parseAppRoute(): AppRoute {
  const path = (window.location.pathname || '').toLowerCase();
  const hash = (window.location.hash || '').toLowerCase();

  // Admin routes
  if (path === '/admin' || path.startsWith('/admin/') || hash === '#admin' || hash.startsWith('#admin')) {
    let sub = 'dashboard';
    if (path.startsWith('/admin')) {
      const parts = path.replace('/admin', '').split('/').filter(Boolean);
      if (parts.length > 0) sub = parts[0];
    } else if (hash.startsWith('#admin')) {
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
    return { type: 'admin', adminTab: matched };
  }

  // Terms & Conditions
  if (
    path === '/terminos-y-condiciones' ||
    path === '/terminos' ||
    hash === '#terminos-y-condiciones' ||
    hash === '#terminos'
  ) {
    return { type: 'terms', adminTab: 'dashboard' };
  }

  // Privacy Policy
  if (
    path === '/politica-de-privacidad' ||
    path === '/privacidad' ||
    hash === '#politica-de-privacidad' ||
    hash === '#privacidad'
  ) {
    return { type: 'privacy', adminTab: 'dashboard' };
  }

  return { type: 'store', adminTab: 'dashboard' };
}

export function useAppNavigation() {
  const [route, setRoute] = useState<AppRoute>(parseAppRoute);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseAppRoute());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigateToStore = useCallback(() => {
    try {
      window.history.pushState({}, '', '/');
    } catch {
      window.location.hash = '';
    }
    setRoute({ type: 'store', adminTab: 'dashboard' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToTerms = useCallback(() => {
    try {
      window.history.pushState({}, '', '/terminos-y-condiciones');
    } catch {
      window.location.hash = 'terminos-y-condiciones';
    }
    setRoute({ type: 'terms', adminTab: 'dashboard' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToPrivacy = useCallback(() => {
    try {
      window.history.pushState({}, '', '/politica-de-privacidad');
    } catch {
      window.location.hash = 'politica-de-privacidad';
    }
    setRoute({ type: 'privacy', adminTab: 'dashboard' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToAdmin = useCallback((tab: AdminTab = 'dashboard') => {
    const targetUrl = tab === 'dashboard' ? '/admin' : `/admin/${tab}`;
    try {
      window.history.pushState({}, '', targetUrl);
    } catch {
      window.location.hash = `admin/${tab}`;
    }
    setRoute({ type: 'admin', adminTab: tab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Admin shortcut Ctrl+Alt+A / Cmd+Alt+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        navigateToAdmin('dashboard');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateToAdmin]);

  return {
    route,
    navigateToStore,
    navigateToTerms,
    navigateToPrivacy,
    navigateToAdmin,
  };
}
