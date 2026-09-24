import React, { useState } from 'react';
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
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Globe,
} from 'lucide-react';
import { useStoreConfig } from '../../../context/StoreConfigContext';
import { PROJECT_MEDIA_OPTIONS, DEFAULT_STORE_CONFIG } from '../../../services/adminService';
import { SUPABASE_FIX_SQL } from '../../../utils/supabaseSqlFix';

export const SettingsView: React.FC = () => {
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
  const [facebook, setFacebook] = useState(config.facebook || '');
  const [twitter, setTwitter] = useState(config.twitter || '');

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateConfig({
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
        facebook,
        twitter,
      });
      setActionMessage({
        type: 'success',
        text: 'Configuración guardada exitosamente y aplicada a la tienda.',
      });
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
    const def = '/videos/WhatsApp Video 2026-09-23 at 23.53.18.mp4';
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-luxury">
          Configuración General & Video Hero
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Personaliza los datos corporativos de la tienda, canales de contacto y el video de presentación del hero.
        </p>
      </div>

      {/* SECCIÓN 1: VIDEO DEL HERO */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Video size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-serif-luxury">
                Video Principal del Hero (Fase 1)
              </h3>
              <p className="text-xs text-slate-400">
                Administra el video cinemático de fondo de la portada de la tienda.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRestoreDefaultVideo}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
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

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">
                Seleccionar video existente del proyecto:
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
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

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Save size={15} />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>

      {/* SECCIÓN 3: SUPABASE RLS SCRIPT HELPER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-serif-luxury">
                Seguridad y Políticas RLS en Supabase
              </h3>
              <p className="text-xs text-slate-400">
                Script SQL con permisos separados para la tienda pública y el administrador.
              </p>
            </div>
          </div>

          <button
            onClick={copySql}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedSql ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            <span>{copiedSql ? 'Copiado al portapapeles' : 'Copiar Script SQL'}</span>
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
