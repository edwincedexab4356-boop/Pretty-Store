import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Code2,
  X,
  ArrowUpRight,
  Database,
  Layers,
  Camera,
  UploadCloud,
  Smartphone,
  Loader2,
  FileText,
} from 'lucide-react';
import { Novedad } from '../../../types/database';
import {
  getAdminNovedades,
  createAdminNovedad,
  updateAdminNovedad,
  toggleNovedadVisibility,
  deleteAdminNovedad,
  deleteAllAdminNovedades,
  uploadNovedadImageToStorage,
  checkSupabaseNovedadesStatus,
} from '../../../services/adminService';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const NOVEDADES_SQL_SCRIPT = `-- ========================================================
-- PRETTY STORE · TABLA DE NOVEDADES Y POLÍTICAS EN SUPABASE
-- Pega este script completo en el SQL Editor de tu Supabase y presiona "RUN"
-- ========================================================

-- 1. Crear tabla de novedades
CREATE TABLE IF NOT EXISTS public.novedades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT,
  subtitulo TEXT,
  descripcion TEXT,
  badge TEXT DEFAULT 'NOVEDAD',
  imagen_url TEXT NOT NULL,
  enlace_url TEXT DEFAULT '#catalogo',
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.1 Si la tabla ya fue creada anteriormente, asegurar que exista la columna 'descripcion'
ALTER TABLE public.novedades ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- 2. Conceder permisos explícitos al rol anon y authenticated (SOLUCIONA ERROR 42501 permission denied)
GRANT ALL ON TABLE public.novedades TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Habilitar Seguridad por Fila (RLS)
ALTER TABLE public.novedades ENABLE ROW LEVEL SECURITY;

-- 4. Recrear política permisiva unificada para lectura y escritura pública
DROP POLICY IF EXISTS "Permitir lectura publica de novedades" ON public.novedades;
DROP POLICY IF EXISTS "Permitir insercion de novedades" ON public.novedades;
DROP POLICY IF EXISTS "Permitir actualizacion de novedades" ON public.novedades;
DROP POLICY IF EXISTS "Permitir eliminacion de novedades" ON public.novedades;
DROP POLICY IF EXISTS "Acceso total novedades" ON public.novedades;

CREATE POLICY "Acceso total novedades" 
ON public.novedades 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

-- 5. Índice para optimizar orden y velocidad
CREATE INDEX IF NOT EXISTS idx_novedades_activo_orden 
ON public.novedades (activo, orden ASC, created_at DESC);

-- 6. Crear bucket de almacenamiento en Supabase Storage (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('novedades', 'novedades', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- 7. Políticas de acceso para el bucket 'novedades' en Storage
DROP POLICY IF EXISTS "Public Access Novedades" ON storage.objects;
DROP POLICY IF EXISTS "Upload Novedades" ON storage.objects;
DROP POLICY IF EXISTS "Update Novedades" ON storage.objects;
DROP POLICY IF EXISTS "Delete Novedades" ON storage.objects;

CREATE POLICY "Public Access Novedades"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'novedades');

CREATE POLICY "Upload Novedades"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'novedades');

CREATE POLICY "Update Novedades"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'novedades');

CREATE POLICY "Delete Novedades"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'novedades');
`;

export const NovedadesView: React.FC = () => {
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Novedad | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Referencias a los inputs de archivo del dispositivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickUploadInputRef = useRef<HTMLInputElement>(null);

  // Campos del formulario
  const [formTitulo, setFormTitulo] = useState('');
  const [formSubtitulo, setFormSubtitulo] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formBadge, setFormBadge] = useState('NOVEDAD');
  const [formImagenUrl, setFormImagenUrl] = useState('');
  const [formEnlaceUrl, setFormEnlaceUrl] = useState('#catalogo');
  const [formOrden, setFormOrden] = useState(1);
  const [formActivo, setFormActivo] = useState(true);

  // Modal Confirmar Eliminación
  const [itemToDelete, setItemToDelete] = useState<Novedad | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal SQL
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedColSql, setCopiedColSql] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    checked: boolean;
    tableExists: boolean;
    bucketExists: boolean;
  }>({ checked: false, tableExists: false, bucketExists: false });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [data, status] = await Promise.all([
        getAdminNovedades(),
        checkSupabaseNovedadesStatus().catch(() => ({ tableExists: false, bucketExists: false })),
      ]);
      setNovedades(data);
      if (status) {
        setSupabaseStatus({ checked: true, ...status });
      }
    } catch {
      showToast('Error al cargar las novedades', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdated = () => {
      loadData();
    };

    window.addEventListener('novedades-updated', handleUpdated);
    window.addEventListener('focus', handleUpdated);

    return () => {
      window.removeEventListener('novedades-updated', handleUpdated);
      window.removeEventListener('focus', handleUpdated);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    showToast('Novedades actualizadas');
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormTitulo('');
    setFormSubtitulo('');
    setFormDescripcion('');
    setFormBadge('NOVEDAD');
    setFormImagenUrl('');
    setFormEnlaceUrl('#catalogo');
    setFormOrden(novedades.length + 1);
    setFormActivo(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Novedad) => {
    setEditingItem(item);
    setFormTitulo(item.titulo || '');
    setFormSubtitulo(item.subtitulo || '');
    setFormDescripcion(item.descripcion || '');
    setFormBadge(item.badge || 'NOVEDAD');
    setFormImagenUrl(item.imagen_url || '');
    setFormEnlaceUrl(item.enlace_url || '#catalogo');
    setFormOrden(item.orden || 1);
    setFormActivo(item.activo);
    setIsModalOpen(true);
  };

  // Procesar archivo seleccionado desde el dispositivo
  const processUploadedFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP, HEIC).', 'error');
      return;
    }

    try {
      setIsUploadingImage(true);
      setUploadStatusText('Optimizando foto desde tu dispositivo...');
      const url = await uploadNovedadImageToStorage(file);
      setFormImagenUrl(url);
      showToast('¡Foto cargada desde tu dispositivo con éxito!');
    } catch (err: any) {
      showToast('Error al subir la imagen: ' + (err?.message || 'Error desconocido'), 'error');
    } finally {
      setIsUploadingImage(false);
      setUploadStatusText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (quickUploadInputRef.current) quickUploadInputRef.current.value = '';
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processUploadedFile(file);
    }
  };

  // Botón directo "Subir foto desde dispositivo" en la barra superior
  const handleQuickUploadFromDevice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Inicializar modal con la foto cargada
    setEditingItem(null);
    const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setFormTitulo(fileNameClean.charAt(0).toUpperCase() + fileNameClean.slice(1));
    setFormSubtitulo('Disponible ahora en Pretty Store');
    setFormBadge('NUEVO DROP');
    setFormEnlaceUrl('#catalogo');
    setFormOrden(novedades.length + 1);
    setFormActivo(true);
    setIsModalOpen(true);

    await processUploadedFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processUploadedFile(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formImagenUrl.trim()) {
      showToast('Debes agregar o subir una imagen para la novedad.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<Novedad> = {
        titulo: formTitulo.trim() || null,
        subtitulo: formSubtitulo.trim() || null,
        descripcion: formDescripcion.trim() || null,
        badge: formBadge.trim() || 'NOVEDAD',
        imagen_url: formImagenUrl.trim(),
        enlace_url: formEnlaceUrl.trim() || '#catalogo',
        orden: Number(formOrden) || 1,
        activo: formActivo,
      };

      if (editingItem) {
        const updated = await updateAdminNovedad(editingItem.id, payload);
        setNovedades((prev) => {
          const next = prev.map((n) => (n.id === editingItem.id ? updated : n));
          return next.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
        });
        showToast('Novedad actualizada correctamente.');
      } else {
        const created = await createAdminNovedad(payload);
        setNovedades((prev) => {
          const next = [...prev.filter((n) => n.id !== created.id), created];
          return next.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
        });
        showToast('Nueva novedad guardada con éxito.');
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast('Error al guardar: ' + (err?.message || 'Error desconocido'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleVisibility = async (item: Novedad) => {
    const nextState = !item.activo;
    setNovedades((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, activo: nextState } : n))
    );
    try {
      await toggleNovedadVisibility(item.id, nextState);
      showToast(
        nextState
          ? `Novedad "${item.titulo || 'Elemento'}" ahora es visible en la tienda.`
          : `Novedad "${item.titulo || 'Elemento'}" ahora está oculta.`
      );
    } catch {
      showToast('Error al cambiar visibilidad', 'error');
      await loadData();
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const target = itemToDelete;
    setIsDeleting(true);
    try {
      await deleteAdminNovedad(target.id, target.imagen_url);
      setNovedades((prev) => prev.filter((n) => n.id !== target.id));
      showToast(`Novedad eliminada de Supabase y su imagen eliminada de Storage.`);
    } catch (err: any) {
      showToast('Error al eliminar: ' + (err?.message || 'Error'), 'error');
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('¿Seguro que deseas eliminar todas las novedades y fotos? Podrás subir tus fotos desde cero.')) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAllAdminNovedades();
      setNovedades([]);
      showToast('Se han eliminado todas las fotos y novedades con éxito.');
    } catch {
      showToast('Error al vaciar las novedades', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(NOVEDADES_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
    showToast('Código SQL copiado al portapapeles.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold shadow-lg animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-white p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d0d11] p-4 rounded-2xl border border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/30">
              <Sparkles size={18} />
            </span>
            <div>
              <h3 className="font-serif-luxury font-bold text-white text-base sm:text-lg">
                Apartado de Novedades & Banners
              </h3>
              <p className="text-[11px] text-stone-400 font-light">
                Carrusel deslizante infinito visible en la página principal. Controla imágenes, estado visible/oculto y orden.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          {/* Input oculto para subida directa desde el dispositivo */}
          <input
            type="file"
            ref={quickUploadInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleQuickUploadFromDevice}
          />
          <button
            type="button"
            onClick={() => quickUploadInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl border border-emerald-500/40 hover:border-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Subir foto directamente desde tu galería o cámara"
          >
            <Smartphone size={14} className="text-emerald-400" />
            <span>Subir Foto de Mi Dispositivo</span>
          </button>

          {novedades.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="px-3 py-2 rounded-xl border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Eliminar todas las novedades y fotos"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Vaciar Todo</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSqlModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-[#c5a059]/40 hover:border-[#c5a059] bg-[#c5a059]/10 hover:bg-[#c5a059]/20 text-[#c5a059] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Ver código SQL para crear la tabla y bucket en Supabase"
          >
            <Code2 size={14} />
            <span className="hidden sm:inline">Código SQL Supabase</span>
            <span className="sm:hidden">SQL</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 text-stone-300 hover:text-white text-xs transition-colors cursor-pointer"
            title="Refrescar novedades"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-[#c5a059]' : ''} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#b5914a] hover:from-[#d5b069] hover:to-[#c5a059] text-black text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-[#c5a059]/20 cursor-pointer active:scale-95"
          >
            <Plus size={15} />
            <span>Nueva Novedad</span>
          </button>
        </div>
      </div>

      {/* Supabase Status Banner */}
      {supabaseStatus.checked && !supabaseStatus.tableExists && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 text-amber-200 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
          <div className="flex items-start gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 mt-0.5">
              <Database size={18} />
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-black uppercase tracking-wider">
                  Acción requerida en Supabase
                </span>
                <span className="font-bold text-white text-sm">
                  Falta crear la tabla de Novedades en tu Base de Datos
                </span>
              </div>
              <p className="text-stone-300 leading-relaxed text-xs max-w-3xl">
                Tus novedades se están guardando localmente en tu navegador mediante <strong>IndexedDB</strong>, pero para que no dependan del navegador y se sincronicen de inmediato con todos tus clientes y dispositivos, necesitas ejecutar el script SQL en tu consola de Supabase.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={handleCopySql}
              className="px-4 py-2.5 rounded-xl bg-[#c5a059] text-black hover:bg-[#d5b069] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md w-full md:w-auto text-xs active:scale-95"
            >
              {copiedSql ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedSql ? '¡SQL Copiado!' : 'Copiar Código SQL'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSqlModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/10 text-xs"
            >
              <Code2 size={14} />
              <span>Ver Pasos</span>
            </button>
          </div>
        </div>
      )}

      {supabaseStatus.checked && supabaseStatus.tableExists && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>
              <strong>Base de datos Supabase conectada:</strong> Tus novedades y fotos están sincronizadas en la nube para todos los visitantes.
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
            Cloud Sync Activo
          </span>
        </div>
      )}

      {/* Banner de migración de columna descripcion para Supabase */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-400/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <FileText size={16} className="text-amber-400 shrink-0" />
          <div>
            <span className="font-bold text-white block">
              ¿Deseas sincronizar las descripciones con Supabase?
            </span>
            <span className="text-stone-300 text-[11px]">
              Tus descripciones ya se guardan en el servidor. Para que también persistan en tu Supabase Cloud, ejecuta: <code className="text-amber-300 font-mono font-semibold bg-black/50 px-1.5 py-0.5 rounded">ALTER TABLE public.novedades ADD COLUMN IF NOT EXISTS descripcion TEXT;</code>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText('ALTER TABLE public.novedades ADD COLUMN IF NOT EXISTS descripcion TEXT;');
            setCopiedColSql(true);
            setTimeout(() => setCopiedColSql(false), 2500);
            showToast('Línea SQL para Supabase copiada.');
          }}
          className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 font-bold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer active:scale-95"
        >
          {copiedColSql ? <Check size={13} /> : <Copy size={13} />}
          <span>{copiedColSql ? '¡SQL Copiado!' : 'Copiar SQL Columna'}</span>
        </button>
      </div>

      {/* Info Pill */}

      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-300">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-[#c5a059] shrink-0" />
          <span>
            Total: <strong>{novedades.length}</strong> novedades registradas (
            <strong className="text-emerald-400">{novedades.filter((n) => n.activo).length} visibles</strong> al público,{' '}
            <strong className="text-stone-400">{novedades.filter((n) => !n.activo).length} ocultas</strong>).
          </span>
        </div>
        <div className="text-[11px] text-stone-400 font-mono">
          Deslizamiento continuo 24/7 en bucle infinito
        </div>
      </div>

      {/* Grid of Novelties */}
      {isLoading ? (
        <div className="p-12 text-center text-stone-400">
          <RefreshCw size={24} className="animate-spin text-[#c5a059] mx-auto mb-2" />
          <span>Cargando novedades...</span>
        </div>
      ) : novedades.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0d0d11] border border-white/10 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] mx-auto">
            <Sparkles size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-white font-serif-luxury font-bold text-base">No hay novedades registradas</h4>
            <p className="text-xs text-stone-400 font-light">
              Crea tu primera novedad o banner para que se deslice en el carrusel infinito de la tienda.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            <Plus size={15} />
            <span>Crear Primera Novedad</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {novedades.map((item) => {
            const isSupabaseHosted = item.imagen_url && item.imagen_url.includes('/storage/v1/object/public/');

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative group ${
                  item.activo
                    ? 'bg-[#0d0d11] border-white/10 hover:border-[#c5a059]/50 shadow-lg'
                    : 'bg-black/40 border-white/5 opacity-75'
                }`}
              >
                {/* Top Image Preview */}
                <div className="relative aspect-[16/10] overflow-hidden bg-black/80">
                  <img
                    src={item.imagen_url}
                    alt={item.titulo || 'Novedad'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/logo/logotipo.jpeg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#c5a059] text-black shadow-md font-mono">
                      {item.badge || 'NOVEDAD'}
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/70 text-stone-300 border border-white/10 backdrop-blur-sm">
                      Orden #{item.orden}
                    </span>
                  </div>

                  {/* Status Overlay Badge */}
                  <div className="absolute bottom-3 left-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md ${
                        item.activo
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-stone-800/80 border-stone-600/40 text-stone-400'
                      }`}
                    >
                      {item.activo ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>{item.activo ? 'Visible al Público' : 'Oculto'}</span>
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h4 className="font-serif-luxury font-bold text-white text-base leading-snug line-clamp-1">
                      {item.titulo || '(Sin título)'}
                    </h4>
                    {item.subtitulo && (
                      <p className="text-xs text-stone-300 font-light line-clamp-1 leading-relaxed">
                        {item.subtitulo}
                      </p>
                    )}
                    {item.descripcion && (
                      <p className="text-[11px] text-amber-300/80 font-light line-clamp-2 leading-relaxed bg-amber-400/5 p-2 rounded-lg border border-amber-400/10">
                        <span className="text-amber-400 font-semibold block text-[9px] uppercase tracking-wider">Descripción al dar click:</span>
                        {item.descripcion}
                      </p>
                    )}
                  </div>

                  {/* Metadata & Actions */}
                  <div className="pt-3 border-t border-white/5 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span className="truncate max-w-[170px]" title={item.enlace_url || '#catalogo'}>
                        Enlace: <strong className="text-stone-300 font-mono">{item.enlace_url || '#catalogo'}</strong>
                      </span>
                      {isSupabaseHosted && (
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          Supabase Storage
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {/* Toggle Visibility */}
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(item)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          item.activo
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                        }`}
                        title={item.activo ? 'Ocultar esta novedad' : 'Hacer visible esta novedad'}
                      >
                        {item.activo ? <EyeOff size={13} /> : <Eye size={13} />}
                        <span>{item.activo ? 'Ocultar' : 'Mostrar'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                          title="Editar novedad"
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                          title="Eliminar de Supabase y Storage"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Crear / Editar Novedad */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#100f14] border border-white/15 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#c5a059]/20 text-[#c5a059]">
                  <Sparkles size={16} />
                </span>
                <h3 className="font-serif-luxury font-bold text-white text-base">
                  {editingItem ? 'Editar Novedad / Banner' : 'Nueva Novedad para Carrusel Infinito'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="overflow-y-auto p-4 sm:p-6 space-y-4 text-left">
              {/* Imagen (Subir desde dispositivo o URL) */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-white font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Smartphone size={14} className="text-[#c5a059]" />
                    <span>1. Foto de la Novedad *</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-normal normal-case flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Desde tu móvil o PC
                  </span>
                </label>

                {/* Input de archivo nativo conectado al ref */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                  disabled={isUploadingImage}
                />

                {/* Vista previa si ya hay imagen */}
                {formImagenUrl ? (
                  <div className="space-y-2.5">
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-amber-400/30 bg-black shadow-lg">
                      <img
                        src={formImagenUrl}
                        alt="Vista previa de novedad"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-black/80 backdrop-blur-md text-[#fbbf24] border border-amber-400/40">
                          {formBadge || 'NOVEDAD'}
                        </span>
                      </div>

                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white z-20">
                          <Loader2 size={26} className="text-[#c5a059] animate-spin" />
                          <span className="text-xs font-semibold">{uploadStatusText || 'Subiendo imagen...'}</span>
                        </div>
                      )}
                    </div>

                    {/* Botones de acción visibles (compatibles con pantallas táctiles) */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#c5a059]/15 hover:bg-[#c5a059]/25 border border-[#c5a059]/40 text-[#c5a059] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                      >
                        <Smartphone size={15} />
                        <span>Cambiar Foto del Dispositivo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormImagenUrl('')}
                        className="py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        title="Quitar foto"
                      >
                        <Trash2 size={14} />
                        <span>Quitar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Zona de carga y selección de archivo desde el dispositivo */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center gap-3 transition-all text-center ${
                      isDragOver
                        ? 'border-amber-400 bg-amber-400/10 scale-[1.01]'
                        : 'border-white/20 hover:border-[#c5a059]/80 bg-white/[0.02] hover:bg-[#c5a059]/5'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] shadow-inner">
                      {isUploadingImage ? (
                        <Loader2 size={26} className="animate-spin text-[#c5a059]" />
                      ) : (
                        <UploadCloud size={28} />
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">
                        {isUploadingImage
                          ? uploadStatusText || 'Procesando y optimizando imagen...'
                          : 'Elige una foto de tu celular o computadora'}
                      </p>
                      <p className="text-xs text-stone-400 font-light max-w-xs mx-auto">
                        Abre tu galería o toma una foto directa con tu cámara. Formatos JPG, PNG, WEBP o HEIC.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="mt-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#b5914a] hover:from-[#d5b069] hover:to-[#c5a059] text-black text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#c5a059]/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Camera size={16} />
                      <span>Seleccionar Foto de Mi Dispositivo</span>
                    </button>
                  </div>
                )}

                {/* Input de URL directa opcional */}
                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="O pega directamente un enlace web de imagen..."
                      value={formImagenUrl}
                      onChange={(e) => setFormImagenUrl(e.target.value)}
                      className="w-full px-3.5 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059]"
                    />
                  </div>
                </div>
              </div>

              {/* Título y Subtítulo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs text-stone-300 font-medium">Título Principal</label>
                  <input
                    type="text"
                    placeholder="Ej. Colección Boston 2026"
                    value={formTitulo}
                    onChange={(e) => setFormTitulo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-stone-300 font-medium">Etiqueta / Badge</label>
                  <input
                    type="text"
                    placeholder="Ej. NOVEDAD, DROP, EXCLUSIVO"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-stone-600 uppercase font-mono focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-stone-300 font-medium flex items-center justify-between">
                  <span>Subtítulo Corto (se ve sobre la foto)</span>
                  <span className="text-[10px] text-stone-500">Ej. Gorras exclusivas de edición limitada</span>
                </label>
                <input
                  type="text"
                  placeholder="Frase breve visible sobre la foto..."
                  value={formSubtitulo}
                  onChange={(e) => setFormSubtitulo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Descripción detallada al hacer click */}
              <div className="space-y-1 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-400/20">
                <label className="text-xs text-amber-300 font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText size={14} className="text-amber-400" />
                    <span>Descripción Detallada (Se muestra al dar click en la novedad)</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
                    Popup Modal
                  </span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Escribe la descripción completa: historia del modelo, materiales, colores disponibles, instrucciones o detalles que el cliente podrá leer al tocar la novedad en la tienda..."
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2.5 bg-black/70 border border-amber-400/20 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 leading-relaxed resize-y font-light"
                />
              </div>

              {/* Orden y Enlace */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-stone-300 font-medium">Orden de Posición</label>
                  <input
                    type="number"
                    min={1}
                    value={formOrden}
                    onChange={(e) => setFormOrden(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#c5a059] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-stone-300 font-medium">Enlace de Destino al Tocar</label>
                  <input
                    type="text"
                    placeholder="#catalogo o URL externa"
                    value={formEnlaceUrl}
                    onChange={(e) => setFormEnlaceUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              {/* Visibilidad Switch (Oculto vs Visible) */}
              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">Estado de Visibilidad</span>
                  <span className="text-[11px] text-stone-400 font-light block">
                    {formActivo
                      ? 'Visible al público en el carrusel infinito de la tienda'
                      : 'Oculto (no se mostrará a los clientes)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormActivo(!formActivo)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    formActivo
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                      : 'bg-stone-800 text-stone-400 hover:text-white'
                  }`}
                >
                  {formActivo ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{formActivo ? 'Visible' : 'Oculto'}</span>
                </button>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-stone-300 hover:text-white text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#b5914a] hover:from-[#d5b069] hover:to-[#c5a059] text-black text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#c5a059]/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingItem ? 'Actualizar Novedad' : 'Guardar en Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ver y Copiar Código SQL Supabase */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#100f14] border border-white/15 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/60">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#c5a059]/20 text-[#c5a059]">
                  <Database size={16} />
                </span>
                <div>
                  <h3 className="font-serif-luxury font-bold text-white text-base">
                    Script SQL para Supabase (Tabla Novedades & Storage)
                  </h3>
                  <span className="text-[10px] text-stone-400">
                    Copia y pega este script en el SQL Editor de tu consola de Supabase
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* SQL Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-left">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                <span className="text-base">💡</span>
                <div className="space-y-0.5">
                  <strong className="block text-white">Instrucciones de instalación:</strong>
                  <p className="text-[11px] text-stone-300 leading-relaxed font-light">
                    1. Entra a tu proyecto en <strong>Supabase.com</strong> → Menú izquierdo <strong>SQL Editor</strong>.
                    <br />
                    2. Haz clic en <strong>New Query</strong>, pega el código que tienes abajo y presiona <strong>Run</strong>.
                    <br />
                    3. Esto creará la tabla <code className="text-[#fbbf24] font-mono">public.novedades</code>, las políticas RLS y el bucket de almacenamiento público para tus fotos.
                  </p>
                </div>
              </div>

              {/* Code Box */}
              <div className="relative rounded-2xl bg-black border border-white/10 overflow-hidden font-mono text-[11px] text-stone-300">
                <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                  <span className="text-stone-400">supabase_novedades_schema.sql</span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-3 py-1 rounded-lg bg-[#c5a059] hover:bg-[#b5914a] text-black font-sans font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-transform active:scale-95"
                  >
                    {copiedSql ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto max-h-[48vh] leading-relaxed text-stone-300 scrollbar-thin">
                  {NOVEDADES_SQL_SCRIPT}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
              <span className="text-[11px] text-stone-400">
                ¿Dudas? Todo se sincroniza automáticamente con el panel.
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-5 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedSql ? '¡Código Copiado!' : 'Copiar Código SQL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación */}
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title={`¿Eliminar Novedad "${itemToDelete?.titulo || 'Seleccionada'}"?`}
        description="Se eliminará permanentemente de la base de datos de Supabase y su imagen se borrará automáticamente de Supabase Storage para no ocupar espacio."
        confirmText="Eliminar de Supabase"
        cancelText="Conservar"
        isDeleting={isDeleting}
      />
    </div>
  );
};
