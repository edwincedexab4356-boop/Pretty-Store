import React from 'react';
import { ShieldAlert, ArrowRight, Wrench, X } from 'lucide-react';

interface PermissionErrorBannerProps {
  errorMessage: string;
  onOpenFixModal: () => void;
  onDismiss?: () => void;
}

export const PermissionErrorBanner: React.FC<PermissionErrorBannerProps> = ({
  errorMessage,
  onOpenFixModal,
  onDismiss,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xl animate-fadeIn">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
          <ShieldAlert size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-xs">
              Error de Permisos en Supabase (PostgreSQL 42501)
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 font-semibold">
              permission denied
            </span>
          </div>
          <p className="text-slate-300 text-[11px] mt-0.5">
            {errorMessage}
          </p>
          <p className="text-slate-400 text-[10px] mt-0.5">
            PostgreSQL requiere que ejecutes los permisos <strong>GRANT</strong> y políticas <strong>RLS</strong> en tu SQL Editor.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          onClick={onOpenFixModal}
          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
        >
          <Wrench size={13} />
          <span>Solucionar con Script SQL</span>
          <ArrowRight size={13} />
        </button>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
            title="Cerrar aviso"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
};
