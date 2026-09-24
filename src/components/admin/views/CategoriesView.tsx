import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Package,
} from 'lucide-react';
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  toggleCategoryActive,
} from '../../../services/adminService';
import { Categoria } from '../../../types/database';
import { isPermissionError } from '../../../utils/supabaseSqlFix';
import { PermissionErrorBanner } from '../PermissionErrorBanner';

interface CategoriesViewProps {
  onOpenSqlFix?: (actionDesc?: string) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ onOpenSqlFix }) => {
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null);
  const [isDeleting, setIsDeleting] = useState<Categoria | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const cats = await getAdminCategories();
      setCategories(cats);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al cargar categorías.' });
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
    setModalError(null);
    setIsModalOpen(true);
    setActionMessage(null);
  };

  const openEditModal = (cat: Categoria) => {
    setEditingCategory(cat);
    setFormName(cat.nombre);
    setFormDescription(cat.descripcion || '');
    setFormActive(cat.activa);
    setModalError(null);
    setIsModalOpen(true);
    setActionMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setModalError('El nombre de la categoría es requerido.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    try {
      if (editingCategory) {
        await updateAdminCategory(editingCategory.id, {
          nombre: formName,
          descripcion: formDescription,
          activa: formActive,
        });
        setActionMessage({ type: 'success', text: 'Categoría actualizada con éxito.' });
      } else {
        await createAdminCategory({
          nombre: formName,
          descripcion: formDescription,
          activa: formActive,
        });
        setActionMessage({ type: 'success', text: 'Categoría creada y visible en la tienda.' });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      const msg = err?.message || 'Error al guardar categoría.';
      setModalError(msg);
      setActionMessage({ type: 'error', text: msg });
      if (isPermissionError(msg) && onOpenSqlFix) {
        onOpenSqlFix(editingCategory ? `Actualizar categoría: ${formName}` : `Crear categoría: ${formName}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: Categoria) => {
    try {
      await toggleCategoryActive(cat.id, !cat.activa);
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, activa: !c.activa } : c))
      );
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al cambiar estado.' });
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) return;
    try {
      await deleteAdminCategory(isDeleting.id);
      setActionMessage({ type: 'success', text: 'Categoría eliminada de Supabase.' });
      setIsDeleting(null);
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al eliminar categoría.' });
      setIsDeleting(null);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.descripcion && c.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Toast Alert / Permission Alert */}
      {actionMessage && isPermissionError(actionMessage.text) ? (
        <PermissionErrorBanner
          errorMessage={actionMessage.text}
          onOpenFixModal={() => onOpenSqlFix?.('Permisos en tabla categorias')}
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

      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-luxury">
            Categorías ({categories.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Organiza las secciones del menú y los filtros del catálogo de la tienda.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all self-start md:self-auto"
        >
          <Plus size={16} />
          <span>+ Nueva Categoría</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar categorías..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-amber-400" />
            <span>Cargando categorías de Supabase...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <Layers size={36} className="mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-white">No hay categorías registradas.</p>
            <p className="text-slate-500 max-w-sm mx-auto">
              Crea tu primera categoría para organizar los productos de la tienda.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Crear Categoría</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Nombre</th>
                  <th className="py-3.5 px-4">Descripción</th>
                  <th className="py-3.5 px-4">Productos Asociados</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {c.nombre}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                      {c.descripcion || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                        <Package size={12} className="text-amber-400" />
                        <span>{c.total_productos ?? 0}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          c.activa
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                        }`}
                        title="Haz clic para activar o desactivar"
                      >
                        {c.activa ? (
                          <>
                            <Eye size={12} />
                            <span>Activa</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} />
                            <span>Inactiva</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Editar categoría"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setIsDeleting(c)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                          title="Eliminar categoría"
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                  {editingCategory ? 'Modificar' : 'Nueva Categoría'}
                </span>
                <h3 className="text-xl font-bold text-white font-serif-luxury">
                  {editingCategory ? 'Editar Categoría' : 'Crear Categoría'}
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
              {modalError && (
                <div className="mb-2">
                  {isPermissionError(modalError) ? (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 space-y-2">
                      <div className="font-bold flex items-center gap-1.5 text-rose-400">
                        <AlertCircle size={15} />
                        <span>Permiso denegado en Supabase (Error 42501)</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        PostgreSQL rechazó la creación porque faltan los permisos <strong>GRANT</strong> o políticas <strong>RLS</strong> en la tabla <code>categorias</code>.
                      </p>
                      {onOpenSqlFix && (
                        <button
                          type="button"
                          onClick={() => onOpenSqlFix(editingCategory ? 'Modificar categoría' : 'Crear categoría')}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <span>🔧 Ver y Copiar Script SQL de Solución</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{modalError}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre de la Categoría *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Perfumes de Nicho"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descripción (Opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Breve reseña de la categoría..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="font-semibold text-white block">Categoría Activa</span>
                  <span className="text-[11px] text-slate-400">
                    Visible en los filtros del catálogo de la tienda
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
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-serif-luxury">
              ¿Eliminar categoría?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              ¿Seguro que deseas eliminar <strong>"{isDeleting.nombre}"</strong>? No se podrá eliminar si tiene productos asignados actualmente.
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
