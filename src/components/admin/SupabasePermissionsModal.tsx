import React, { useState } from 'react';
import {
  ShieldAlert,
  Copy,
  CheckCircle2,
  ExternalLink,
  X,
  Terminal,
  Database,
  Check,
  AlertTriangle,
  Play,
  RefreshCw,
  Trash2,
  Unlock,
} from 'lucide-react';
import { SUPABASE_FIX_SQL, SUPABASE_UNLOCK_DELETE_SQL } from '../../utils/supabaseSqlFix';
import { getSupabaseConfig, getSupabaseClient } from '../../lib/supabase';

interface SupabasePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  failedActionDescription?: string;
  onPermissionsFixed?: () => void;
}

export const SupabasePermissionsModal: React.FC<SupabasePermissionsModalProps> = ({
  isOpen,
  onClose,
  failedActionDescription,
  onPermissionsFixed,
}) => {
  const [activeTab, setActiveTab] = useState<'unlock_delete' | 'master_script'>('unlock_delete');
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const config = getSupabaseConfig();
  const projectRef = config.url.replace('https://', '').split('.')[0] || 'jlxlbdyerlphrcjxhros';
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  const currentSql = activeTab === 'unlock_delete' ? SUPABASE_UNLOCK_DELETE_SQL : SUPABASE_FIX_SQL;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const supabase = getSupabaseClient();

      // 1. Probar lectura
      const { error: readErr } = await supabase
        .from('categorias')
        .select('id')
        .limit(1);

      if (readErr && readErr.message.toLowerCase().includes('permission denied')) {
        setVerificationResult({
          success: false,
          message: `Acceso bloqueado en lectura: ${readErr.message}. Ejecuta el script en Supabase SQL Editor.`,
        });
        return;
      }

      // 2. Probar permisos de eliminación (DELETE)
      const { error: delErr } = await supabase
        .from('clientes')
        .delete()
        .eq('id', 999999999);

      if (delErr && (delErr.code === '42501' || delErr.message.toLowerCase().includes('permission denied'))) {
        setVerificationResult({
          success: false,
          message: `PostgreSQL aún bloquea el borrado (Error 42501: ${delErr.message}). Copia el "Script de Desbloqueo de Eliminación", pégalo en tu Supabase SQL Editor y pulsa RUN.`,
        });
        return;
      }

      // Si no arrojó 42501, la base de datos permite DELETE
      setVerificationResult({
        success: true,
        message: '¡Permisos completos de lectura y eliminación verificados exitosamente en Supabase!',
      });
      if (onPermissionsFixed) {
        setTimeout(() => {
          onPermissionsFixed();
        }, 1500);
      }
    } catch (e: any) {
      setVerificationResult({
        success: false,
        message: e?.message || 'Error al conectar con Supabase.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0e0e12] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-[#09090c] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/20 flex items-center justify-center text-[#c5a059] shrink-0">
              <Terminal size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-medium tracking-wider text-[#c5a059] block">
                  Seguridad & Base de Datos
                </span>
              </div>
              <h2 className="text-lg font-serif-luxury font-semibold text-white tracking-wide mt-0.5">
                Desbloqueo de Permisos y Eliminaciones en Supabase
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 pt-4 bg-[#09090c]/50 border-b border-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('unlock_delete');
              setVerificationResult(null);
            }}
            className={`pb-3 px-1 text-xs font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'unlock_delete'
                ? 'border-[#c5a059] text-white font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Unlock size={14} className={activeTab === 'unlock_delete' ? 'text-[#c5a059]' : 'text-stone-500'} />
            <span>1. Desbloquear Eliminación en Supabase (Recomendado)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('master_script');
              setVerificationResult(null);
            }}
            className={`pb-3 px-1 text-xs font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'master_script'
                ? 'border-[#c5a059] text-white font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Database size={14} className={activeTab === 'master_script' ? 'text-[#c5a059]' : 'text-stone-500'} />
            <span>2. Script Maestro Completo (Todas las tablas)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs text-stone-300">
          {/* Motivo del bloqueo */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-medium text-xs sm:text-sm">
              <AlertTriangle size={16} className="shrink-0 text-amber-400" />
              <span>¿Por qué no se borra directamente en Supabase (Error 42501)?</span>
            </div>
            <p className="text-stone-300 leading-relaxed text-[11.5px] font-light">
              Por defecto, PostgreSQL activa políticas RLS y <strong>restringe el comando DELETE</strong> para proteger la base de datos contra borrados accidentales. Cuando intentas borrar un cliente o producto desde el panel, Supabase rechaza la petición con el código <code className="text-amber-300 font-mono">42501 (permission denied)</code>.
            </p>
            <p className="text-stone-300 leading-relaxed text-[11.5px] font-light">
              Al ejecutar este script en tu <strong>SQL Editor de Supabase</strong>, se otorga permiso directo para que el administrador pueda eliminar clientes, productos, pedidos y categorías de manera inmediata y definitiva.
            </p>
            {failedActionDescription && (
              <div className="mt-2 pt-2 border-t border-amber-500/20 text-rose-300 font-mono text-[11px]">
                Última acción bloqueada: {failedActionDescription}
              </div>
            )}
          </div>

          {/* Pasos rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-1">
              <span className="text-[#c5a059] font-medium text-[11px] block">Paso 1: Copiar</span>
              <p className="text-[11px] text-stone-400 font-light">
                Haz clic en el botón <strong>"Copiar Script SQL"</strong> abajo.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-1">
              <span className="text-[#c5a059] font-medium text-[11px] block">Paso 2: Abrir Supabase</span>
              <p className="text-[11px] text-stone-400 font-light">
                Abre tu proyecto en <strong>SQL Editor</strong> de Supabase.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-1">
              <span className="text-[#c5a059] font-medium text-[11px] block">Paso 3: Pegar y RUN</span>
              <p className="text-[11px] text-stone-400 font-light">
                Pega el código y presiona el botón verde <strong>RUN</strong>.
              </p>
            </div>
          </div>

          {/* SQL Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-200 flex items-center gap-1.5">
                <Terminal size={14} className="text-[#c5a059]" />
                <span>
                  {activeTab === 'unlock_delete'
                    ? 'Script de Desbloqueo de Eliminación (GRANT ALL & DISABLE RLS)'
                    : 'Script Maestro de Creación y Estructura Completa'}
                </span>
              </span>

              <button
                onClick={handleCopy}
                className="px-3.5 py-1.5 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-[#c5a059]/20"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? '¡Copiado!' : 'Copiar Script'}</span>
              </button>
            </div>

            <div className="relative bg-black/70 rounded-xl border border-white/10 p-4 font-mono text-[11px] text-stone-300 max-h-56 overflow-y-auto selection:bg-[#c5a059] selection:text-black">
              <pre className="whitespace-pre-wrap leading-relaxed">{currentSql}</pre>
            </div>
          </div>

          {/* Verification feedback */}
          {verificationResult && (
            <div
              className={`p-3.5 rounded-xl flex items-start gap-2.5 text-xs ${
                verificationResult.success
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {verificationResult.success ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{verificationResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#09090c] flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={sqlEditorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-stone-200 hover:text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <span>Abrir SQL Editor en Supabase</span>
            <ExternalLink size={14} />
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-stone-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={isVerifying ? 'animate-spin' : ''} />
              <span>{isVerifying ? 'Comprobando...' : 'Verificar en Supabase'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-[#c5a059]/20"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? '¡Script Copiado!' : 'Copiar Script SQL'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
