import React, { useState } from 'react';
import {
  Database,
  Key,
  Globe,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Copy,
  Check,
  Terminal,
  Activity
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig, saveSupabaseCredentials } from '../../lib/supabase';

interface SupabaseInlineSetupProps {
  onConnected: () => void;
}

interface DiagnosticStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  message?: string;
  details?: string;
}

export const SupabaseInlineSetup: React.FC<SupabaseInlineSetupProps> = ({ onConnected }) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRlsHelp, setShowRlsHelp] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Diagnostic state
  const [diagnostics, setDiagnostics] = useState<DiagnosticStep[] | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const sqlScript = `-- 1. Permitir lectura pública de categorías activas
CREATE POLICY "Lectura pública de categorias"
ON public.categorias FOR SELECT
TO anon, authenticated
USING (activa = true);

-- 2. Permitir lectura pública de productos activos
CREATE POLICY "Lectura pública de productos"
ON public.productos FOR SELECT
TO anon, authenticated
USING (activo = true);

-- 3. Permitir lectura pública de inventario disponible
CREATE POLICY "Lectura pública de inventario"
ON public.inventario FOR SELECT
TO anon, authenticated
USING (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const runDetailedDiagnostics = async (cleanUrl: string, cleanKey: string) => {
    const steps: DiagnosticStep[] = [
      { name: '1. Formato de URL del Proyecto', status: 'running' },
      { name: '2. Formato de Clave Anon (JWT)', status: 'pending' },
      { name: '3. Conectividad con la API de Supabase', status: 'pending' },
      { name: '4. Acceso a la tabla "categorias"', status: 'pending' },
      { name: '5. Acceso a la tabla "productos"', status: 'pending' },
      { name: '6. Acceso a la tabla "inventario"', status: 'pending' },
    ];
    setDiagnostics([...steps]);

    // Step 1: URL format
    if (!cleanUrl.startsWith('https://') || !cleanUrl.includes('.supabase.co')) {
      steps[0] = {
        name: '1. Formato de URL del Proyecto',
        status: 'error',
        message: 'La URL no tiene el formato estándar de Supabase.',
        details: 'Debe ser https://[tu-id-de-proyecto].supabase.co (no uses la URL del panel ni agregues /dashboard)',
      };
      setDiagnostics([...steps]);
      return false;
    }
    steps[0] = {
      name: '1. Formato de URL del Proyecto',
      status: 'success',
      message: `URL válida: ${cleanUrl}`,
    };
    steps[1].status = 'running';
    setDiagnostics([...steps]);

    // Step 2: Key format
    if (!cleanKey.startsWith('eyJ') || cleanKey.length < 50) {
      steps[1] = {
        name: '2. Formato de Clave Anon (JWT)',
        status: 'error',
        message: 'La clave no parece un JWT de Supabase.',
        details: 'Las claves anon de Supabase siempre empiezan con "eyJ..." y tienen más de 100 caracteres. Asegúrate de no pegar la clave service_role ni la contraseña de PostgreSQL.',
      };
      setDiagnostics([...steps]);
      return false;
    }
    steps[1] = {
      name: '2. Formato de Clave Anon (JWT)',
      status: 'success',
      message: 'Token JWT anon con formato correcto.',
    };
    steps[2].status = 'running';
    setDiagnostics([...steps]);

    // Step 3: Network Ping
    const testClient = createClient(cleanUrl, cleanKey, {
      auth: { persistSession: false },
    });

    try {
      const pingRes = await fetch(`${cleanUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: cleanKey,
          Authorization: `Bearer ${cleanKey}`,
        },
      });

      if (!pingRes.ok && pingRes.status !== 200 && pingRes.status !== 404) {
        steps[2] = {
          name: '3. Conectividad con la API de Supabase',
          status: 'error',
          message: `El servidor respondió con código HTTP ${pingRes.status}`,
          details: 'Verifica que el proyecto no esté pausado en tu panel de Supabase y que la clave pertenezca a este proyecto.',
        };
        setDiagnostics([...steps]);
        return false;
      }
      steps[2] = {
        name: '3. Conectividad con la API de Supabase',
        status: 'success',
        message: 'Conectividad verificada con el servidor Supabase.',
      };
    } catch (netErr: any) {
      steps[2] = {
        name: '3. Conectividad con la API de Supabase',
        status: 'error',
        message: 'No se pudo alcanzar el dominio de Supabase.',
        details: netErr.message || 'Error de red o CORS.',
      };
      setDiagnostics([...steps]);
      return false;
    }

    // Step 4: Categorias Table
    steps[3].status = 'running';
    setDiagnostics([...steps]);

    const { data: catData, error: catErr } = await testClient
      .from('categorias')
      .select('id, nombre, activa')
      .limit(3);

    if (catErr) {
      steps[3] = {
        name: '4. Acceso a la tabla "categorias"',
        status: 'error',
        message: `Fallo [${catErr.code}]: ${catErr.message}`,
        details: catErr.details || catErr.hint || (catErr.code === '42501'
          ? 'RLS (Row Level Security) está bloqueando la lectura. Ejecuta el script SQL que aparece abajo.'
          : 'Verifica que la tabla se llame exactamente "categorias" en minúsculas.'),
      };
      setShowRlsHelp(true);
    } else {
      steps[3] = {
        name: '4. Acceso a la tabla "categorias"',
        status: 'success',
        message: `OK: Se encontraron registros legibles (${catData?.length ?? 0} filas leídas).`,
      };
    }

    // Step 5: Productos Table
    steps[4].status = 'running';
    setDiagnostics([...steps]);

    const { data: prodData, error: prodErr } = await testClient
      .from('productos')
      .select('id, nombre, precio, activo')
      .limit(3);

    if (prodErr) {
      steps[4] = {
        name: '5. Acceso a la tabla "productos"',
        status: 'error',
        message: `Fallo [${prodErr.code}]: ${prodErr.message}`,
        details: prodErr.details || prodErr.hint || (prodErr.code === '42501'
          ? 'RLS bloqueando lectura pública de productos. Ejecuta la política SQL.'
          : 'Verifica el nombre de la tabla "productos".'),
      };
      setShowRlsHelp(true);
    } else {
      steps[4] = {
        name: '5. Acceso a la tabla "productos"',
        status: 'success',
        message: `OK: Se encontraron registros legibles (${prodData?.length ?? 0} filas leídas).`,
      };
    }

    // Step 6: Inventario Table
    steps[5].status = 'running';
    setDiagnostics([...steps]);

    const { data: invData, error: invErr } = await testClient
      .from('inventario')
      .select('id, producto_id, stock_actual')
      .limit(3);

    if (invErr) {
      steps[5] = {
        name: '6. Acceso a la tabla "inventario"',
        status: 'warning',
        message: `Aviso [${invErr.code}]: ${invErr.message}`,
        details: invErr.details || invErr.hint || 'No se pudo leer inventario, se usará stock_actual si existe en productos.',
      };
    } else {
      steps[5] = {
        name: '6. Acceso a la tabla "inventario"',
        status: 'success',
        message: `OK: Tabla de inventario accesible (${invData?.length ?? 0} filas leídas).`,
      };
    }

    setDiagnostics([...steps]);

    const hasCriticalErrors = steps.some((s) => s.status === 'error');
    return !hasCriticalErrors;
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const cleanUrl = url.trim().replace(/\/$/, '');
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setGeneralError('Por favor ingresa tanto la URL del proyecto como la Anon Key.');
      return;
    }

    setIsSubmitting(true);

    try {
      const isOk = await runDetailedDiagnostics(cleanUrl, cleanKey);
      setIsSubmitting(false);

      if (isOk) {
        saveSupabaseCredentials(cleanUrl, cleanKey);
        setTimeout(() => {
          onConnected();
        }, 500);
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Error al ejecutar prueba.';
      setGeneralError(`Excepción de conexión: ${msg}`);
    }
  };

  const handleForceSave = () => {
    const cleanUrl = url.trim().replace(/\/$/, '');
    const cleanKey = anonKey.trim();
    if (!cleanUrl || !cleanKey) {
      setGeneralError('Ingresa la URL y Anon Key primero.');
      return;
    }
    saveSupabaseCredentials(cleanUrl, cleanKey);
    onConnected();
  };

  return (
    <section id="catalogo" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Database size={28} />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-amber-400 block mb-1">
                  Fase 2 — Conexión Real
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif-luxury">
                  Conectar con Supabase
                </h2>
              </div>
            </div>

            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors self-start sm:self-auto bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800"
            >
              <span>Abrir Supabase Dashboard</span>
              <ExternalLink size={13} />
            </a>
          </div>

          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Ingresa las credenciales de tu proyecto para conectar tus tablas existentes:{' '}
            <code className="text-amber-400 font-mono text-xs bg-slate-950 px-2 py-0.5 rounded">public.categorias</code>,{' '}
            <code className="text-amber-400 font-mono text-xs bg-slate-950 px-2 py-0.5 rounded">public.productos</code> e{' '}
            <code className="text-amber-400 font-mono text-xs bg-slate-950 px-2 py-0.5 rounded">public.inventario</code>.
          </p>

          {/* Form */}
          <form onSubmit={handleTestAndSave} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe size={14} className="text-amber-400" />
                  <span>Project URL</span>
                  <span className="text-slate-500 font-normal">(VITE_SUPABASE_URL)</span>
                </span>
                <span className="text-[11px] text-slate-400">Settings &gt; API &gt; Project URL</span>
              </label>
              <input
                type="text"
                placeholder="https://abcdefghijklmn.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key size={14} className="text-amber-400" />
                  <span>Anon / Publishable Key</span>
                  <span className="text-slate-500 font-normal">(VITE_SUPABASE_ANON_KEY)</span>
                </span>
                <span className="text-[11px] text-slate-400">Settings &gt; API &gt; anon public</span>
              </label>
              <textarea
                rows={3}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono transition-colors resize-none"
              />
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                <span>Usa la clave <strong>anon public</strong> (empieza con "eyJ..."). No uses la clave service_role.</span>
              </p>
            </div>

            {generalError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Diagnostic Steps Panel (When run) */}
            {diagnostics && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Activity size={14} className="text-amber-400" />
                    <span>Diagnóstico de Conexión en Vivo</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Paso a paso con Supabase</span>
                </div>

                <div className="space-y-2.5">
                  {diagnostics.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs border transition-colors ${
                        step.status === 'success'
                          ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300'
                          : step.status === 'error'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : step.status === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : step.status === 'running'
                          ? 'bg-slate-900 border-amber-500/50 text-slate-200'
                          : 'bg-slate-900/50 border-slate-800/60 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-2">
                          {step.status === 'success' && <CheckCircle2 size={15} className="text-emerald-400" />}
                          {step.status === 'error' && <AlertCircle size={15} className="text-rose-400" />}
                          {step.status === 'warning' && <AlertCircle size={15} className="text-amber-400" />}
                          {step.status === 'running' && <RefreshCw size={14} className="text-amber-400 animate-spin" />}
                          {step.status === 'pending' && <span className="w-3.5 h-3.5 rounded-full bg-slate-800 inline-block" />}
                          <span>{step.name}</span>
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          {step.status === 'success' && 'OK'}
                          {step.status === 'error' && 'ERROR'}
                          {step.status === 'warning' && 'AVISO'}
                          {step.status === 'running' && 'PROBANDO...'}
                          {step.status === 'pending' && 'PENDIENTE'}
                        </span>
                      </div>
                      {step.message && (
                        <p className="mt-1 text-[11px] leading-relaxed opacity-90 pl-5.5">
                          {step.message}
                        </p>
                      )}
                      {step.details && (
                        <p className="mt-1 text-[11px] text-slate-300/90 bg-black/30 p-2 rounded-lg font-mono text-[10px] overflow-x-auto">
                          {step.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowRlsHelp(!showRlsHelp)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer underline text-left"
              >
                <HelpCircle size={14} />
                <span>{showRlsHelp ? 'Ocultar script SQL' : '¿Error 42501 (RLS)? Ver script SQL para Supabase'}</span>
              </button>

              <div className="flex items-center gap-2.5">
                {diagnostics && diagnostics.some((s) => s.status === 'error') && (
                  <button
                    type="button"
                    onClick={handleForceSave}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                    title="Guardar credenciales sin validación previa"
                  >
                    Guardar de todos modos
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Diagnosticando y Conectando...</span>
                    </>
                  ) : (
                    <>
                      <span>Probar y Conectar Supabase</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* RLS Help Dropdown */}
          {showRlsHelp && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-950 border border-amber-500/30 text-xs text-slate-300 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 flex items-center gap-2 text-sm">
                  <Terminal size={16} />
                  <span>Script SQL para habilitar permisos de lectura (RLS)</span>
                </span>
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedSql ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                En Supabase, ve al menú izquierdo ➔ <strong>SQL Editor</strong> ➔ Haz clic en <strong>New Query</strong>, pega este código y presiona <strong>Run</strong> (ejecutar):
              </p>
              <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto leading-relaxed">
{sqlScript}
              </pre>
            </div>
          )}

          {/* Guide steps */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-amber-400 block mb-1">1. Ir a Supabase</span>
              <p className="text-[11px] text-slate-400">
                Abre tu consola de Supabase y ve a <strong>Project Settings ⚙️ &gt; API</strong>.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-amber-400 block mb-1">2. Copiar Datos</span>
              <p className="text-[11px] text-slate-400">
                Copia la <strong>Project URL</strong> y la <strong>anon public key</strong>.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-amber-400 block mb-1">3. Ver Diagnóstico</span>
              <p className="text-[11px] text-slate-400">
                Al hacer clic en el botón, el sistema te muestra en tiempo real exactamente qué tabla respondió o qué error devolvió.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
