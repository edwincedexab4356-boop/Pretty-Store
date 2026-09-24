import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default project configuration provided by user
export const DEFAULT_SUPABASE_URL = 'https://xypdbyccffztaxnvgvrl.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cGRieWNjZmZ6dGF4bnZndnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMDI2NDAsImV4cCI6MjEwNTc3ODY0MH0.LJmXAjLv7pWQAHK_dLSaf4ZvyNqFiBAGyemctX-JW2s';

// Environment variables
const envUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Local storage fallback for quick configuration/testing in development
const getStoredUrl = (): string => {
  try {
    return localStorage.getItem('AURA_SUPABASE_URL') || '';
  } catch {
    return '';
  }
};

const getStoredKey = (): string => {
  try {
    return localStorage.getItem('AURA_SUPABASE_ANON_KEY') || '';
  } catch {
    return '';
  }
};

export const getSupabaseConfig = () => {
  const storedUrl = getStoredUrl();
  const storedKey = getStoredKey();

  const hasValidStored = Boolean(
    storedUrl &&
    storedKey &&
    storedUrl.startsWith('https://') &&
    !storedUrl.includes('placeholder')
  );

  const url = (hasValidStored ? storedUrl : (envUrl || DEFAULT_SUPABASE_URL)).trim();
  const anonKey = (hasValidStored ? storedKey : (envKey || DEFAULT_SUPABASE_ANON_KEY)).trim();
  const isConfigured = Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    !url.includes('placeholder') &&
    !url.includes('your-project-id')
  );

  return {
    url,
    anonKey,
    isConfigured,
    source: hasValidStored ? 'localStorage' : envUrl ? 'env' : 'default'
  };
};

export const saveSupabaseCredentials = (url: string, anonKey: string) => {
  localStorage.setItem('AURA_SUPABASE_URL', url.trim());
  localStorage.setItem('AURA_SUPABASE_ANON_KEY', anonKey.trim());
  // Reinitialize client
  initSupabaseClient();
};

export const clearStoredCredentials = () => {
  localStorage.removeItem('AURA_SUPABASE_URL');
  localStorage.removeItem('AURA_SUPABASE_ANON_KEY');
  initSupabaseClient();
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!clientInstance) {
    initSupabaseClient();
  }
  return clientInstance!;
};

export const initSupabaseClient = (): SupabaseClient => {
  const { url, anonKey, isConfigured } = getSupabaseConfig();

  if (isConfigured) {
    clientInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } else {
    // Fallback unconfigured client instance
    clientInstance = createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
      },
    });
  }

  return clientInstance;
};

// Default export
export const supabase = getSupabaseClient();
export default supabase;
