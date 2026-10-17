import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Package,
  Ruler,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
} from 'lucide-react';
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  toggleCategoryActive,
  saveAdminCategoriesOrder,
} from '../../../services/adminService';
import { Categoria } from '../../../types/database';
import {
  SIZE_PRESETS,
  resolveSizeOptions,
  saveCategorySizeConfig,
  embedSizeConfigInDescription,
  getCleanDescription,
} from '../../../utils/categorySizesStorage';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const CategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [catToDelete, setCatToDelete] = useState<Categoria | null>(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);

  // Apartado de Tamaños / Tallas
  const [sizeEnabled, setSizeEnabled] = useState(false);
  const [sizeLabel, setSizeLabel] = useState('Tamaño');
  const [sizeOptions, setSizeOptions] = useState<string[]>(['Pequeño', 'Grande']);
  const [newOptionInput, setNewOptionInput] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const cats = await getAdminCategories();
      setCategories(cats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormActive(true);
    setSizeEnabled(false);
    setSizeLabel('Tamaño');
    setSizeOptions(['Pequeño', 'Grande']);
    setNewOptionInput('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Categoria) => {
    setEditingCategory(cat);
    setFormName(cat.nombre);
    setFormDescription(getCleanDescription(cat.descripcion || ''));
    setFormActive(cat.activa);

    const existing = resolveSizeOptions(cat.id, cat.nombre, '', cat.descripcion || '');
    setSizeEnabled(existing.enabled);
    setSizeLabel(existing.label || 'Tamaño');
    setSizeOptions(existing.options.length > 0 ? existing.options : ['Pequeño', 'Grande']);
    setNewOptionInput('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setModalError('El nombre de la categoría es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      // 1. Incrustar metadatos de tallas en la descripción para persistencia en base de datos
      const finalDesc = embedSizeConfigInDescription(formDescription, {
        categoryId: editingCategory ? editingCategory.id : '',
        enabled: sizeEnabled,
        label: sizeLabel,
        options: sizeOptions,
      });

      let targetId = editingCategory?.id;

      if (editingCategory) {
        await updateAdminCategory(editingCategory.id, {
          nombre: formName.trim(),
          descripcion: finalDesc,
          activa: formActive,
        });
      } else {
        const created = await createAdminCategory({
          nombre: formName.trim(),
          descripcion: finalDesc,
          activa: formActive,
        });
        if (created) targetId = created.id;
      }

      // 2. Guardar en almacenamiento de tallas local para respuesta instantánea
      if (targetId) {
        saveCategorySizeConfig({
          categoryId: targetId,
          enabled: sizeEnabled,
          label: sizeLabel,
          options: sizeOptions,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setModalError(err?.message || 'Error al guardar la categoría.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: Categoria) => {
    await toggleCategoryActive(cat.id, !cat.activa);
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, activa: !c.activa } : c))
    );
  };

  const confirmDeleteCategory = async () => {
    if (!catToDelete) return;
    const target = catToDelete;
    setIsDeletingCat(true);
    try {
      await deleteAdminCategory(target.id);
      setCategories((prev) => prev.filter((c) => c.id !== target.id));
      showToast(`Categoría "${target.nombre}" eliminada exitosamente.`);
    } catch (err: any) {
      showToast('No se pudo eliminar la categoría. Asegúrate de que no tenga productos asociados.', 'error');
    } finally {
      setIsDeletingCat(false);
      setCatToDelete(null);
    }
  };

  const [orderSavedToast, setOrderSavedToast] = useState(false);

  const handleMoveUp = async (catId: string) => {
    const currentIndex = categories.findIndex((c) => c.id === catId);
    if (currentIndex <= 0) return;

    const newCats = [...categories];
    const item = newCats[currentIndex];
    newCats.splice(currentIndex, 1);
    newCats.splice(currentIndex - 1, 0, item);

    setCategories(newCats);
    await saveAdminCategoriesOrder(newCats.map((c) => c.id));
    setOrderSavedToast(true);
    setTimeout(() => setOrderSavedToast(false), 2500);
  };

  const handleMoveDown = async (catId: string) => {
    const currentIndex = categories.findIndex((c) => c.id === catId);
    if (currentIndex < 0 || currentIndex >= categories.length - 1) return;

    const newCats = [...categories];
    const item = newCats[currentIndex];
    newCats.splice(currentIndex, 1);
    newCats.splice(currentIndex + 1, 0, item);

    setCategories(newCats);
    await saveAdminCategoriesOrder(newCats.map((c) => c.id));
    setOrderSavedToast(true);
    setTimeout(() => setOrderSavedToast(false), 2500);
  };

  const filteredCategories = categories.filter((c) =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {orderSavedToast && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 size={13} />
              <span>Orden guardado</span>
            </div>
          )}
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-[#c5a059]/20"
          >
            <Plus size={15} />
            <span>Nueva Categoría</span>
          </button>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 transition-colors cursor-pointer"
            title="Recargar"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-[#100f14] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-stone-400 bg-black/40">
                <th className="py-3 px-4 w-32">Orden</th>
                <th className="py-3 px-4">Nombre de Categoría</th>
                <th className="py-3 px-4">Apartado de Tallas / Opciones</th>
                <th className="py-3 px-4 text-center">Productos</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-stone-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    Cargando categorías...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    No hay categorías registradas.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const sizeInfo = resolveSizeOptions(cat.id, cat.nombre, '', cat.descripcion || '');
                  const catIndex = categories.findIndex((c) => c.id === cat.id);

                  return (
                    <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[#c5a059] bg-[#c5a059]/10 px-2 py-0.5 rounded-lg border border-[#c5a059]/30 min-w-8 text-center">
                            #{catIndex + 1}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => handleMoveUp(cat.id)}
                              disabled={catIndex <= 0}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
                              title="Subir de posición"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              onClick={() => handleMoveDown(cat.id)}
                              disabled={catIndex >= categories.length - 1}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
                              title="Bajar de posición"
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-white">
                        <span>{cat.nombre}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {sizeInfo.enabled && sizeInfo.options.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] uppercase tracking-wider text-[#c5a059] font-bold">
                              📏 {sizeInfo.label}:
                            </span>
                            {sizeInfo.options.slice(0, 3).map((opt, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-stone-300 font-mono"
                              >
                                {opt}
                              </span>
                            ))}
                            {sizeInfo.options.length > 3 && (
                              <span className="text-[10px] text-stone-500">
                                +{sizeInfo.options.length - 3} más
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-500 text-[11px] italic">
                            Sin tallas configuradas (Estándar)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-stone-300">
                          <Package size={12} className="text-[#c5a059]" />
                          <span>{cat.total_productos ?? 0}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActive(cat)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                            cat.activa
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-stone-800 text-stone-500 border border-stone-700'
                          }`}
                        >
                          {cat.activa ? <Eye size={12} /> : <EyeOff size={12} />}
                          <span>{cat.activa ? 'Visible' : 'Oculta'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
                            title="Editar Categoría y Tallas"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setCatToDelete(cat)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                            title="Eliminar Categoría"
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

      {/* CREATE / EDIT CATEGORY MODAL WITH SIZE CONFIGURATION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#100f14] border border-white/10 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#c5a059] block">
                  {editingCategory ? 'Modificar' : 'Crear'}
                </span>
                <h3 className="font-serif-luxury font-bold text-white text-base sm:text-lg">
                  {editingCategory ? 'Editar Categoría & Tallas' : 'Nueva Categoría'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 cursor-pointer transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Nombre de la Categoría *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Gorras Bélicas, Perfumes Virales, Pastelitos..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Descripción Breve (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Descripción de la colección..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059] resize-none"
                />
              </div>

              {/* APARTADO DE TAMAÑOS / TALLAS PARA EL CLIENTE */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#c5a059]/20 flex items-center justify-center text-[#c5a059]">
                      <Ruler size={15} />
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs block">
                        Apartado de Tamaños / Tallas / Presentaciones
                      </span>
                      <span className="text-[11px] text-stone-400 font-light block">
                        Permite que el cliente seleccione su tamaño antes de comprar
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={sizeEnabled}
                    onChange={(e) => setSizeEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-[#c5a059] accent-[#c5a059] cursor-pointer"
                  />
                </div>

                {sizeEnabled && (
                  <div className="space-y-3.5 pt-3 border-t border-white/10 animate-fadeIn">
                    <div>
                      <label className="block text-stone-300 font-semibold mb-1">
                        Título del Selector (ej. Tamaño, Talla de Gorra, Presentación)
                      </label>
                      <input
                        type="text"
                        value={sizeLabel}
                        onChange={(e) => setSizeLabel(e.target.value)}
                        placeholder="Ej. Tamaño de Pastelito o Talla"
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059]"
                      />
                    </div>

                    {/* Plantillas Rápidas (1 Clic) */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1.5">
                        Plantillas Rápidas (1 Clic):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(SIZE_PRESETS).map(([key, preset]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setSizeLabel(preset.label);
                              setSizeOptions([...preset.options]);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#c5a059]/20 hover:text-[#c5a059] text-stone-300 text-[11px] border border-white/10 transition-colors cursor-pointer"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lista de Opciones Activas */}
                    <div>
                      <label className="block text-stone-300 font-semibold mb-1">
                        Opciones que podrá elegir el cliente ({sizeOptions.length})
                      </label>
                      <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-black/60 border border-white/15 min-h-[42px] items-center">
                        {sizeOptions.map((opt, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#c5a059]/20 border border-[#c5a059]/40 text-[#c5a059] text-xs font-semibold"
                          >
                            <span>{opt}</span>
                            <button
                              type="button"
                              onClick={() => setSizeOptions(sizeOptions.filter((_, i) => i !== idx))}
                              className="text-stone-400 hover:text-white cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Input para agregar opción */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newOptionInput}
                        onChange={(e) => setNewOptionInput(e.target.value)}
                        placeholder="Escribe una o varias separadas por coma..."
                        className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newOptionInput.trim()) {
                              const parts = newOptionInput.split(',').map((p) => p.trim()).filter(Boolean);
                              setSizeOptions([...sizeOptions, ...parts]);
                              setNewOptionInput('');
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newOptionInput.trim()) {
                            const parts = newOptionInput.split(',').map((p) => p.trim()).filter(Boolean);
                            setSizeOptions([...sizeOptions, ...parts]);
                            setNewOptionInput('');
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-[#c5a059] hover:text-black text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        + Agregar
                      </button>
                    </div>

                    {/* Vista Previa para el Cliente */}
                    {sizeOptions.length > 0 && (
                      <div className="p-3 rounded-xl bg-black/80 border border-white/10 space-y-1.5">
                        <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-mono">
                          Vista previa en la tienda:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-white text-xs font-bold mr-1">{sizeLabel}:</span>
                          {sizeOptions.map((opt, i) => (
                            <span
                              key={i}
                              className={`px-2.5 py-0.5 rounded-lg text-[11px] ${
                                i === 0
                                  ? 'bg-[#c5a059] text-black font-bold'
                                  : 'bg-white/5 text-stone-300 border border-white/10'
                              }`}
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Categoría Activa Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                <div>
                  <span className="font-semibold text-white block">Categoría Visible</span>
                  <span className="text-[11px] text-stone-400">Mostrar en el catálogo para los clientes</span>
                </div>
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#c5a059] accent-[#c5a059] cursor-pointer"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminar Categoría */}
      <ConfirmDeleteModal
        isOpen={!!catToDelete}
        onClose={() => setCatToDelete(null)}
        onConfirm={confirmDeleteCategory}
        title={`¿Eliminar Categoría "${catToDelete?.nombre}"?`}
        description="Se eliminará la categoría. Asegúrate de que no tenga productos asociados para evitar errores de integridad."
        confirmText="Eliminar Categoría"
        isLoading={isDeletingCat}
      />
    </div>
  );
};
