import React, { createContext, useContext, useState, useEffect } from 'react';
import { StoreConfig } from '../types/database';
import { DEFAULT_STORE_CONFIG, getLocalStoreConfig, saveLocalStoreConfig } from '../services/adminService';
import { getSupabaseClient } from '../lib/supabase';

interface StoreConfigContextType {
  config: StoreConfig;
  updateConfig: (newConfig: Partial<StoreConfig>) => Promise<void>;
  resetToDefault: () => void;
  isLoading: boolean;
}

const StoreConfigContext = createContext<StoreConfigContextType | undefined>(undefined);

export const StoreConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<StoreConfig>(() => getLocalStoreConfig());
  const [isLoading, setIsLoading] = useState(false);

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
          setConfig(merged);
          saveLocalStoreConfig(merged);
        }
      } catch (e) {
        // Fallback to local storage
      }
    }

    loadRemoteConfig();
  }, []);

  const updateConfig = async (newConfig: Partial<StoreConfig>) => {
    setIsLoading(true);
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    saveLocalStoreConfig(updated);

    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('configuracion')
        .upsert({
          id: 1,
          ...updated,
          updated_at: new Date().toISOString(),
        });
    } catch (e) {
      // Configuracion table might not exist; local persistence keeps it active
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefault = () => {
    setConfig(DEFAULT_STORE_CONFIG);
    saveLocalStoreConfig(DEFAULT_STORE_CONFIG);
  };

  return (
    <StoreConfigContext.Provider value={{ config, updateConfig, resetToDefault, isLoading }}>
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
