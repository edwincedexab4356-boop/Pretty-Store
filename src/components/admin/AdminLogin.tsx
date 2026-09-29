import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Store,
  KeyRound,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface AdminLoginProps {
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToStore }) => {
  const { signIn } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      try {
        await signIn(cleanEmail, password);
        return;
      } catch (firstErr: any) {
        if (!cleanEmail.includes('@')) {
          await signIn(`${cleanEmail}@gmail.com`, password);
          return;
        }
        throw firstErr;
      }
    } catch (err: any) {
      console.error('Error de autenticación:', err);
      const msg = err?.message || 'Error en la autenticación con Supabase.';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch')) {
        setErrorMessage('Error de conexión ("Failed to fetch"): El navegador no pudo conectar con Supabase. Esto ocurre si un bloqueador de anuncios (AdBlock / Brave Shields) está bloqueando supabase.co. Recarga la página e inténtalo de nuevo.');
      } else if (msg.includes('Invalid login credentials')) {
        setErrorMessage('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else if (msg.includes('Email not confirmed')) {
        setErrorMessage('El correo no ha sido confirmado en Supabase. En Supabase > Authentication > Users confirma el usuario o marca "Auto Confirm User".');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center p-4 sm:p-6 relative selection:bg-[#c5a059] selection:text-black">
      {/* Top back button */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <button
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
        >
          <Store size={15} className="text-[#c5a059]" />
          <span>Volver a la Tienda</span>
        </button>

        <span className="text-[11px] text-stone-500 font-mono flex items-center gap-1.5">
          <Lock size={12} className="text-[#c5a059]" />
          Acceso Seguro
        </span>
      </div>

      {/* Login Box */}
      <div className="w-full max-w-md bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-black border border-white/15 flex items-center justify-center mx-auto mb-3">
            <img
              src="/images/logo/logotipo.jpeg"
              alt="Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.endsWith('/images/logo/logo.png')) {
                  target.src = '/images/logo/logo.png';
                }
              }}
            />
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#c5a059] font-medium block mb-1">
            Pretty-Store Atelier
          </span>
          <h1 className="text-xl sm:text-2xl font-serif-luxury font-semibold text-white tracking-wide">
            Panel de Administración
          </h1>
          <p className="text-xs text-stone-400 mt-1.5 font-light">
            Ingresa tus credenciales para gestionar la tienda
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5 flex items-center gap-1.5">
              <Mail size={13} className="text-[#c5a059]" />
              <span>Correo Electrónico o Usuario</span>
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@pretty-store.com o usuario"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/40 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound size={13} className="text-[#c5a059]" />
              <span>Contraseña</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/40 transition-colors font-mono"
            />
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="animate-spin text-black" />
                <span>Verificando credenciales...</span>
              </>
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Security Access Notice */}
        <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
          <p className="text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
            <Lock size={12} className="text-stone-500" />
            <span>Acceso privado exclusivo para la administración de Pretty-Store</span>
          </p>
        </div>
      </div>
    </div>
  );
};
