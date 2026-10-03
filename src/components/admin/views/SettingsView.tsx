import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Video,
  Upload,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Shield,
  ShieldCheck,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Globe,
  CreditCard,
  Lock,
  Smartphone,
  Building2,
  Zap,
  Gauge,
  Activity,
  HardDrive,
  Database,
  Table,
  FolderOpen,
} from 'lucide-react';
import { useStoreConfig } from '../../../context/StoreConfigContext';
import {
  PROJECT_MEDIA_OPTIONS,
  DEFAULT_STORE_CONFIG,
  checkDatabaseHealth,
  optimizeHeavyProduct,
  uploadProductImageToSupabase,
  checkSupabaseStorageAndLimits,
  SupabaseQuotaReport,
} from '../../../services/adminService';
import { SUPABASE_FIX_SQL } from '../../../utils/supabaseSqlFix';

interface SettingsViewProps {
  onOpenQuotaModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenQuotaModal }) => {
  const { config, updateConfig, resetToDefault, isLoading } = useStoreConfig();

  // Local form state initialized from config
  const [nombre, setNombre] = useState(config.nombre_tienda);
  const [descripcion, setDescripcion] = useState(config.descripcion);
  const [logoUrl, setLogoUrl] = useState(config.logo_url);
  const [heroVideoUrl, setHeroVideoUrl] = useState(config.hero_video_url);
  const [catalogVideoUrl, setCatalogVideoUrl] = useState(config.catalog_video_url || '');
  const [telefono, setTelefono] = useState(config.telefono);
  const [whatsapp, setWhatsapp] = useState(config.whatsapp);
  const [email, setEmail] = useState(config.email);
  const [direccion, setDireccion] = useState(config.direccion);
  const [instagram, setInstagram] = useState(config.instagram || '');
  const [tiktok, setTiktok] = useState(config.tiktok || 'https://www.tiktok.com/@tienda_prettystore?_r=1&_t=ZS-9A8sgqEMvKS');
  const [facebook, setFacebook] = useState(config.facebook || '');
  const [twitter, setTwitter] = useState(config.twitter || '');

  // Payment settings state
  const [yappyNumero, setYappyNumero] = useState(config.yappy_numero || '6215-0251');
  const [bancoDatos, setBancoDatos] = useState(
    config.banco_datos ||
      'Banco General - Cuenta Corriente #0472985946850 a nombre de JESUS ALEJANDRO CARDONA ESCOBAR'
  );
  const [pasarelaTarjeta, setPasarelaTarjeta] = useState(config.pasarela_tarjeta || 'PagueloFacil');
  const [linkPagoTarjeta, setLinkPagoTarjeta] = useState(config.link_pago_tarjeta || 'https://checkout.paguelofacil.com/W_F9464GL');
  const [badgeGarantiaTitulo, setBadgeGarantiaTitulo] = useState(config.badge_garantia_titulo || 'Pieza Exclusiva Pretty-Store');
  const [badgeGarantiaSubtitulo, setBadgeGarantiaSubtitulo] = useState(config.badge_garantia_subtitulo || 'Acabados de primera calidad y empaque de colección.');

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Speed & Health diagnostics
  const [speedDiagnostic, setSpeedDiagnostic] = useState<{
    latencyMs: number;
    totalProducts: number;
    heavyProducts: { id: string | number; nombre: string; payloadSizeKB: number; hasLargeBase64: boolean }[];
    totalPayloadKB: number;
  } | null>(null);
  const [quotaReport, setQuotaReport] = useState<SupabaseQuotaReport | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    checkSupabaseStorageAndLimits()
      .then((rep) => setQuotaReport(rep))
      .catch(() => {});
  }, []);

  // Hero Video Upload
  const [isUploadingHeroVideo, setIsUploadingHeroVideo] = useState(false);
  const [heroVideoUploadText, setHeroVideoUploadText] = useState('');

  const handleHeroVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Límite estricto de 10MB para videos
    if (file.size > 10 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setActionMessage({
        type: 'error',
        text: `El video "${file.name}" supera el límite máximo permitido de 10MB (${sizeMB}MB). No se permite agregar videos mayores de 10MB para mantener la tienda ultra rápida y evitar saturación.`,
      });
      e.target.value = '';
      return;
    }

    setIsUploadingHeroVideo(true);
    setHeroVideoUploadText(`Subiendo video (${(file.size / (1024 * 1024)).toFixed(1)}MB) a Supabase Storage...`);
    try {
      const cdnUrl = await uploadProductImageToSupabase(file, (msg) => {
        setHeroVideoUploadText(msg);
      });
      setHeroVideoUrl(cdnUrl);
      await updateConfig({ hero_video_url: cdnUrl });
      setActionMessage({
        type: 'success',
        text: '¡Video subido exitosamente a Supabase Storage y aplicado a la tienda!',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Error al subir el video a Supabase Storage.',
      });
    } finally {
      setIsUploadingHeroVideo(false);
      setHeroVideoUploadText('');
      e.target.value = '';
    }
  };

  const runSpeedDiagnostic = async () => {
    setIsDiagnosing(true);
    try {
      const [result, quota] = await Promise.all([
        checkDatabaseHealth(),
        checkSupabaseStorageAndLimits(),
      ]);
      setSpeedDiagnostic(result);
      setQuotaReport(quota);

      if (quota.isApproachingLimit) {
        setActionMessage({
          type: 'error',
          text: quota.message,
        });
      } else if (result.heavyProducts.length === 0) {
        setActionMessage({
          type: 'success',
          text: `Base de datos óptima: respuesta ultra rápida de ${result.latencyMs}ms. Storage usado: ${quota.storageUsedMB} MB (${quota.storagePercent}% de 1GB).`,
        });
      } else {
        setActionMessage({
          type: 'error',
          text: `Se detectaron ${result.heavyProducts.length} producto(s) pesados que ralentizan la carga y el guardado.`,
        });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: 'Error al diagnosticar: ' + e?.message });
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleOptimizeProduct = async (id: string | number) => {
    setIsOptimizing(true);
    try {
      const ok = await optimizeHeavyProduct(id);
      if (ok) {
        setActionMessage({
          type: 'success',
          text: 'Producto optimizado con éxito. Supabase ahora responderá a máxima velocidad.',
        });
        runSpeedDiagnostic();
      } else {
        setActionMessage({ type: 'error', text: 'No se pudo optimizar este producto.' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: 'Error al optimizar: ' + e?.message });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateConfig({
        nombre_tienda: nombre,
        descripcion,
        logo_url: logoUrl,
        hero_video_url: heroVideoUrl,
        catalog_video_url: catalogVideoUrl,
        telefono,
        whatsapp,
        email,
        direccion,
        instagram,
        tiktok,
        facebook,
        twitter,
        yappy_numero: yappyNumero,
        banco_datos: bancoDatos,
        pasarela_tarjeta: pasarelaTarjeta,
        link_pago_tarjeta: linkPagoTarjeta,
        badge_garantia_titulo: badgeGarantiaTitulo,
        badge_garantia_subtitulo: badgeGarantiaSubtitulo,
      });

      if (res.syncedToSupabase) {
        setActionMessage({
          type: 'success',
          text: '¡Configuración guardada exitosamente y sincronizada en Supabase (tabla "configuracion")!',
        });
      } else {
        setActionMessage({
          type: 'success',
          text: `Configuración guardada en la tienda. ${res.error ? `Aviso de base de datos: ${res.error}` : 'Recuerda ejecutar el Script SQL en Supabase para persistir permanentemente en la nube'}.`,
        });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al guardar configuración.' });
    }
  };

  const handleApplyHeroVideo = async () => {
    try {
      await updateConfig({ hero_video_url: heroVideoUrl });
      setActionMessage({
        type: 'success',
        text: 'Ruta del video Hero aplicada exitosamente a la tienda.',
      });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al aplicar video.' });
    }
  };

  const handleRestoreDefaultVideo = async () => {
    const def = '/videos/WhatsApp Video 2026-09-26 at 15.05.22.mp4';
    setHeroVideoUrl(def);
    await updateConfig({ hero_video_url: def });
    setActionMessage({
      type: 'success',
      text: 'Video de portada restablecido al video oficial cargado.',
    });
  };

  const sqlScript = SUPABASE_FIX_SQL;

  const copySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      {/* Toast Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="p-1 hover:bg-black/20 rounded cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#c5a059] font-medium block mb-1">
            Configuración General
          </span>
          <h2 className="text-xl sm:text-2xl font-serif-luxury font-semibold text-white tracking-wide">
            Parámetros de la Boutique & Video Hero
          </h2>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Identidad de marca, medios de contacto, pasarelas de pago para Panamá y video cinemático.
          </p>
        </div>
      </div>

      {/* SECCIÓN 1: VIDEO DEL HERO */}
      <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/20 flex items-center justify-center text-[#c5a059]">
              <Video size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif-luxury font-semibold text-white">
                Video Principal del Hero
              </h3>
              <p className="text-xs text-stone-400 font-light">
                Administra el video cinemático de fondo de la portada de la tienda.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRestoreDefaultVideo}
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-stone-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Video Original</span>
          </button>
        </div>

        {/* Video Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 relative shadow-2xl">
            <video
              src={heroVideoUrl || '/videos/hero.mp4'}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-amber-400 font-mono">
              Ruta activa: {heroVideoUrl || '/videos/hero.mp4'}
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-semibold">
                  Ruta del Video Hero
                </label>
                <span className="text-[10px] text-amber-400 font-mono">
                  public/videos/hero.mp4
                </span>
              </div>
              <input
                type="text"
                value={heroVideoUrl}
                onChange={(e) => setHeroVideoUrl(e.target.value)}
                placeholder="/videos/hero.mp4"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Subir video nuevo a Supabase Storage con límite de 10MB */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                  <Upload size={13} className="text-[#c5a059]" />
                  <span>Subir Video a Supabase Storage</span>
                </label>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
                  Máximo 10MB
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-light">
                Sube un video (.mp4 o .webm) de hasta 10MB directamente a Supabase Storage CDN.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <label
                  htmlFor="hero-video-upload"
                  className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    isUploadingHeroVideo
                      ? 'bg-white/10 text-stone-400 cursor-not-allowed'
                      : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10'
                  }`}
                >
                  {isUploadingHeroVideo ? (
                    <RefreshCw size={13} className="animate-spin text-[#c5a059]" />
                  ) : (
                    <Upload size={13} className="text-[#c5a059]" />
                  )}
                  <span>
                    {isUploadingHeroVideo
                      ? heroVideoUploadText || 'Subiendo a Supabase Storage...'
                      : 'Seleccionar Video (Máx 10MB)'}
                  </span>
                </label>
                <input
                  id="hero-video-upload"
                  type="file"
                  accept="video/*,.mp4,.webm,.mov"
                  disabled={isUploadingHeroVideo}
                  onChange={handleHeroVideoUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">
                O seleccionar video existente del proyecto:
              </label>
              <select
                value={heroVideoUrl}
                onChange={(e) => setHeroVideoUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="/videos/hero.mp4">Video Principal (/videos/hero.mp4)</option>
                {PROJECT_MEDIA_OPTIONS.videos.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <span className="text-amber-400 font-semibold block">
                🎥 Video del proyecto (sin Supabase Storage):
              </span>
              <p>
                El archivo principal debe colocarse en <code className="text-amber-300">public/videos/hero.mp4</code>. Si cambias de video, colócalo en <code className="text-amber-300">public/videos/</code> e introduce su ruta relativa arriba.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleApplyHeroVideo}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all"
              >
                Aplicar Video a la Tienda
              </button>
            </div>

            {/* Configurar Video de Fondo del Catálogo / Productos */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-slate-300 font-semibold">
                  Video Opcional para el Catálogo
                </label>
                {catalogVideoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogVideoUrl('');
                      updateConfig({ catalog_video_url: '' });
                    }}
                    className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Quitar video
                  </button>
                )}
              </div>
              <input
                type="text"
                value={catalogVideoUrl}
                onChange={(e) => setCatalogVideoUrl(e.target.value)}
                onBlur={() => updateConfig({ catalog_video_url: catalogVideoUrl })}
                placeholder="/videos/hero.mp4"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-500">
                Ruta relativa de video existente en el proyecto.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: INFORMACIÓN GENERAL */}
      <form onSubmit={handleSaveGeneral} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Store size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-serif-luxury">
              Datos Generales de la Tienda
            </h3>
            <p className="text-xs text-slate-400">
              Nombre comercial, logotipo, teléfonos de contacto y redes sociales.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nombre Comercial</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-300 font-semibold">
                Ruta del Logotipo
              </label>
              <span className="text-[10px] text-amber-400 font-mono">
                public/images/logo/
              </span>
            </div>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="/images/logo/logo.png"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
            />
            <div className="mt-2 flex items-center gap-2">
              <select
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-amber-500 font-mono cursor-pointer"
              >
                <option value="/images/logo/logotipo.jpeg">Logotipo Oficial (/images/logo/logotipo.jpeg)</option>
                {PROJECT_MEDIA_OPTIONS.logo.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Ubicado en <code className="text-amber-400">public/images/logo/logo.png</code>. Sin Supabase Storage.
            </p>
          </div>
        </div>

        <div className="text-xs">
          <label className="block text-slate-300 font-semibold mb-1">Descripción / Slogan de la Marca</label>
          <textarea
            rows={2}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Phone size={13} className="text-amber-400" />
              <span>Teléfono</span>
            </label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Phone size={13} className="text-emerald-400" />
              <span>WhatsApp de Ventas</span>
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Mail size={13} className="text-sky-400" />
              <span>Correo Electrónico</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="text-xs">
          <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
            <MapPin size={13} className="text-rose-400" />
            <span>Dirección Física</span>
          </label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Instagram</label>
            <input
              type="url"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-[11px] focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">TikTok</label>
            <input
              type="url"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              placeholder="https://www.tiktok.com/@..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-[11px] focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Facebook</label>
            <input
              type="url"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-[11px] focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Twitter / X</label>
            <input
              type="url"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="https://x.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-[11px] focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* SECCIÓN 2.5: CONFIGURACIÓN DE PASARELAS DE PAGO Y TARJETA */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-amber-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Cobro con Tarjeta en Panamá (Visa / Mastercard) y Métodos de Pago
            </h4>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-slate-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                <Lock size={13} />
                <span>¿Cómo activar cobros con tarjeta en tu tienda para Panamá?</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                Pasarelas Oficiales
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              En tu tienda los clientes ya pueden ingresar los datos de su tarjeta (Número, Titular, Vencimiento, CVV) y la orden se guarda de forma segura con los 4 últimos dígitos en tu apartado de <strong>Pedidos</strong>. Para procesar el cobro bancario real en Panamá, puedes conectar cualquiera de estas 4 opciones oficiales:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-bold text-white block text-xs">1. PágueloFácil (Panamá)</span>
                <p className="text-slate-400 text-[10px]">
                  La pasarela líder en Panamá. Permite cobrar con Visa, Mastercard, Clave y Yappy Comercial. Deposita directo a tu cuenta de banco local.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-bold text-white block text-xs">2. Tilopay</span>
                <p className="text-slate-400 text-[10px]">
                  Acepta tarjetas internacionales y se conecta con BAC Credomatic, Banistmo y bancos de Panamá y Centroamérica.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-bold text-white block text-xs">3. Cuanto App Panamá</span>
                <p className="text-slate-400 text-[10px]">
                  La más rápida para empezar hoy mismo. Creas tu cuenta en 5 minutos y generas links de cobro con tarjeta para tus clientes.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-bold text-white block text-xs">4. Stripe / Payment Links</span>
                <p className="text-slate-400 text-[10px]">
                  Si tienes cuenta de Stripe o empresa internacional, puedes pegar tu Payment Link oficial o clave pública.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Smartphone size={13} className="text-amber-400" />
                <span>Número o Usuario de Yappy Comercial</span>
              </label>
              <input
                type="text"
                value={yappyNumero}
                onChange={(e) => setYappyNumero(e.target.value)}
                placeholder="6402-8245 o @prettystore"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Se muestra al cliente cuando selecciona Yappy en el checkout.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <CreditCard size={13} className="text-amber-400" />
                <span>Pasarela de Tarjeta Predilecta</span>
              </label>
              <select
                value={pasarelaTarjeta}
                onChange={(e) => setPasarelaTarjeta(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="PagueloFacil">PágueloFácil (Panamá - Recomendado)</option>
                <option value="Tilopay">Tilopay (Panamá & Centroamérica)</option>
                <option value="CuantoApp">Cuanto App Panamá</option>
                <option value="Stripe">Stripe Payment Link</option>
                <option value="POS">Terminal POS / Link de Cobro Directo</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <CreditCard size={13} className="text-amber-400" />
                <span>Enlace de Pago con Tarjeta (Opcional - Stripe Link, Cuanto o PágueloFácil)</span>
              </label>
              <input
                type="url"
                value={linkPagoTarjeta}
                onChange={(e) => setLinkPagoTarjeta(e.target.value)}
                placeholder="https://buy.stripe.com/... o https://cuanto.app/... (Opcional)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Si colocas un enlace, el cliente tendrá la opción de pagar directamente en tu pasarela externa además del checkout interno.
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Building2 size={13} className="text-amber-400" />
                <span>Datos Bancarios para Transferencias ACH</span>
              </label>
              <textarea
                rows={2}
                value={bancoDatos}
                onChange={(e) => setBancoDatos(e.target.value)}
                placeholder="Banco General - Cuenta Corriente #0472985946850 a nombre de JESUS ALEJANDRO CARDONA ESCOBAR"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Distintivo y Garantía del Producto (Personalizable) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldCheck size={18} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white">
              Distintivo y Garantía del Producto (Reemplazo de 100% Original)
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Personaliza el texto de garantía y autenticidad que ven tus clientes en cada producto (anteriormente decía "100% Original"). Puedes escribir lo que desees mostrar aquí.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Título del Distintivo
              </label>
              <input
                type="text"
                value={badgeGarantiaTitulo}
                onChange={(e) => setBadgeGarantiaTitulo(e.target.value)}
                placeholder="Ej. Pieza Exclusiva Pretty-Store"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Subtítulo o Descripción del Distintivo
              </label>
              <input
                type="text"
                value={badgeGarantiaSubtitulo}
                onChange={(e) => setBadgeGarantiaSubtitulo(e.target.value)}
                placeholder="Ej. Acabados de primera calidad y empaque de colección."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-medium text-xs shadow-lg shadow-[#c5a059]/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Save size={15} />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>

      {/* SECCIÓN 3: DIAGNÓSTICO DE VELOCIDAD & SUPABASE STORAGE */}
      <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/20 flex items-center justify-center text-[#c5a059]">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif-luxury font-semibold text-white flex items-center gap-2">
                <span>Rendimiento & Velocidad Supabase</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-sans">
                  Optimizado
                </span>
              </h3>
              <p className="text-xs text-stone-400 font-light">
                Compresión instantánea en navegador y almacenamiento en CDN para guardar en menos de 0.5s.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={runSpeedDiagnostic}
            disabled={isDiagnosing}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#c5a059] border border-white/[0.08] text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            <Gauge size={14} className={isDiagnosing ? 'animate-spin' : ''} />
            <span>{isDiagnosing ? 'Midiendo Latencia...' : 'Test de Velocidad'}</span>
          </button>
        </div>

        {/* Resultados del diagnóstico si se ha ejecutado */}
        {speedDiagnostic && (
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-3 font-mono text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-stone-400 block font-sans">TIEMPO RESPUESTA</span>
                <span className={`text-base font-semibold ${speedDiagnostic.latencyMs < 500 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {speedDiagnostic.latencyMs} ms
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-stone-400 block font-sans">TOTAL PRODUCTOS</span>
                <span className="text-base font-semibold text-[#c5a059]">
                  {speedDiagnostic.totalProducts}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-stone-400 block font-sans">CARGA TOTAL DB</span>
                <span className={`text-base font-semibold ${speedDiagnostic.totalPayloadKB < 500 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {speedDiagnostic.totalPayloadKB} KB
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-stone-400 block font-sans">ITEMS PESADOS</span>
                <span className={`text-base font-semibold ${speedDiagnostic.heavyProducts.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {speedDiagnostic.heavyProducts.length}
                </span>
              </div>
            </div>

            {speedDiagnostic.heavyProducts.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
                <p className="font-semibold text-xs flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  <span>Productos con contenido multimedia no optimizado detectados:</span>
                </p>
                <div className="space-y-1.5">
                  {speedDiagnostic.heavyProducts.map((hp) => (
                    <div key={hp.id} className="flex items-center justify-between text-[11px] bg-black/60 p-2 rounded-lg border border-white/10">
                      <span>{hp.nombre} — {hp.payloadSizeKB} KB</span>
                      <button
                        type="button"
                        onClick={() => handleOptimizeProduct(hp.id)}
                        disabled={isOptimizing}
                        className="px-2.5 py-1 rounded bg-[#c5a059] hover:bg-[#b5914a] text-black font-medium text-[10px] transition-colors"
                      >
                        {isOptimizing ? 'Optimizando...' : 'Optimizar Ahora'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Almacenamiento de Tablas y Storage en Supabase (Siempre visible y en tiempo real) */}
        {quotaReport ? (
          <div className="p-4 sm:p-5 rounded-xl bg-black/40 border border-white/[0.08] space-y-4 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#c5a059]/10 text-[#c5a059]">
                  <HardDrive size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>Almacenamiento de Tablas y Storage</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      quotaReport.status === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : quotaReport.status === 'alert'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {quotaReport.status === 'optimal' ? 'Capacidad Óptima' : `${quotaReport.storagePercent}% Usado`}
                    </span>
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Monitoreo en vivo del consumo en Supabase Free Tier (1 GB Storage CDN + 500 MB Base de Datos)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    checkSupabaseStorageAndLimits()
                      .then((rep) => setQuotaReport(rep))
                      .catch(() => {});
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Actualizar mediciones de Storage y Tablas"
                >
                  <RefreshCw size={12} />
                  <span>Actualizar</span>
                </button>
                {onOpenQuotaModal && (
                  <button
                    type="button"
                    onClick={onOpenQuotaModal}
                    className="px-3 py-1.5 rounded-lg bg-[#c5a059]/15 hover:bg-[#c5a059]/25 text-[#c5a059] border border-[#c5a059]/30 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Ver Monitor Detallado →</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dos Medidores Principales: Storage CDN y Base de Datos PostgreSQL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Storage CDN */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <FolderOpen size={14} className="text-[#c5a059]" />
                    <span>Storage CDN (Archivos & Multimedia)</span>
                  </span>
                  <span className="font-mono font-bold text-stone-200">
                    {quotaReport.storageUsedMB} MB / {quotaReport.storageLimitMB} MB ({quotaReport.storagePercent}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      quotaReport.storagePercent > 80
                        ? 'bg-rose-500'
                        : quotaReport.storagePercent > 60
                        ? 'bg-amber-500'
                        : 'bg-[#c5a059]'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, quotaReport.storagePercent))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span>{quotaReport.storageFileCount} archivos alojados</span>
                  <span className="text-emerald-400 font-mono">
                    {(quotaReport.storageLimitMB - quotaReport.storageUsedMB).toFixed(1)} MB libres
                  </span>
                </div>
              </div>

              {/* Base de Datos PostgreSQL */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Database size={14} className="text-emerald-400" />
                    <span>Base de Datos (Filas de Tablas)</span>
                  </span>
                  <span className="font-mono font-bold text-stone-200">
                    {quotaReport.databaseTotalKB} KB / {quotaReport.databaseLimitMB} MB ({quotaReport.databasePercent}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(1, quotaReport.databasePercent))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span>{quotaReport.totalRecords} registros en total</span>
                  <span className="text-emerald-400 font-mono">
                    {(quotaReport.databaseLimitMB - quotaReport.databaseTotalMB).toFixed(1)} MB libres
                  </span>
                </div>
              </div>
            </div>

            {/* Desglose individual de cada tabla */}
            {quotaReport.databaseTables && quotaReport.databaseTables.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Almacenamiento detallado por tabla:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {quotaReport.databaseTables.map((t) => (
                    <div key={t.name} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                      <span className="text-[11px] font-mono font-medium text-amber-300 block truncate">
                        {t.name}
                      </span>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-stone-300 font-mono font-bold">{t.rows}</span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {t.sizeKB > 0 ? `${t.sizeKB} KB` : '0 KB'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-300">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
            <h4 className="text-white font-medium text-xs flex items-center gap-1.5 text-[#c5a059]">
              <span>✓ Compresión Inteligente en Navegador</span>
            </h4>
            <p className="text-[11px] text-stone-400 leading-relaxed font-light">
              Cada foto seleccionada desde tu teléfono o computadora se reduce en el acto de 5MB–10MB a menos de 150KB sin perder nitidez, permitiendo que guardar o editar tome solo milisegundos.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
            <h4 className="text-white font-medium text-xs flex items-center gap-1.5 text-emerald-400">
              <span>✓ Bucket de Imágenes CDN: product-images</span>
            </h4>
            <p className="text-[11px] text-stone-400 leading-relaxed font-light">
              Las imágenes se direccionan al bucket <code>product-images</code> de Supabase Storage para cargarse desde el CDN global, evitando saturar la base de datos PostgreSQL con datos binarios.
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: SUPABASE RLS SCRIPT HELPER */}
      <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif-luxury font-semibold text-white">
                Seguridad y Políticas RLS en Supabase
              </h3>
              <p className="text-xs text-stone-400 font-light">
                Script SQL con permisos separados para la tienda pública y el administrador.
              </p>
            </div>
          </div>

          <button
            onClick={copySql}
            className="px-3.5 py-2 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedSql ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            <span>{copiedSql ? 'Copiado' : 'Copiar Script SQL'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Si al guardar pedidos o productos en Supabase recibes el error <code>42501 (violates row-level security policy)</code>, copia el siguiente script y ejecútalo en la pestaña <strong>SQL Editor</strong> de tu proyecto Supabase:
        </p>

        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto">
          <pre>{sqlScript}</pre>
        </div>
      </div>
    </div>
  );
};
