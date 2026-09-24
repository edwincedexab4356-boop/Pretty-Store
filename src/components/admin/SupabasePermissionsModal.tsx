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
} from 'lucide-react';
import { SUPABASE_FIX_SQL } from '../../utils/supabaseSqlFix';
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
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const config = getSupabaseConfig();
  // Extract project ref from URL if possible: https://xypdbyccffztaxnvgvrl.supabase.co
  const projectRef = config.url.replace('https://', '').split('.')[0] || 'xypdbyccffztaxnvgvrl';
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_FIX_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const supabase = getSupabaseClient();
      // Try a harmless read on categorias and test if table is accessible
      const { data, error } = await supabase
        .from('categorias')
        .select('id')
        .limit(1);

      if (error && error.message.toLowerCase().includes('permission denied')) {
        setVerificationResult({
          success: false,
          message: `Aún no se detectan los permisos: ${error.message}. Asegúrate de haber presionado "RUN" en el SQL Editor de Supabase.`,
        });
      } else {
        setVerificationResult({
          success: true,
          message: '¡Permisos verificados exitosamente! La base de datos respondió correctamente.',
        });
        if (onPermissionsFixed) {
          setTimeout(() => {
            onPermissionsFixed();
          }, 1500);
        }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wide">
                  PostgreSQL Error 42501
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  permission denied for table ...
                </span>
              </div>
              <h2 className="text-xl font-bold text-white font-serif-luxury mt-1">
                Solución de Permisos y RLS en Supabase
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Explanation Alert */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle size={16} className="shrink-0" />
              <span>¿Por qué ocurre este error en todas las secciones?</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[12px]">
              En PostgreSQL y Supabase existen dos capas de seguridad que deben estar autorizadas:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pl-1 text-[11px]">
              <li>
                <strong className="text-slate-200">Privilegios de tabla (GRANT)</strong>: Tu proyecto no le concedió permisos SQL (<code>GRANT ALL</code>) al rol anónimo/autenticado para escribir en las tablas <code>categorias</code>, <code>productos</code>, <code>inventario</code>, <code>pedidos</code>, etc.
              </li>
              <li>
                <strong className="text-slate-200">Políticas RLS (Row Level Security)</strong>: Solo se crearon políticas de lectura (<code>SELECT</code>), por lo que PostgreSQL bloquea cualquier intento de <code>INSERT</code>, <code>UPDATE</code> o <code>DELETE</code>.
              </li>
            </ol>
            {failedActionDescription && (
              <div className="mt-2 pt-2 border-t border-amber-500/20 text-rose-300 font-mono text-[11px]">
                Última acción bloqueada: {failedActionDescription}
              </div>
            )}
          </div>

          {/* Steps to Fix */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-mono text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <span>Pasos para solucionarlo en 30 segundos:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-amber-400 font-bold block">Paso 1: Copiar</span>
                <p className="text-[11px] text-slate-400">
                  Haz clic en el botón dorado <strong>"Copiar Script SQL"</strong> de abajo.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-amber-400 font-bold block">Paso 2: Abrir Supabase</span>
                <p className="text-[11px] text-slate-400">
                  Abre tu <strong>SQL Editor</strong> de Supabase mediante el botón directo o tu panel.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-amber-400 font-bold block">Paso 3: Pegar y RUN</span>
                <p className="text-[11px] text-slate-400">
                  Pega el script completo y haz clic en el botón verde <strong>RUN</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* SQL Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Terminal size={14} className="text-amber-400" />
                <span>Script SQL de Reparación Integral (GRANT + RLS para todas las tablas)</span>
              </span>

              <button
                onClick={handleCopy}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-amber-500/20"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? '¡Copiado!' : 'Copiar Script'}</span>
              </button>
            </div>

            <div className="relative bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto selection:bg-amber-500 selection:text-slate-950">
              <pre className="whitespace-pre-wrap leading-relaxed">{SUPABASE_FIX_SQL}</pre>
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
              <span>{verificationResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={sqlEditorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <span>Abrir SQL Editor en Supabase</span>
            <ExternalLink size={14} />
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={isVerifying ? 'animate-spin' : ''} />
              <span>{isVerifying ? 'Comprobando...' : 'Verificar Conexión'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-amber-500/20"
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
