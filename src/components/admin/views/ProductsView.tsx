import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Upload,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  DollarSign,
  Boxes,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Star,
  FileSpreadsheet,
  HelpCircle,
  Video,
  Play,
} from 'lucide-react';
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  toggleProductActive,
  updateProductStock,
  getAdminCategories,
  uploadProductImageToSupabase,
  PROJECT_MEDIA_OPTIONS,
} from '../../../services/adminService';
import { Producto, Categoria } from '../../../types/database';
import { getProductImages, isVideoMedia } from '../../../utils/productImages';
import { isPermissionError } from '../../../utils/supabaseSqlFix';
import { PermissionErrorBanner } from '../PermissionErrorBanner';

interface ProductsViewProps {
  onOpenSqlFix?: (actionDesc?: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ onOpenSqlFix }) => {
  const [products, setProducts] = useState<Producto[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'out_of_stock'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [isDeleting, setIsDeleting] = useState<Producto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showBulkGuide, setShowBulkGuide] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number | string>('');
  const [formCost, setFormCost] = useState<number | string>('');
  const [formStock, setFormStock] = useState<number | string>(10);
  const [formCategory, setFormCategory] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formActive, setFormActive] = useState(true);

  // File upload state
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline stock editing
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number>(0);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        getAdminProducts(),
        getAdminCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al cargar productos.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormCost('');
    setFormStock(10);
    setFormCategory(categories[0]?.id || '');
    setFormImageUrl('');
    setFormImages([]);
    setFormActive(true);
    setIsModalOpen(true);
    setActionMessage(null);
  };

  const openEditModal = (prod: Producto) => {
    setEditingProduct(prod);
    setFormName(prod.nombre);
    setFormDescription(prod.descripcion || '');
    setFormPrice(prod.precio);
    setFormCost(prod.costo || 0);
    setFormStock(prod.stock);
    setFormCategory(prod.categoria_id);
    const parsedImages = getProductImages(prod);
    setFormImages(parsedImages);
    setFormImageUrl(parsedImages[0] || prod.imagen_url || '');
    setFormActive(prod.activo);
    setIsModalOpen(true);
    setActionMessage(null);
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const rawFiles = Array.from(files);
    const validFiles: File[] = [];
    const oversizedVideos: File[] = [];

    for (const f of rawFiles) {
      const isVid = f.type.startsWith('video/') || f.name.match(/\.(mp4|webm|mov|m4v|mkv|avi)$/i);
      if (isVid && f.size > 10 * 1024 * 1024) {
        oversizedVideos.push(f);
      } else {
        validFiles.push(f);
      }
    }

    if (oversizedVideos.length > 0) {
      const names = oversizedVideos
        .map((f) => `"${f.name}" (${(f.size / (1024 * 1024)).toFixed(1)}MB)`)
        .join(', ');
      setActionMessage({
        type: 'error',
        text: `No se permite agregar videos mayores de 10MB: ${names}. Para mantener la tienda rápida y evitar lentitud al guardar, solo se aceptan videos de hasta 10MB.`,
      });

      if (validFiles.length === 0) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    setIsUploadingFiles(true);
    setUploadProgressText(`Preparando ${validFiles.length} archivo(s)...`);

    const newUrls: string[] = [];
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const url = await uploadProductImageToSupabase(file, (status) => {
          setUploadProgressText(`(${i + 1}/${validFiles.length}): ${status}`);
        });
        newUrls.push(url);
      }

      setFormImages((prev) => [...prev, ...newUrls]);
      if (!formImageUrl && newUrls.length > 0) {
        setFormImageUrl(newUrls[0]);
      }

      setActionMessage({
        type: 'success',
        text: `¡${newUrls.length} archivo(s) guardados exitosamente en Supabase Storage!`,
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Error al procesar archivos: ${err?.message || 'Verifica los permisos en Supabase'}`,
      });
    } finally {
      setIsUploadingFiles(false);
      setUploadProgressText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetPrimaryImage = (index: number) => {
    setFormImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
  };

  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddManualImageUrl = () => {
    if (!formImageUrl.trim()) return;
    if (!formImages.includes(formImageUrl.trim())) {
      setFormImages((prev) => [...prev, formImageUrl.trim()]);
    }
    setFormImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCategory || formPrice === '') {
      setActionMessage({ type: 'error', text: 'Nombre, categoría y precio son obligatorios.' });
      return;
    }

    const finalImages = [...formImages];
    if (formImageUrl.trim() && !finalImages.includes(formImageUrl.trim())) {
      finalImages.push(formImageUrl.trim());
    }

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        const updated = await updateAdminProduct(editingProduct.id, {
          nombre: formName,
          descripcion: formDescription,
          precio: Number(formPrice),
          costo: Number(formCost) || 0,
          stock: Number(formStock) || 0,
          categoria_id: formCategory,
          imagen_url: finalImages[0] || '',
          imagenes: finalImages,
          activo: formActive,
        });

        // Actualización optimista inmediata en interfaz (sin congelar modal)
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  ...updated,
                  imagen_url: finalImages[0] || '',
                  imagenes: finalImages,
                  categoria: categories.find((c) => c.id === formCategory) || p.categoria,
                }
              : p
          )
        );

        setActionMessage({ type: 'success', text: '¡Producto actualizado al instante en Supabase!' });
      } else {
        const created = await createAdminProduct({
          nombre: formName,
          descripcion: formDescription,
          precio: Number(formPrice),
          costo: Number(formCost) || 0,
          stock: Number(formStock) || 0,
          categoria_id: formCategory,
          imagen_url: finalImages[0] || '',
          imagenes: finalImages,
          activo: formActive,
        });

        // Inserción optimista inmediata
        const cat = categories.find((c) => c.id === formCategory);
        setProducts((prev) => [
          {
            ...created,
            categoria: cat,
            imagen_url: finalImages[0] || '',
            imagenes: finalImages,
          },
          ...prev,
        ]);

        setActionMessage({ type: 'success', text: '¡Producto creado y guardado en Supabase a máxima velocidad!' });
      }

      setIsModalOpen(false);
      // Sincronización en segundo plano sin bloquear al usuario
      loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al guardar producto.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (prod: Producto) => {
    try {
      await toggleProductActive(prod.id, !prod.activo);
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, activo: !p.activo } : p))
      );
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al cambiar estado.' });
    }
  };

  const handleSaveStock = async (prodId: string) => {
    try {
      await updateProductStock(prodId, tempStockValue);
      setProducts((prev) =>
        prev.map((p) => (p.id === prodId ? { ...p, stock: tempStockValue } : p))
      );
      setEditingStockId(null);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al guardar stock.' });
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) return;
    try {
      const result = await deleteAdminProduct(isDeleting.id);
      if (result.softDeleted) {
        setActionMessage({
          type: 'success',
          text: `El producto tiene pedidos históricos asociados. Se desactivó (activo = false) para proteger el historial.`,
        });
      } else {
        setActionMessage({ type: 'success', text: 'Producto eliminado definitivamente de Supabase.' });
      }
      setIsDeleting(null);
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al eliminar producto.' });
    }
  };

  // Filtered list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || p.categoria_id === selectedCategory;

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = p.activo;
    if (statusFilter === 'inactive') matchesStatus = !p.activo;
    if (statusFilter === 'out_of_stock') matchesStatus = p.stock <= 0;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification / Permission Alert */}
      {actionMessage && isPermissionError(actionMessage.text) ? (
        <PermissionErrorBanner
          errorMessage={actionMessage.text}
          onOpenFixModal={() => onOpenSqlFix?.('Permisos en tabla productos')}
          onDismiss={() => setActionMessage(null)}
        />
      ) : actionMessage ? (
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
            <X size={14} />
          </button>
        </div>
      ) : null}

      {/* Header and Controls */}
      <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#c5a059] font-medium block mb-1">
            Inventario Maestro
          </span>
          <h2 className="text-xl sm:text-2xl font-serif-luxury font-semibold text-white tracking-wide">
            Catálogo de Productos ({filteredProducts.length})
          </h2>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Gestión de catálogo, activos multimedia (fotos y videos) y existencias en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={() => setShowBulkGuide(true)}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 font-medium text-xs border border-white/[0.08] flex items-center justify-center gap-2 cursor-pointer transition-colors"
            title="Cómo cargar tus 500 productos"
          >
            <HelpCircle size={15} />
            <span>Guía 500 Productos</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-medium text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Plus size={16} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#c5a059] transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e12] border border-white/10 text-xs text-stone-200 focus:outline-none focus:border-[#c5a059] cursor-pointer transition-colors"
          >
            <option value="all">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e12] border border-white/10 text-xs text-stone-200 focus:outline-none focus:border-[#c5a059] cursor-pointer transition-colors"
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Solo Activos (En Tienda)</option>
            <option value="inactive">Solo Inactivos (Ocultos)</option>
            <option value="out_of_stock">Solo Agotados (Stock 0)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#c5a059] flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-[#c5a059]" />
            <span>Sincronizando con Supabase...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400 space-y-3">
            <Package size={36} className="mx-auto text-stone-600 mb-2" />
            <p className="font-semibold text-white text-sm">No hay productos que coincidan</p>
            <p className="text-stone-500 max-w-sm mx-auto font-light">
              Haz clic en "Nuevo Producto" para registrar tu primer artículo con fotos y precio.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-2 px-4 py-2 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-medium text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus size={14} />
              <span>Registrar Producto</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-stone-400 uppercase text-[10px] font-medium border-b border-white/[0.06]">
                <tr>
                  <th className="py-3.5 px-4">Producto</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Precio</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Image & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {p.imagen_url ? (
                          <img
                            src={p.imagen_url}
                            alt={p.nombre}
                            className="w-11 h-11 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-800"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                            <Package size={18} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate max-w-[200px]">
                            {p.nombre}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                            {p.descripcion || 'Sin descripción'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-slate-300">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                        {p.categoria?.nombre || 'General'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {formatMoney(p.precio)}
                    </td>

                    {/* Stock Quick Edit */}
                    <td className="py-3 px-4">
                      {editingStockId === p.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={tempStockValue}
                            onChange={(e) => setTempStockValue(Number(e.target.value))}
                            className="w-16 px-2 py-1 bg-slate-950 border border-amber-500 rounded text-xs text-white font-mono"
                          />
                          <button
                            onClick={() => handleSaveStock(p.id)}
                            className="p-1 bg-amber-500 text-slate-950 rounded hover:bg-amber-400 cursor-pointer"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setEditingStockId(null)}
                            className="p-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold ${
                              p.stock <= 0
                                ? 'text-rose-400'
                                : p.stock <= 5
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {p.stock}
                          </span>
                          <button
                            onClick={() => {
                              setEditingStockId(p.id);
                              setTempStockValue(p.stock);
                            }}
                            className="text-[10px] text-slate-500 hover:text-amber-400 cursor-pointer"
                            title="Modificar stock"
                          >
                            (Editar)
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          p.activo
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                        }`}
                        title="Haz clic para activar o desactivar"
                      >
                        {p.activo ? (
                          <>
                            <Eye size={12} />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} />
                            <span>Inactivo</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Editar producto"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setIsDeleting(p)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                          title="Eliminar producto"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl lg:max-w-4xl p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                  {editingProduct ? 'Modificar Producto' : 'Nuevo Registro'}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-serif-luxury">
                  {editingProduct ? 'Editar Producto' : 'Agregar Producto a la Tienda'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Gorra Edición Limitada New Era / Reloj Cronógrafo"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Descripción & Detalles</label>
                  <textarea
                    rows={2}
                    placeholder="Materiales, detalles de costura, características y observaciones..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Precio de Venta ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="35.00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Costo ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="15.00"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoría *</label>
                  <select
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="">Selecciona categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Stock Disponible *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Carrusel de Imágenes y Videos: Subida desde Archivos y Supabase Storage */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                      <span>Galería / Carrusel ({formImages.length} fotos y videos)</span>
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-normal">
                        Fotos + Videos permitidos
                      </span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Puedes subir fotos (.jpg, .png) y videos (.mp4, .webm, máx. 10MB) desde tus archivos.
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono">
                    Supabase Storage
                  </span>
                </div>

                {/* Botón de Carga de Archivos */}
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.mp4,.webm,.mov,.m4v"
                    onChange={handleFilesSelected}
                    className="hidden"
                    id="product-images-input"
                  />
                  <label
                    htmlFor="product-images-input"
                    className={`flex-1 py-3 px-4 rounded-xl border border-dashed text-center cursor-pointer transition-all flex items-center justify-center gap-2 ${
                      isUploadingFiles
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-slate-700 hover:border-amber-500/60 bg-slate-900/60 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isUploadingFiles ? (
                      <>
                        <RefreshCw size={15} className="animate-spin text-amber-400" />
                        <span className="text-xs font-medium">{uploadProgressText}</span>
                      </>
                    ) : (
                      <>
                        <Upload size={15} className="text-amber-400" />
                        <span className="text-xs font-medium">
                          + Seleccionar Fotos o Videos desde tus Archivos
                        </span>
                      </>
                    )}
                  </label>
                </div>

                {/* Galería de imágenes y videos cargados */}
                {formImages.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Elementos en el Carrusel (La primera será la portada de tienda):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {formImages.map((mediaUrl, idx) => {
                        const isVid = isVideoMedia(mediaUrl);
                        return (
                          <div
                            key={idx}
                            className={`relative rounded-xl overflow-hidden border p-1.5 flex flex-col justify-between group ${
                              idx === 0
                                ? 'border-amber-500/80 bg-amber-500/5'
                                : 'border-slate-800 bg-slate-900'
                            }`}
                          >
                            <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black mb-1.5 flex items-center justify-center">
                              {isVid ? (
                                <video
                                  src={mediaUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={mediaUrl}
                                  alt={`Media ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              )}

                              {/* Badges */}
                              <div className="absolute top-1 left-1 flex items-center gap-1">
                                {idx === 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-slate-950 flex items-center gap-0.5 shadow">
                                    <Star size={10} fill="currentColor" />
                                    <span>Portada</span>
                                  </span>
                                )}
                                {isVid && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/80 text-amber-400 flex items-center gap-0.5 border border-white/20">
                                    <Video size={10} />
                                    <span>Video</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-1 text-[10px]">
                              {idx !== 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(idx)}
                                  className="text-amber-400 hover:underline cursor-pointer"
                                >
                                  Hacer Portada
                                </button>
                              ) : (
                                <span className="text-slate-500 font-mono">#1 Portada</span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="p-1 rounded text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                                title="Quitar elemento"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Opción alternativa: URL directa o seleccionar archivo del proyecto */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="O pega una URL de imagen o video (.mp4, YouTube, etc.)..."
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-[11px] placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualImageUrl}
                      disabled={!formImageUrl.trim()}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-medium cursor-pointer disabled:opacity-40"
                    >
                      Añadir
                    </button>
                  </div>

                  {PROJECT_MEDIA_OPTIONS.products.length > 0 && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Del proyecto:</span>
                      <select
                        value={formImageUrl}
                        onChange={(e) => {
                          if (e.target.value && !formImages.includes(e.target.value)) {
                            setFormImages((prev) => [...prev, e.target.value]);
                          }
                          setFormImageUrl('');
                        }}
                        className="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Añadir foto local a la lista --</option>
                        {PROJECT_MEDIA_OPTIONS.products.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Estado Activo */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="font-semibold text-white block">Estado Activo</span>
                  <span className="text-[11px] text-slate-400">
                    Determina si los clientes pueden ver y comprar este producto
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Guardando en Supabase...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Guardar Cambios' : 'Crear Producto'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GUÍA PARA 500 PRODUCTOS */}
      {showBulkGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-serif-luxury">
                    Guía para tus ~500 Productos
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Tu tienda está lista y vacía, esperando únicamente tus productos reales.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowBulkGuide(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>Catálogo Limpio (0 productos de prueba)</span>
                </p>
                <p className="text-[11px] text-emerald-400/90">
                  Cumpliendo tu indicación, no se agregaron productos ficticios. Todo lo que cargues será tuyo.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-amber-400">
                  Opción 1: Carga desde este Panel (Recomendado)
                </h4>
                <p className="text-slate-400">
                  Haz clic en <strong>"+ Agregar Producto"</strong>. Podrás seleccionar múltiples fotos y videos (.mp4, .webm, .mov) desde tus archivos. Las fotos y videos se guardan automáticamente en el Storage de Supabase y crean el carrusel interactivo multimedia con reproductor de video en la tienda.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-amber-400">
                  Opción 2: Carga Masiva (CSV / Excel)
                </h4>
                <p className="text-slate-400">
                  Si ya tienes los 500 productos en un archivo Excel o CSV, puedes importarlos de un solo clic desde tu panel de <strong>Supabase &gt; Table Editor &gt; productos &gt; Insert &gt; Import data from CSV</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px]">
                <span className="text-slate-400 block font-bold text-white font-sans">
                  Columnas que usa la tabla 'productos':
                </span>
                <code className="text-amber-400 block break-all">
                  nombre, descripcion, precio, costo, stock, categoria_id, imagen_url, activo
                </code>
                <p className="text-[10px] text-slate-500 font-sans mt-1">
                  Nota: En <code className="text-slate-400">imagen_url</code> puedes poner una URL o un arreglo JSON con varias fotos y videos (ej: <code className="text-slate-400">["https://...foto1.jpg", "https://...video.mp4"]</code>) para activar el carrusel con fotos y video integrado.
                </p>
              </div>

              <div className="space-y-1 text-slate-400 text-[11px]">
                <p className="font-semibold text-white">📦 Supabase Storage:</p>
                <p>
                  Asegúrate de que en tu proyecto Supabase tengas creado el bucket público llamado <code className="text-amber-300">productos</code> para alojar las fotos de tus 500 artículos con acceso público de lectura.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowBulkGuide(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-serif-luxury">
              ¿Eliminar producto?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Estás a punto de eliminar <strong>"{isDeleting.nombre}"</strong>. Si este producto ya tiene pedidos realizados por clientes, se realizará una <em>eliminación lógica</em> (quedará oculto e inactivo) para proteger el historial de compras.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeleting(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
