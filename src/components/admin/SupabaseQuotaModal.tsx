import React, { useEffect, useState } from 'react';
import {
  X,
  HardDrive,
  Database,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileImage,
  Layers,
  Info,
  Table,
  FolderOpen,
} from 'lucide-react';
import { checkSupabaseStorageAndLimits, SupabaseQuotaReport } from '../../services/adminService';

interface SupabaseQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseQuotaModal: React.FC<SupabaseQuotaModalProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<SupabaseQuotaReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadQuota = async () => {
    setIsLoading(true);
    try {
      const data = await checkSupabaseStorageAndLimits();
      setReport(data);
    } catch (e) {
      console.warn('Error al obtener reporte de cuotas:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQuota();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f0f13] border border-white/10 rounded-2xl w-full max-w-2xl p-5 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto text-stone-100 custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
              <HardDrive size={20} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#c5a059] font-medium block">
                Monitor en Tiempo Real
              </span>
              <h3 className="text-lg font-serif-luxury font-semibold text-white">
                Almacenamiento de Tablas y Storage
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadQuota}
              disabled={isLoading}
              className="p-2 text-stone-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
              title="Actualizar medición"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin text-[#c5a059]' : ''} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading && !report ? (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
            <RefreshCw size={28} className="animate-spin text-[#c5a059]" />
            <span className="text-sm text-stone-300 font-medium">
              Consultando cuotas y almacenamiento de Supabase...
            </span>
            <span className="text-xs text-stone-500">
              Escaneando archivos en buckets y midiendo bytes en todas las tablas
            </span>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Status Alert Banner */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                report.status === 'critical'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : report.status === 'alert'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                  : report.status === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}
            >
              {report.status === 'optimal' ? (
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold text-sm">{report.message}</p>
                <p className="text-[11px] opacity-80">{report.recommendation}</p>
              </div>
            </div>

            {/* SECCIÓN 1: ALMACENAMIENTO DE STORAGE (CDN) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#c5a059]/10 text-[#c5a059]">
                    <FileImage size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Almacenamiento de Storage (Archivos y Multimedia)</h4>
                    <p className="text-[11px] text-stone-400">Fotos de catálogo y videos alojados en CDN</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-white block">
                    {report.storageUsedMB} MB <span className="text-xs text-stone-400 font-normal">/ {report.storageLimitMB} MB</span>
                  </span>
                  <span className="text-[10px] text-[#c5a059] font-mono">
                    {report.storagePercent}% del límite gratuito (1 GB)
                  </span>
                </div>
              </div>

              {/* Barra de progreso de Storage */}
              <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    report.storagePercent > 85
                      ? 'bg-rose-500'
                      : report.storagePercent > 60
                      ? 'bg-amber-500'
                      : 'bg-[#c5a059]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(2, report.storagePercent))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-stone-400 pt-0.5">
                <span className="flex items-center gap-1.5">
                  <FolderOpen size={14} className="text-stone-500" />
                  <strong className="text-stone-200">{report.storageFileCount}</strong> archivos multimedia totales
                </span>
                <span>
                  <strong className="text-emerald-400 font-mono">
                    {(report.storageLimitMB - report.storageUsedMB).toFixed(1)} MB
                  </strong> libres disponibles
                </span>
              </div>

              {/* Desglose de Buckets de Storage */}
              {report.buckets && report.buckets.length > 0 && (
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block">
                    Buckets de Supabase Storage:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {report.buckets.map((b) => (
                      <div key={b.name} className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                        <span className="text-xs font-mono text-amber-300 font-medium truncate block">
                          /{b.name}
                        </span>
                        <div className="flex items-center justify-between text-[11px] text-stone-400">
                          <span>{b.files} archivo(s)</span>
                          <span className="font-mono text-stone-200 font-semibold">{b.sizeMB} MB</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: ALMACENAMIENTO DE LAS TABLAS (BASE DE DATOS) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Database size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Almacenamiento de las Tablas (PostgreSQL)</h4>
                    <p className="text-[11px] text-stone-400">Filas y bytes ocupados por cada colección de datos</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-white block">
                    {report.databaseTotalKB} KB <span className="text-xs text-stone-400 font-normal">({report.databaseTotalMB} MB)</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Límite DB: {report.databaseLimitMB} MB ({report.databasePercent}%)
                  </span>
                </div>
              </div>

              {/* Barra de progreso de Base de Datos */}
              <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(1, report.databasePercent))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-stone-400 pt-0.5">
                <span className="flex items-center gap-1.5">
                  <Table size={14} className="text-stone-500" />
                  <strong className="text-stone-200">{report.totalRecords}</strong> registros guardados en total
                </span>
                <span>
                  <strong className="text-emerald-400 font-mono">
                    {(report.databaseLimitMB - report.databaseTotalMB).toFixed(1)} MB
                  </strong> libres en PostgreSQL
                </span>
              </div>

              {/* Lista Detallada Tabla por Tabla */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block">
                  Detalle individual por cada tabla:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {report.databaseTables && report.databaseTables.length > 0 ? (
                    report.databaseTables.map((tbl) => (
                      <div
                        key={tbl.name}
                        className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between hover:border-white/15 transition-colors"
                      >
                        <div className="space-y-0.5 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-semibold text-white">
                              {tbl.name}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-400 truncate max-w-[190px]">
                            {tbl.displayName}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-amber-300 block">
                            {tbl.rows} {tbl.rows === 1 ? 'fila' : 'filas'}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            {tbl.sizeKB > 0 ? `${tbl.sizeKB} KB` : '0 KB'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-3 text-xs text-stone-500">
                      No se detectaron tablas
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Consejos de optimización y no sobrepasar límites */}
            <div className="p-4 rounded-xl bg-[#c5a059]/5 border border-[#c5a059]/20 flex items-start gap-3 text-xs text-stone-300">
              <Info size={17} className="text-[#c5a059] shrink-0 mt-0.5" />
              <div className="space-y-1.5 text-[11px]">
                <p className="font-semibold text-white text-xs">
                  ¿Cómo funciona el almacenamiento de Supabase y cómo no llegar al límite?
                </p>
                <ul className="list-disc pl-4 space-y-1 text-stone-400">
                  <li>
                    <strong className="text-stone-300">Storage CDN (1,024 MB / 1 GB):</strong> Es donde se guardan las fotos y videos. El sistema comprime automáticamente las fotos a formato WebP/JPG ligero (~120KB) y limita videos a 10MB para que nunca llenes este espacio rápidamente.
                  </li>
                  <li>
                    <strong className="text-stone-300">Tablas de Base de Datos (500 MB):</strong> Es donde se guardan los datos de productos, pedidos, clientes y categorías. El consumo actual es de apenas <span className="text-emerald-400 font-mono font-medium">{report.databaseTotalKB} KB</span>, lo que te permite registrar decenas de miles de productos y pedidos sin ningún problema.
                  </li>
                  <li>
                    <strong className="text-stone-300">Alerta Temprana:</strong> El sistema te notificará automáticamente cuando alcances el 50%, 75% o 90% para que siempre tengas control total.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 font-mono">
            Supabase Free Tier • Storage 1GB • DB 500MB
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-[#c5a059] hover:bg-[#d8b065] text-xs font-semibold text-black transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
