import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConfiguracionTienda } from '../types/database';
import { supabase } from '../lib/supabase';

const DEFAULT_VIDEO = '/videos/WhatsApp Video 2026-09-26 at 15.05.22.mp4';

const DEFAULT_CONFIG: ConfiguracionTienda = {
  nombre_tienda: 'Pretty Store',
  descripcion: 'Boutique exclusiva de alta relojería, perfumería selecta y accesorios de distinción.',
  logo_url: '/images/logo/logotipo.jpeg',
  hero_video_url: DEFAULT_VIDEO,
  hero_poster_url: '',
  catalog_video_url: '',
  telefono: '+507 6215-0251',
  whatsapp: '+507 6215-0251',
  email: 'contacto@prettystore.store',
  direccion: 'https://maps.app.goo.gl/PxA3suMXNZxuFF5X7',
  instagram: 'https://instagram.com/pretty_store_pty',
  tiktok: 'https://www.tiktok.com/@tienda_prettystore?_r=1&_t=ZS-9A8sgqEMvKS',
  facebook: '',
  twitter: '',
  yappy_numero: '6215-0251',
  banco_datos: 'Banco General - Cuenta Corriente #03-01-01-123456-7 a nombre de Pretty Store Inc.',
  badge_garantia_titulo: 'Pieza Exclusiva Pretty Store',
  badge_garantia_subtitulo: 'Acabados de primera calidad y empaque de colección.',
};

interface StoreConfigContextType {
  config: ConfiguracionTienda;
  updateConfig: (newConfig: Partial<ConfiguracionTienda>) => Promise<void>;
  isLoading: boolean;
  reloadConfig: () => Promise<void>;
}

const StoreConfigContext = createContext<StoreConfigContextType>({
  config: DEFAULT_CONFIG,
  updateConfig: async () => {},
  isLoading: true,
  reloadConfig: async () => {},
});

export const StoreConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ConfiguracionTienda>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase.from('configuracion').select('*').limit(1).single();
      if (!error && data) {
        const merged = { ...DEFAULT_CONFIG, ...data };
        if (
          !merged.hero_video_url ||
          merged.hero_video_url.includes('mixkit') ||
          merged.hero_video_url.includes('2026-09-23')
        ) {
          merged.hero_video_url = DEFAULT_VIDEO;
        }
        if (!merged.logo_url || merged.logo_url === '/images/logo/logo.png') {
          merged.logo_url = '/images/logo/logotipo.jpeg';
        }
        if (!merged.nombre_tienda || merged.nombre_tienda === 'AURA') {
          merged.nombre_tienda = 'Pretty Store';
        }
        setConfig(merged);
      }
    } catch {
      // Use defaults
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const updateConfig = async (newConfig: Partial<ConfiguracionTienda>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    try {
      await supabase.from('configuracion').update(newConfig).eq('id', (config as any).id || 1);
    } catch (e) {
      console.warn('Error updating configuracion:', e);
    }
  };

  const reloadConfig = async () => {
    await fetchConfig();
  };

  return (
    <StoreConfigContext.Provider value={{ config, updateConfig, isLoading, reloadConfig }}>
      {children}
    </StoreConfigContext.Provider>
  );
};

export const useStoreConfig = () => useContext(StoreConfigContext);
