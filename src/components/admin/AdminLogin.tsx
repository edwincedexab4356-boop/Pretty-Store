import React, { useState } from 'react';
import { Mail, Lock, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface AdminLoginProps {
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToStore }) => {
  const { signIn, isLoading } = useAdminAuth();
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUser = emailOrUser.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    const res = await signIn(cleanUser, cleanPass);
    if (!res.success) {
      setErrorMsg(res.error || 'Credenciales inválidas. Verifica tu correo y contraseña.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070608] flex items-center justify-center p-4 selection:bg-[#c5a059] selection:text-black">
      <div className="w-full max-w-md bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header with Circular Official Logo */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-black border border-white/15 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <img
              src="/images/logo/logotipo.jpeg"
              alt="Pretty Store"
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
            Pretty Store Atelier
          </span>
          <h1 className="text-xl sm:text-2xl font-serif-luxury font-semibold text-white tracking-wide">
            Panel de Administración
          </h1>
          <p className="text-xs text-stone-400 mt-1.5 font-light">
            Ingresa tus credenciales para gestionar la tienda
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5 flex items-center gap-1.5">
              <Mail size={13} className="text-[#c5a059]" />
              <span>Correo Electrónico o Usuario</span>
            </label>
            <input
              type="text"
              required
              value={emailOrUser}
              onChange={(e) => {
                setEmailOrUser(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="admin@prettystore.store o usuario"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/40 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5 flex items-center gap-1.5">
              <Lock size={13} className="text-[#c5a059]" />
              <span>Contraseña</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/40 transition-colors font-mono"
            />
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <span className="shrink-0 text-rose-400 font-bold">✕</span>
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 shadow-lg shadow-[#c5a059]/20"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin text-black" />
                <span>Verificando credenciales en Supabase...</span>
              </>
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Back link */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-[#c5a059] transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Volver a la Tienda Pública</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-white/[0.06] text-center">
          <p className="text-[11px] text-stone-500 flex items-center justify-center gap-1.5 font-light">
            <Lock size={12} className="text-stone-500" />
            <span>Acceso privado exclusivo para la administración de Pretty Store</span>
          </p>
        </div>
      </div>
    </div>
  );
};
