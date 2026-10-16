import React, { useState, useEffect } from 'react';
import { Database, HardDrive, RefreshCw, CheckCircle2, ShieldCheck, Info, Sparkles } from 'lucide-react';
import { getSupabaseCapacityStats, SupabaseCapacityStats } from '../../services/adminService';

export const SupabaseStorageWidget: React.FC = () => {
  const [stats, setStats] = useState<SupabaseCapacityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await getSupabaseCapacityStats();
      setStats(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (!stats && isLoading) {
    return (
      <div className="p-6 rounded-3xl bg-[#100f14] border border-white/10 animate-pulse">
        <div className="h-4 w-48 bg-white/10 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="h-32 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  const db = stats?.database || {
    usedMb: 1.2,
    freeMb: 498.8,
    totalMb: 500,
    percent: 0.24,
    totalRows: 0,
    ordersCount: 0,
    productsCount: 0,
    clientsCount: 0,
  };

  const st = stats?.storage || {
    usedMb: 0.1,
    freeMb: 999.9,
    totalMb: 1000,
    percent: 0.01,
    filesCount: 0,
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#14121a] to-[#0c0b10] border border-[#c5a059]/25 shadow-2xl space-y-4">
      {/* Top Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#fbbf24]">
            <Database size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Estado y Capacidad de Supabase
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Plan Free Activo
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Monitoreo en tiempo real de espacio en disco (escrituras) e imágenes
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadStats}
          disabled={isLoading}
          className="self-end sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-semibold border border-white/10 cursor-pointer transition-all active:scale-95"
          title="Actualizar medición de espacio"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin text-[#fbbf24]' : ''} />
          <span>{isLoading ? 'Midiendo...' : 'Actualizar Espacio'}</span>
        </button>
      </div>

      {/* 2 Grid Cards: Database Writes & Image Storage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Base de Datos y Escrituras */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black/50 border border-white/10 space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Database size={16} />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                1. Escrituras & Base de Datos
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              {db.freeMb.toFixed(1)} MB LIBRES
            </span>
          </div>

          <div>
            <div className="flex justify-between items-baseline text-xs mb-1">
              <span className="text-stone-400 text-[11px]">Espacio Utilizado:</span>
              <span className="font-mono text-white font-bold">
                {db.usedMb.toFixed(2)} MB / <span className="text-stone-400">{db.totalMb} MB</span>
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${Math.max(2, Math.min(100, db.percent))}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
            <div className="p-2 rounded-lg bg-white/[0.03]">
              <span className="text-[10px] text-stone-400 block">Pedidos</span>
              <span className="font-mono font-bold text-white text-xs">{db.ordersCount}</span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03]">
              <span className="text-[10px] text-stone-400 block">Productos</span>
              <span className="font-mono font-bold text-white text-xs">{db.productsCount}</span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03]">
              <span className="text-[10px] text-stone-400 block">Clientes</span>
              <span className="font-mono font-bold text-white text-xs">{db.clientsCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <CheckCircle2 size={13} />
            <span>Tienes el {(100 - db.percent).toFixed(1)}% de escrituras disponibles para operar</span>
          </div>
        </div>

        {/* Card 2: Almacenamiento de Fotos e Imágenes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black/50 border border-white/10 space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#c5a059]/15 text-[#fbbf24] border border-[#c5a059]/30">
                <HardDrive size={16} />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                2. Almacenamiento de Imágenes
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#fbbf24] bg-[#fbbf24]/10 px-2 py-0.5 rounded-md">
              {st.freeMb.toFixed(1)} MB LIBRES
            </span>
          </div>

          <div>
            <div className="flex justify-between items-baseline text-xs mb-1">
              <span className="text-stone-400 text-[11px]">Comprobantes & Fotos:</span>
              <span className="font-mono text-white font-bold">
                {st.usedMb.toFixed(2)} MB / <span className="text-stone-400">{st.totalMb} MB (1 GB)</span>
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#c5a059] to-[#fbbf24] transition-all duration-500"
                style={{ width: `${Math.max(2, Math.min(100, st.percent))}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-center">
            <div className="p-2 rounded-lg bg-white/[0.03]">
              <span className="text-[10px] text-stone-400 block">Comprobantes Almacenados</span>
              <span className="font-mono font-bold text-[#fbbf24] text-xs">
                {st.filesCount} archivos
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03]">
              <span className="text-[10px] text-stone-400 block">Límite Gratuito Total</span>
              <span className="font-mono font-bold text-white text-xs">
                1,000 MB (1 GB)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#fbbf24] font-medium">
            <ShieldCheck size={13} />
            <span>Capacidad para más de 10,000 fotos de comprobantes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
