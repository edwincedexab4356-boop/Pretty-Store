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
import { uploadMediaFile, DEFAULT_STORE_CONFIG } from '../../../services/adminService';
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

  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingCatalogVideo, setIsUploadingCatalogVideo] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    try {
      const publicUrl = await uploadMediaFile('site-assets', file);
      setHeroVideoUrl(publicUrl);
      await updateConfig({ hero_video_url: publicUrl });
      setActionMessage({
        type: 'success',
        text: 'Video subido exitosamente a Supabase Storage y configurado en el Hero.',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `${err.message} Puedes pegar una URL directa de video MP4 en el campo de texto.`,
      });
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleCatalogVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCatalogVideo(true);
    try {
      const publicUrl = await uploadMediaFile('site-assets', file);
      setCatalogVideoUrl(publicUrl);
      await updateConfig({ catalog_video_url: publicUrl });
      setActionMessage({
        type: 'success',
        text: 'Video de fondo para el catálogo subido exitosamente.',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `${err.message} Puedes pegar una URL directa de video MP4 en el campo de texto.`,
      });
    } finally {
      setIsUploadingCatalogVideo(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const publicUrl = await uploadMediaFile('site-assets', file);
      setLogoUrl(publicUrl);
      await updateConfig({ logo_url: publicUrl });
      setActionMessage({
        type: 'success',
        text: 'Logo subido exitosamente a Supabase Storage.',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `${err.message} Puedes ingresar una URL directa de logo.`,
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRestoreDefaultVideo = async () => {
    const def = DEFAULT_STORE_CONFIG.hero_video_url;
    setHeroVideoUrl(def);
    await updateConfig({ hero_video_url: def });
    setActionMessage({
      type: 'success',
      text: 'Video de fondo restaurado al video original de respaldo.',
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
              src={heroVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-amber-400 font-mono">
              Vista previa en vivo
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                URL del Video (MP4)
              </label>
              <input
                type="url"
                value={heroVideoUrl}
                onChange={(e) => setHeroVideoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <span className="block text-slate-300 font-semibold mb-1">
                Subir Video al bucket <code className="text-amber-400">site-assets</code>
              </span>
              <label className="w-full py-3 px-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all text-amber-400 font-semibold">
                <Upload size={16} className={isUploadingVideo ? 'animate-bounce' : ''} />
                <span>
                  {isUploadingVideo ? 'Subiendo video a site-assets...' : 'Seleccionar video (.mp4, .webm - máx. 50 MB)'}
                </span>
                <input
                  type="file"
                  accept=".mp4,.webm,video/mp4,video/webm"
                  onChange={handleVideoUpload}
                  disabled={isUploadingVideo}
                  className="hidden"
                />
              </label>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Formatos: MP4, WEBM (máx. 50 MB). El video se reproduce a pantalla completa en la portada de la tienda.
            </p>

            {/* Configurar Video de Fondo del Catálogo / Productos */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-slate-300 font-semibold">
                  Video de Fondo de la Sección de Productos (Catálogo)
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
              <div className="flex gap-2">
                <input
                  type="url"
                  value={catalogVideoUrl}
                  onChange={(e) => setCatalogVideoUrl(e.target.value)}
                  onBlur={() => updateConfig({ catalog_video_url: catalogVideoUrl })}
                  placeholder="https://... (video .mp4 de fondo para el catálogo)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
                />
                <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer flex items-center gap-1.5 border border-slate-700 text-xs">
                  <Upload size={14} className={isUploadingCatalogVideo ? 'animate-bounce text-amber-400' : ''} />
                  <span className="hidden sm:inline">Subir Video</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/*"
                    onChange={handleCatalogVideoUpload}
                    disabled={isUploadingCatalogVideo}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[11px] text-slate-500">
                Este video se reproducirá suavemente en bucle y con efecto de contraste detrás de tus gorras y productos.
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
            <label className="block text-slate-300 font-semibold mb-1">
              Logotipo (bucket <code className="text-amber-400">site-assets</code>)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
              />
              <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer flex items-center gap-1.5 border border-slate-700">
                <Upload size={14} className={isUploadingLogo ? 'animate-bounce text-amber-400' : ''} />
                <span className="hidden sm:inline">Subir</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  disabled={isUploadingLogo}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Formatos: JPG, PNG, WEBP, SVG (máx. 50 MB).
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
