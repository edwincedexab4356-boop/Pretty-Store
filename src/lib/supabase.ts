import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default project configuration provided by user
export const DEFAULT_SUPABASE_URL = 'https://jlxlbdyerlphrcjxhros.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpseGxiZHllcmxwaHJjanhocm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk1OTEsImV4cCI6MjEwNjE1NTU5MX0.7D8RwYfNs6U3E5wcA-diT8HRvZu6_C2n1CDPJSuyIvc';

// Filter out dummy/placeholder environment variables
const rawEnvUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawEnvKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const isUsableUrl = (u: string) =>
  Boolean(u && u.startsWith('https://') && !u.includes('placeholder') && !u.includes('your-project-id') && !u.includes('xypdbyccffztaxnvgvrl'));

const isUsableKey = (k: string) =>
  Boolean(k && k.startsWith('eyJ') && !k.includes('placeholder'));

const envUrl = isUsableUrl(rawEnvUrl) ? rawEnvUrl : DEFAULT_SUPABASE_URL;
const envKey = isUsableKey(rawEnvKey) ? rawEnvKey : DEFAULT_SUPABASE_ANON_KEY;

// Cleanup of stale project tokens from previous Supabase project
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('xypdbyccffztaxnvgvrl') || (key.startsWith('sb-') && !key.includes('jlxlbdyerlphrcjxhros')))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
} catch {
  // Ignore
}

// Local storage fallback for quick configuration/testing in development
const getStoredUrl = (): string => {
  try {
    const val = localStorage.getItem('AURA_SUPABASE_URL') || '';
    if (!val || val.includes('xypdbyccffztaxnvgvrl')) {
      localStorage.removeItem('AURA_SUPABASE_URL');
      localStorage.removeItem('AURA_SUPABASE_ANON_KEY');
      return '';
    }
    return val;
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
