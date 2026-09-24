import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Store,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface AdminLoginProps {
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToStore }) => {
  const { signIn, signUp, isLoading } = useAdminAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      if (mode === 'login') {
        await signIn(cleanEmail, password);
      } else {
        await signUp(cleanEmail, password, nombre.trim());
        setSuccessMessage('Administrador registrado correctamente. Iniciando sesión...');
      }
    } catch (err: any) {
      const msg = err?.message || 'Error en la autenticación con Supabase.';
      if (msg.includes('Invalid login credentials')) {
        setErrorMessage('Credenciales inválidas. Verifica tu correo y contraseña, o regístrate si es tu primera vez.');
      } else if (msg.includes('User already registered')) {
        setErrorMessage('Este correo ya está registrado. Por favor selecciona "Iniciar sesión".');
      } else {
        setErrorMessage(msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top back button */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <button
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
        >
          <Store size={15} />
          <span>← Volver a la Tienda Pública</span>
        </button>

        <span className="text-[11px] font-mono text-slate-500 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
          Supabase Auth
        </span>
      </div>

      {/* Login Box */}
      <div className="w-full max-w-md bg-slate-900/90 border border-amber-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4 shadow-lg shadow-amber-500/10">
            <Lock size={28} />
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-amber-400 block mb-1">
            Acceso Administrativo
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif-luxury">
            Panel de Control
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            {mode === 'login'
              ? 'Ingresa tus credenciales de administrador para continuar'
              : 'Registra la cuenta administradora de tu tienda en Supabase'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User size={13} className="text-amber-400" />
                <span>Nombre Completo</span>
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Edwin Cedeño"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mail size={13} className="text-amber-400" />
              <span>Correo Electrónico</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tuempresa.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound size={13} className="text-amber-400" />
              <span>Contraseña</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors font-mono"
            />
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Autenticando en Supabase...</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Iniciar Sesión' : 'Registrar Administrador'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          {mode === 'login' ? (
            <p className="text-xs text-slate-400">
              ¿Aún no has creado tu usuario administrador?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                }}
                className="text-amber-400 font-semibold hover:underline cursor-pointer ml-1"
              >
                Crear cuenta
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              ¿Ya tienes cuenta de administrador?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className="text-amber-400 font-semibold hover:underline cursor-pointer ml-1"
              >
                Iniciar sesión
              </button>
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>Sesión segura gestionada con Supabase Auth & JWT</span>
        </div>
      </div>
    </div>
  );
};
