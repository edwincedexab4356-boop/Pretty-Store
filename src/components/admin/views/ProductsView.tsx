import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
  ArrowLeft,
  ArrowRight,
  HardDrive,
  Sparkles,
} from 'lucide-react';
import { Producto, Categoria, ProductoOpcion } from '../../../types/database';
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminCategories,
  uploadProductImageToStorage,
} from '../../../services/adminService';
import {
  getProductImages,
  getPrimaryProductImage,
  hasProductRealImage,
} from '../../../utils/productImages';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<Producto[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'priceAsc' | 'priceDesc'>('newest');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState('25.00');
  const [formCost, setFormCost] = useState('0.00');
  const [formStock, setFormStock] = useState('10');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formGallery, setFormGallery] = useState<string[]>([]);
  const [formActive, setFormActive] = useState(true);
  const [formOptions, setFormOptions] = useState<ProductoOpcion[]>([]);

  // Image Upload State
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [p, c] = await Promise.all([getAdminProducts(), getAdminCategories()]);
      setProducts(p);
      setCategories(c);
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
    setFormCategory(categories[0]?.id || '');
    setFormPrice('25.00');
    setFormCost('0.00');
    setFormStock('10');
    setFormDescription('');
    setFormImageUrl('');
    setFormGallery([]);
    setFormOptions([]);
    setFormActive(true);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Producto) => {
    setEditingProduct(p);
    setFormName(p.nombre);
    setFormCategory(p.categoria_id || '');
    setFormPrice(p.precio.toString());
    setFormCost(p.costo.toString());
    setFormStock(p.stock.toString());
    setFormDescription(p.descripcion || '');
    const allProdImages = getProductImages(p);
    const primaryImg = allProdImages[0] || '';
    const otherImgs = allProdImages.slice(1);
    setFormImageUrl(primaryImg);
    setFormGallery(otherImgs);
    setFormOptions(
      p.opciones && p.opciones.length > 0 ? JSON.parse(JSON.stringify(p.opciones)) : []
    );
    setFormActive(p.activo);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const publicUrl = await uploadProductImageToStorage(file);
      setFormImageUrl(publicUrl);
    } catch (err: any) {
      setUploadError(err?.message || 'Error al subir la imagen a Supabase');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const uploadPromises = Array.from(files).map((f) => uploadProductImageToStorage(f));
      const urls = await Promise.all(uploadPromises);
      setFormGallery((prev) => [...prev, ...urls]);
    } catch (err: any) {
      setUploadError(err?.message || 'Error al subir fotos adicionales');
    } finally {
      setIsUploadingImage(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const allImages = [
        ...(formImageUrl.trim() ? [formImageUrl.trim()] : []),
        ...formGallery.filter((url) => Boolean(url && url.trim())),
      ];

      const cleanedOptions: ProductoOpcion[] = formOptions
        .filter((o) => o && o.nombre && o.nombre.trim().length > 0)
        .map((o, idx) => ({
          id: o.id || `opt_${idx + 1}_${Date.now()}`,
          nombre: o.nombre.trim(),
          precio:
            typeof o.precio === 'number' && !isNaN(o.precio) && o.precio >= 0
              ? o.precio
              : parseFloat(formPrice) || 0,
        }));

      const payload: Partial<Producto> = {
        nombre: formName.trim(),
        categoria_id: formCategory || null,
        precio: parseFloat(formPrice) || 0,
        costo: parseFloat(formCost) || 0,
        stock: parseInt(formStock, 10) || 0,
        descripcion: formDescription.trim() || null,
        imagen_url: formImageUrl.trim() || null,
        imagenes: allImages,
        opciones: cleanedOptions,
        activo: formActive,
      };

      let savedProd: Producto | null = null;
      if (editingProduct) {
        savedProd = await updateAdminProduct(editingProduct.id, payload);
        if (savedProd) {
          setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? savedProd! : p)));
        }
      } else {
        savedProd = await createAdminProduct(payload);
        if (savedProd) {
          setProducts((prev) => [savedProd!, ...prev.filter((p) => p.id !== savedProd!.id)]);
        }
      }

      setIsModalOpen(false);
      if (!editingProduct) {
        setCategoryFilter('');
        setSearchTerm('');
      }
      await loadData();
    } catch (err: any) {
      showToast('Error al guardar el producto: ' + (err?.message || 'Error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const target = productToDelete;
    setIsDeletingProduct(true);
    try {
      await deleteAdminProduct(target.id);
      setProducts((prev) => prev.filter((item) => item.id !== target.id));
      showToast(`Producto "${target.nombre}" eliminado exitosamente.`);
    } catch (err: any) {
      showToast('Error al eliminar producto: ' + (err?.message || 'Error'), 'error');
    } finally {
      setIsDeletingProduct(false);
      setProductToDelete(null);
    }
  };

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = categoryFilter ? p.categoria_id === categoryFilter : true;
      return matchesSearch && matchesCat;
    });

    return list.sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'name') return a.nombre.localeCompare(b.nombre);
      if (sortBy === 'priceAsc') return a.precio - b.precio;
      if (sortBy === 'priceDesc') return b.precio - a.precio;
      return 0;
    });
  }, [products, searchTerm, categoryFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold shadow-lg animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60 min-w-[180px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#c5a059]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-stone-300 focus:outline-none focus:border-[#c5a059]"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-stone-300 focus:outline-none focus:border-[#c5a059]"
            title="Ordenar catálogo"
          >
            <option value="newest">Más recientes primero</option>
            <option value="name">Nombre (A - Z)</option>
            <option value="priceAsc">Precio: Menor a Mayor</option>
            <option value="priceDesc">Precio: Mayor a Menor</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-[#c5a059]/20"
          >
            <Plus size={15} />
            <span>Nuevo Producto</span>
          </button>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 transition-colors cursor-pointer"
            title="Recargar catálogo"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#100f14] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-stone-400 bg-black/40">
                <th className="py-3 px-4">Producto & Foto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Precio</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-stone-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    Cargando catálogo...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoria_id);
                  const hasRealImg = hasProductRealImage(p);
                  const displayImg = getPrimaryProductImage(p, '/images/logo/logotipo.jpeg');
                  const prodImages = getProductImages(p);

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black/60 border border-white/10 shrink-0 flex items-center justify-center">
                            {hasRealImg ? (
                              <img
                                src={displayImg}
                                alt={p.nombre}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = '/images/logo/logotipo.jpeg';
                                }}
                              />
                            ) : (
                              <img
                                src="/images/logo/logotipo.jpeg"
                                alt="Pretty Store"
                                className="w-full h-full object-cover opacity-90"
                              />
                            )}
                            {prodImages.length > 1 && (
                              <span className="absolute bottom-0 right-0 bg-black/80 text-[9px] font-mono text-amber-300 px-1 rounded-tl">
                                +{prodImages.length - 1}
                              </span>
                            )}
                          </div>
                          <div>
                            <strong className="text-white block font-medium">{p.nombre}</strong>
                            <span className="text-[11px] text-stone-400 font-light truncate max-w-xs block">
                              {p.descripcion || '—'}
                            </span>
                            {p.opciones && p.opciones.length > 0 && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#c5a059] text-[10px] font-medium">
                                <Sparkles size={10} />
                                <span>{p.opciones.length} opciones: {p.opciones.map((o) => `${o.nombre}${typeof o.precio === 'number' ? ` ($${o.precio.toFixed(2)})` : ''}`).join(', ')}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-stone-400 font-medium">
                        {cat?.nombre || 'Sin categoría'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        ${p.precio.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                            p.stock <= 0
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : p.stock <= 5
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            p.activo ? 'text-emerald-400' : 'text-stone-500'
                          }`}
                        >
                          {p.activo ? <Eye size={12} /> : <EyeOff size={12} />}
                          <span>{p.activo ? 'Activo' : 'Oculto'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
                            title="Editar producto e imagen"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal with Supabase Image Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#100f14] border border-white/10 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
              <h3 className="font-serif-luxury font-bold text-white text-base">
                {editingProduct ? 'Editar Producto' : 'Crear Producto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Product Image Upload Section */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-stone-300 font-semibold block">
                    Foto Principal del Producto
                  </label>
                  <span className="text-[10px] text-[#c5a059] uppercase tracking-wider font-mono">
                    Supabase Storage
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Preview Container */}
                  <div className="relative w-24 h-24 rounded-2xl bg-black/80 border border-white/15 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                    {formImageUrl ? (
                      <img
                        src={formImageUrl}
                        alt="Vista previa"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/images/logo/logotipo.jpeg';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-stone-500 text-center p-2">
                        <ImageIcon size={22} className="mb-1 text-stone-600" />
                        <span className="text-[9px]">Sin foto</span>
                      </div>
                    )}

                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-[#c5a059] gap-1">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-[9px] font-mono">Subiendo...</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="px-4 py-2 rounded-xl bg-[#c5a059]/15 hover:bg-[#c5a059]/25 text-[#c5a059] border border-[#c5a059]/30 font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Upload size={14} />
                        <span>Subir desde dispositivo</span>
                      </button>

                      {formImageUrl && (
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                          title="Quitar foto"
                        >
                          Quitar
                        </button>
                      )}
                    </div>

                    {/* URL Input */}
                    <div>
                      <input
                        type="text"
                        placeholder="O pega aquí el enlace directo (URL)..."
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder-stone-600 text-[11px] focus:outline-none focus:border-[#c5a059]"
                      />
                    </div>
                  </div>
                </div>

                {uploadError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Additional Gallery Images */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 text-[11px]">Fotos adicionales (Galería)</span>
                    <input
                      type="file"
                      ref={galleryInputRef}
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleGalleryUpload}
                    />
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="text-[11px] text-[#c5a059] hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                    >
                      <Plus size={12} />
                      <span>Agregar más fotos</span>
                    </button>
                  </div>

                  {formGallery.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {formGallery.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative w-12 h-12 rounded-xl overflow-hidden bg-black/60 border border-white/10 group shrink-0"
                        >
                          <img src={imgUrl} alt="galería" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            className="absolute top-0 right-0 p-0.5 bg-black/80 text-rose-400 hover:text-white rounded-bl transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Basic Info */}
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Gorra Bélica Sox Blackout"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Categoría</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-[#c5a059]"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Precio ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-[#c5a059] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Stock Disponible *</label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-[#c5a059] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Detalles y especificaciones del producto..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059] resize-none"
                />
              </div>

              {/* OPCIONES DEL PRODUCTO (Colores, Variantes, etc.) */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-white text-xs">
                      <Sparkles size={14} className="text-[#c5a059]" />
                      <span>Opciones y Variantes (Opcional - Colores, Modelos, etc.)</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">
                      Agrega opciones como Rojo, Azul, Verde con precios distintos si lo deseas. Si no agregas ninguna opción, el producto se venderá con su precio base normal de ${formPrice || '0.00'}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormOptions((prev) => [
                        ...prev,
                        {
                          id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                          nombre: '',
                          precio: parseFloat(formPrice) || 0,
                        },
                      ]);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#c5a059]/15 hover:bg-[#c5a059]/25 text-[#c5a059] border border-[#c5a059]/30 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 active:scale-95"
                  >
                    <Plus size={13} />
                    <span>Agregar Opción</span>
                  </button>
                </div>

                {formOptions.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {formOptions.map((opt, idx) => (
                      <div
                        key={opt.id || idx}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-xl bg-black/60 border border-white/10"
                      >
                        <div className="flex-1">
                          <label className="block text-[9px] text-stone-400 font-mono mb-1">
                            Nombre de la Opción (ej. Rojo, Azul, Verde, Talla M)
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Rojo"
                            value={opt.nombre}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormOptions((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, nombre: val } : item))
                              );
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-black/80 border border-white/15 text-white text-xs placeholder-stone-600 focus:outline-none focus:border-[#c5a059]"
                          />
                        </div>

                        <div className="w-full sm:w-36">
                          <label className="block text-[9px] text-stone-400 font-mono mb-1">
                            Precio de esta opción ($ USD)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder={formPrice}
                            value={opt.precio !== undefined ? opt.precio : ''}
                            onChange={(e) => {
                              const val =
                                e.target.value === '' ? undefined : parseFloat(e.target.value);
                              setFormOptions((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, precio: val } : item))
                              );
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-black/80 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-[#c5a059]"
                          />
                        </div>

                        <div className="sm:pt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setFormOptions((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-2 text-stone-500 hover:text-rose-400 transition-colors cursor-pointer rounded-lg hover:bg-rose-500/10"
                            title="Eliminar opción"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center text-[11px] text-stone-500 font-light">
                    Sin opciones configuradas (este producto se vende solo por su precio base normal). Si deseas opciones como colores o tallas, presiona <strong className="text-[#c5a059] font-medium">+ Agregar Opción</strong>.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/10">
                <div>
                  <span className="font-semibold text-white block">Producto Activo en Tienda</span>
                  <span className="text-[10px] text-stone-400">Visible para los clientes en el catálogo</span>
                </div>
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#c5a059] accent-[#c5a059] cursor-pointer"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage}
                  className="px-6 py-2 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Producto</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminar Producto */}
      <ConfirmDeleteModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDeleteProduct}
        title={`¿Eliminar Producto "${productToDelete?.nombre}"?`}
        description="Se eliminará permanentemente este producto del catálogo y de la base de datos de Supabase."
        confirmText="Eliminar Producto"
        isLoading={isDeletingProduct}
      />
    </div>
  );
};
