import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  toggleProductActive,
  updateProductStock,
  getAdminCategories,
  uploadMediaFile,
} from '../../../services/adminService';
import { Producto, Categoria } from '../../../types/database';
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

  // Form fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number | string>('');
  const [formCost, setFormCost] = useState<number | string>('');
  const [formStock, setFormStock] = useState<number | string>(10);
  const [formCategory, setFormCategory] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
    setFormImageUrl(prod.imagen_url || '');
    setFormActive(prod.activo);
    setIsModalOpen(true);
    setActionMessage(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const url = await uploadMediaFile('product-images', file);
      setFormImageUrl(url);
      setActionMessage({ type: 'success', text: 'Imagen subida exitosamente a Supabase Storage.' });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `${err.message} Puedes usar una URL directa de imagen mientras tanto.`,
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCategory || formPrice === '') {
      setActionMessage({ type: 'error', text: 'Nombre, categoría y precio son obligatorios.' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await updateAdminProduct(editingProduct.id, {
          nombre: formName,
          descripcion: formDescription,
          precio: Number(formPrice),
          costo: Number(formCost) || 0,
          stock: Number(formStock) || 0,
          categoria_id: formCategory,
          imagen_url: formImageUrl,
          activo: formActive,
        });
        setActionMessage({ type: 'success', text: 'Producto actualizado correctamente.' });
      } else {
        await createAdminProduct({
          nombre: formName,
          descripcion: formDescription,
          precio: Number(formPrice),
          costo: Number(formCost) || 0,
          stock: Number(formStock) || 0,
          categoria_id: formCategory,
          imagen_url: formImageUrl,
          activo: formActive,
        });
        setActionMessage({ type: 'success', text: 'Producto creado y disponible en la tienda.' });
      }

      setIsModalOpen(false);
      await loadData();
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-luxury">
            Productos ({filteredProducts.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Crea, edita y gestiona existencias directamente sincronizadas con la tienda pública.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all self-start md:self-auto"
        >
          <Plus size={16} />
          <span>+ Agregar Producto</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">Todas las categorías</option>
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
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Solo Activos (En Tienda)</option>
            <option value="inactive">Solo Inactivos (Ocultos)</option>
            <option value="out_of_stock">Solo Agotados (Stock 0)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-amber-400" />
            <span>Cargando productos de Supabase...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <Package size={36} className="mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-white">No se encontraron productos.</p>
            <p className="text-slate-500 max-w-sm mx-auto">
              Haz clic en "+ Agregar Producto" para crear el primero y que aparezca de inmediato en la tienda pública.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Crear Producto</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Producto</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Precio</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                  {editingProduct ? 'Modificar Producto' : 'Nuevo Registro'}
                </span>
                <h3 className="text-xl font-bold text-white font-serif-luxury">
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
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Baccarat Rouge 540 Extrait"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="Notas olfativas, características y detalles del producto..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Precio de Venta ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="350.00"
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
                    placeholder="210.00"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              {/* Image Input + Storage Upload */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold">Imagen del Producto</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-[11px] placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <label className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700">
                    <Upload size={14} className={isUploadingImage ? 'animate-bounce text-amber-400' : ''} />
                    <span className="hidden sm:inline">Subir</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-slate-500">
                  Formatos: JPG, PNG, WEBP (máx. 5 MB). Se guarda en el bucket <code className="text-amber-400">product-images</code>.
                </p>
                {formImageUrl && (
                  <div className="flex items-center gap-3 p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <img
                      src={formImageUrl}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-lg bg-black"
                    />
                    <span className="text-[11px] text-slate-400 truncate flex-1">
                      {formImageUrl}
                    </span>
                  </div>
                )}
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
