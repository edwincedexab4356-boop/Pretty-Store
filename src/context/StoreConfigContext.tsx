import React, { createContext, useContext, useState, useEffect } from 'react';
import { StoreConfig } from '../types/database';
import { DEFAULT_STORE_CONFIG, getLocalStoreConfig, saveLocalStoreConfig } from '../services/adminService';
import { getSupabaseClient } from '../lib/supabase';

interface StoreConfigContextType {
  config: StoreConfig;
  updateConfig: (newConfig: Partial<StoreConfig>) => Promise<{ syncedToSupabase: boolean; error?: string }>;
  resetToDefault: () => void;
  isLoading: boolean;
  isSyncedToSupabase: boolean;
}

const StoreConfigContext = createContext<StoreConfigContextType | undefined>(undefined);

export const StoreConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<StoreConfig>(() => {
    const local = getLocalStoreConfig();
    if (!local.nombre_tienda || local.nombre_tienda === 'AURA') {
      local.nombre_tienda = 'Pretty-Store';
    }
    if (!local.hero_video_url || local.hero_video_url.includes('mixkit') || local.hero_video_url.includes('2026-09-23')) {
      local.hero_video_url = '/videos/WhatsApp Video 2026-09-26 at 15.05.22.mp4';
    }
    if (!local.link_pago_tarjeta || local.link_pago_tarjeta.includes('gorras')) {
      local.link_pago_tarjeta = 'https://checkout.paguelofacil.com/W_F9464GL';
    }
    if (!local.yappy_numero || local.yappy_numero.includes('6890-1234') || local.yappy_numero.includes('6402-8245')) {
      local.yappy_numero = '6215-0251';
    }
    if (!local.banco_datos || local.banco_datos.includes('123456-7') || local.banco_datos.includes('Pretty-Store Inc.')) {
      local.banco_datos = 'Banco General - Cuenta Corriente #0472985946850 a nombre de JESUS ALEJANDRO CARDONA ESCOBAR';
    }
    if (!local.whatsapp || local.whatsapp.includes('6890-1234')) {
      local.whatsapp = '+507 6215-0251';
    }
    if (!local.telefono || local.telefono.includes('6890-1234')) {
      local.telefono = '+507 6215-0251';
    }
    return local;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncedToSupabase, setIsSyncedToSupabase] = useState(false);

  // Sync with Supabase on mount
  useEffect(() => {
    async function loadRemoteConfig() {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('configuracion')
          .select('*')
          .limit(1)
          .single();

        if (data && !error) {
          const merged: StoreConfig = {
            ...DEFAULT_STORE_CONFIG,
            ...data,
          };
          if (!merged.hero_video_url || merged.hero_video_url.includes('mixkit') || merged.hero_video_url.includes('2026-09-23')) {
            merged.hero_video_url = '/videos/WhatsApp Video 2026-09-26 at 15.05.22.mp4';
          }
          if (!merged.logo_url || merged.logo_url === '/images/logo/logo.png') {
            merged.logo_url = '/images/logo/logotipo.jpeg';
          }
          if (!merged.nombre_tienda || merged.nombre_tienda === 'AURA') {
            merged.nombre_tienda = 'Pretty-Store';
          }
          if (!merged.link_pago_tarjeta || merged.link_pago_tarjeta.includes('gorras')) {
            merged.link_pago_tarjeta = 'https://checkout.paguelofacil.com/W_F9464GL';
          }
          if (!merged.yappy_numero || merged.yappy_numero.includes('6890-1234') || merged.yappy_numero.includes('6402-8245')) {
            merged.yappy_numero = '6215-0251';
          }
          if (!merged.banco_datos || merged.banco_datos.includes('123456-7') || merged.banco_datos.includes('Pretty-Store Inc.')) {
            merged.banco_datos = 'Banco General - Cuenta Corriente #0472985946850 a nombre de JESUS ALEJANDRO CARDONA ESCOBAR';
          }
          if (!merged.whatsapp || merged.whatsapp.includes('6890-1234')) {
            merged.whatsapp = '+507 6215-0251';
          }
          if (!merged.telefono || merged.telefono.includes('6890-1234')) {
            merged.telefono = '+507 6215-0251';
          }
          merged.hero_poster_url = '';
          setConfig(merged);
          saveLocalStoreConfig(merged);
          setIsSyncedToSupabase(true);
        }
      } catch (e) {
        // Fallback to local storage
        setIsSyncedToSupabase(false);
      }
    }

    loadRemoteConfig();
  }, []);

  const updateConfig = async (newConfig: Partial<StoreConfig>): Promise<{ syncedToSupabase: boolean; error?: string }> => {
    setIsLoading(true);
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    saveLocalStoreConfig(updated);

    let synced = false;
    let syncError: string | undefined = undefined;

    try {
      const supabase = getSupabaseClient();
      
      // Payload sanitizado exactamente con las columnas esperadas en public.configuracion
      const remotePayload = {
        id: 1,
        nombre_tienda: updated.nombre_tienda || 'Pretty-Store',
        descripcion: updated.descripcion || '',
        logo_url: updated.logo_url || '/images/logo/logotipo.jpeg',
        hero_video_url: updated.hero_video_url || '',
        hero_poster_url: updated.hero_poster_url || '',
        catalog_video_url: updated.catalog_video_url || '',
        telefono: updated.telefono || '',
        whatsapp: updated.whatsapp || '',
        email: updated.email || '',
        direccion: updated.direccion || '',
        instagram: updated.instagram || '',
        tiktok: updated.tiktok || 'https://www.tiktok.com/@tienda_prettystore?_r=1&_t=ZS-9A8sgqEMvKS',
        facebook: updated.facebook || '',
        twitter: updated.twitter || '',
        yappy_numero: updated.yappy_numero || '',
        banco_datos: updated.banco_datos || '',
        pasarela_tarjeta: updated.pasarela_tarjeta || 'PagueloFacil',
        link_pago_tarjeta: updated.link_pago_tarjeta || '',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('configuracion')
        .upsert(remotePayload, { onConflict: 'id' });

      if (error) {
        console.warn('Aviso: no se pudo guardar en tabla public.configuracion de Supabase:', error.message);
        syncError = error.message;
        setIsSyncedToSupabase(false);
      } else {
        synced = true;
        setIsSyncedToSupabase(true);
      }
    } catch (e: any) {
      console.warn('Aviso conexión Supabase:', e);
      syncError = e?.message || 'Error de conexión';
      setIsSyncedToSupabase(false);
    } finally {
      setIsLoading(false);
    }

    return { syncedToSupabase: synced, error: syncError };
  };

  const resetToDefault = () => {
    setConfig(DEFAULT_STORE_CONFIG);
    saveLocalStoreConfig(DEFAULT_STORE_CONFIG);
  };

  return (
    <StoreConfigContext.Provider value={{ config, updateConfig, resetToDefault, isLoading, isSyncedToSupabase }}>
      {children}
    </StoreConfigContext.Provider>
  );
};

export function useStoreConfig() {
  const context = useContext(StoreConfigContext);
  if (!context) {
    throw new Error('useStoreConfig must be used within a StoreConfigProvider');
  }
  return context;
}
