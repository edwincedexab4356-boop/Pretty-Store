import React, { useState } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Database,
  Inbox,
  Terminal,
  Copy,
  Check,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { CatalogError } from '../../services/catalogService';

interface CatalogStateBannerProps {
  status: 'loading' | 'unconfigured' | 'error' | 'empty' | 'success';
  error: CatalogError | null;
  productCount: number;
  categoryCount: number;
  onRetry: () => void;
  onOpenConfig: () => void;
}

export const CatalogStateBanner: React.FC<CatalogStateBannerProps> = ({
  status,
  error,
  productCount,
  categoryCount,
  onRetry,
  onOpenConfig,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [showRlsDetails, setShowRlsDetails] = useState(false);

  const fixSqlScript = `-- 1. Otorgar permisos de lectura al rol anónimo y autenticado
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- 2. Permitir lectura pública de categorías activas
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura pública de categorias" ON public.categorias;
CREATE POLICY "Lectura pública de categorias" ON public.categorias
FOR SELECT TO anon, authenticated USING (activa = true);

-- 3. Permitir lectura pública de productos activos
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura pública de productos" ON public.productos;
CREATE POLICY "Lectura pública de productos" ON public.productos
FOR SELECT TO anon, authenticated USING (activo = true);

-- 4. Permitir lectura pública de inventario
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura pública de inventario" ON public.inventario;
CREATE POLICY "Lectura pública de inventario" ON public.inventario
FOR SELECT TO anon, authenticated USING (true);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fixSqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  if (status === 'success') {
    return (
      <div className="bg-slate-900/80 border-b border-slate-800/80 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Supabase Conectado</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">
              {productCount} {productCount === 1 ? 'producto activo' : 'productos activos'} en {categoryCount} {categoryCount === 1 ? 'categoría' : 'categorías'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRetry}
              className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
              title="Volver a consultar Supabase"
            >
              <RefreshCw size={12} />
              <span>Sincronizar</span>
            </button>
            <button
              onClick={onOpenConfig}
              className="text-[11px] text-amber-400/90 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Database size={12} />
              <span>Configuración</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-4xl mx-auto my-8 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-rose-500/30 shadow-2xl shadow-rose-950/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
            <AlertTriangle size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
              <span>Fallo en Consulta Supabase</span>
              {error?.code && <span className="font-mono text-slate-400">[{error.code}]</span>}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {error?.failedQuery === 'connection'
                ? 'Conexión con Supabase no iniciada'
                : `Error al consultar 'public.${error?.failedQuery}'`}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {error?.message}
            </p>

            {error?.hint && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mb-4">
                <strong>Sugerencia:</strong> {error.hint}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={onRetry}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Reintentar Consulta</span>
              </button>
              <button
                onClick={onOpenConfig}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Database size={14} />
                <span>Ver Credenciales</span>
              </button>
              <button
                onClick={() => setShowRlsDetails(!showRlsDetails)}
                className="text-xs text-amber-400 hover:text-amber-300 underline ml-auto cursor-pointer flex items-center gap-1"
              >
                <Terminal size={14} />
                <span>{showRlsDetails ? 'Ocultar SQL' : 'Ver script SQL para permisos RLS'}</span>
              </button>
            </div>

            {showRlsDetails && (
              <div className="mt-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 text-xs">Ejecuta esto en Supabase SQL Editor:</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-amber-300 text-[11px] cursor-pointer"
                  >
                    {copiedSql ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedSql ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 rounded font-mono text-[10px] text-slate-300 overflow-x-auto leading-relaxed">
                  {fixSqlScript}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-amber-500/30 text-center shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>¡Conexión con Supabase Exitosa!</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2 font-serif-luxury">
          Tu base de datos está conectada
        </h3>
        <p className="text-sm text-slate-300 max-w-lg mx-auto mb-4 leading-relaxed">
          Las credenciales son correctas y el frontend ya se comunica con tu proyecto en <code>xypdbyccffztaxnvgvrl.supabase.co</code>.
        </p>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 max-w-xl mx-auto mb-6 text-left text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <HelpCircle size={15} />
            <span>¿Por qué no aparecen productos aún?</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Actualmente tu tabla <code>public.productos</code> devuelve <strong>0 registros activos</strong>. Esto ocurre comúnmente por dos razones:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] pl-1">
            <li><strong>No hay registros todavía:</strong> Las tablas están vacías.</li>
            <li>
              <strong>Políticas RLS bloqueando la lectura pública:</strong> Si creaste filas pero no configuraste las políticas SELECT para el rol <code>anon</code>, PostgreSQL oculta las filas por seguridad.
            </li>
          </ol>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2"
          >
            <RefreshCw size={14} />
            <span>Sincronizar y Recargar Catálogo</span>
          </button>
          <button
            onClick={() => setShowRlsDetails(!showRlsDetails)}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <Terminal size={14} />
            <span>{showRlsDetails ? 'Ocultar Script SQL' : 'Ver Script SQL de Permisos'}</span>
          </button>
        </div>

        {showRlsDetails && (
          <div className="mt-6 p-5 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400">Pega esto en Supabase SQL Editor y presiona "Run":</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                {copiedSql ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>
            <pre className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[10px] text-amber-300 overflow-x-auto leading-relaxed">
              {fixSqlScript}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return null;
};
