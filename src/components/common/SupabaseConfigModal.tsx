import React, { useState } from 'react';
import { Database, Key, Globe, CheckCircle2, AlertCircle, X, ShieldAlert, RefreshCw } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseCredentials, clearStoredCredentials } from '../../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsUpdated: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onCredentialsUpdated,
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestStatus('testing');
    setErrorMessage(null);

    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setTestStatus('error');
      setErrorMessage('Debes completar tanto la URL del proyecto como la Anon Key.');
      return;
    }

    if (!cleanUrl.startsWith('https://')) {
      setTestStatus('error');
      setErrorMessage('La URL de Supabase debe comenzar con https://');
      return;
    }

    // Save and re-test
    try {
      saveSupabaseCredentials(cleanUrl, cleanKey);
      setTestStatus('success');
      setTimeout(() => {
        onCredentialsUpdated();
        onClose();
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar credenciales.';
      setTestStatus('error');
      setErrorMessage(msg);
    }
  };

  const handleClear = () => {
    clearStoredCredentials();
    setUrl('');
    setAnonKey('');
    setTestStatus('idle');
    setErrorMessage(null);
    onCredentialsUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-950/60 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Database size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-serif-luxury">
              Conexión con Supabase
            </h3>
            <p className="text-xs text-slate-400">
              Configura tus credenciales para conectar las tablas de tu base de datos
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-6 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <ShieldAlert size={14} />
            <span>Seguridad Frontend</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Solo se requiere la clave pública <code>anon public key</code>. Nunca utilices la clave <code>service_role</code> ni contraseñas de base de datos en el cliente.
          </p>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Puedes definirlas en el archivo <code>.env</code> como <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>, o ingresarlas en este formulario para conexión inmediata.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Globe size={13} className="text-amber-400" />
              <span>Project URL (VITE_SUPABASE_URL)</span>
            </label>
            <input
              type="text"
              placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Key size={13} className="text-amber-400" />
              <span>Publishable / Anon Key (VITE_SUPABASE_ANON_KEY)</span>
            </label>
            <textarea
              rows={3}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono resize-none"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {testStatus === 'success' && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span className="text-[11px]">¡Credenciales actualizadas exitosamente! Recargando catálogo...</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-3">
            {currentConfig.isConfigured && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
              >
                Limpiar datos guardados
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={testStatus === 'testing'}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {testStatus === 'testing' ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <span>Guardar y Conectar</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
