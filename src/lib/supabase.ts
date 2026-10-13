import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://jlxlbdyerlphrcjxhros.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpseGxiZHllcmxwaHJjanhocm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1Nzk1OTEsImV4cCI6MjEwNjE1NTU5MX0.7D8RwYfNs6U3E5wcA-diT8HRvZu6_C2n1CDPJSuyIvc';

const rawEnvUrl = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL
    ? String(import.meta.env.VITE_SUPABASE_URL)
    : ''
).trim();

const rawEnvKey = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY
    ? String(import.meta.env.VITE_SUPABASE_ANON_KEY)
    : ''
).trim();

const isUsableUrl = (u: string) =>
  Boolean(u && u.startsWith('https://') && !u.includes('placeholder') && !u.includes('your-project-id'));

const isUsableKey = (k: string) =>
  Boolean(k && k.startsWith('eyJ') && !k.includes('placeholder'));

export const envUrl = isUsableUrl(rawEnvUrl) ? rawEnvUrl : DEFAULT_SUPABASE_URL;
export const envKey = isUsableKey(rawEnvKey) ? rawEnvKey : DEFAULT_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient = createClient(envUrl, envKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function getSupabaseClient(): SupabaseClient {
  return supabase;
}
