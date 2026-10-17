import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Trash2, UserX } from 'lucide-react';
import { Cliente } from '../../../types/database';
import {
  getAdminClients,
  deleteAdminClient,
  deleteAllAdminClients,
} from '../../../services/adminService';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { CheckCircle2 } from 'lucide-react';

export const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminClients();
      setClients(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const confirmSingleDelete = async () => {
    if (!clientToDelete) return;
    const target = clientToDelete;
    setDeletingId(target.id);
    try {
      const success = await deleteAdminClient(target.id);
      if (success) {
        setClients((prev) => prev.filter((c) => c.id !== target.id));
        showToast(`Cliente "${target.nombre}" eliminado exitosamente.`);
      } else {
        showToast('No se pudo eliminar el cliente. Verifica la conexión o los permisos.', 'error');
      }
    } catch (err: any) {
      showToast('Error al eliminar cliente: ' + (err?.message || 'Error desconocido'), 'error');
    } finally {
      setDeletingId(null);
      setClientToDelete(null);
    }
  };

  const confirmDeleteAllClients = async () => {
    setIsDeletingAll(true);
    try {
      const ok = await deleteAllAdminClients();
      if (ok) {
        setClients([]);
        showToast('Se han eliminado todos los clientes de Supabase exitosamente.');
      } else {
        showToast('Ocurrió un error al intentar eliminar los clientes.', 'error');
      }
    } catch (err: any) {
      showToast('Error: ' + (err?.message || 'Error desconocido'), 'error');
    } finally {
      setIsDeletingAll(false);
      setShowDeleteAllModal(false);
      await loadClients();
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telefono.includes(searchTerm) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Buscar por cliente o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowDeleteAllModal(true)}
            disabled={isLoading || isDeletingAll || clients.length === 0}
            className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-40 active:scale-95 hover:scale-102"
            title="Eliminar todos los clientes"
          >
            <UserX size={14} className={isDeletingAll ? 'animate-spin' : ''} />
            <span>Eliminar Todos los Clientes</span>
          </button>

          <button
            onClick={loadClients}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-stone-300 border border-white/10 transition-all duration-200 cursor-pointer active:scale-90 hover:scale-105"
            title="Actualizar clientes"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-[#100f14] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-stone-400 bg-black/40">
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Teléfono / WhatsApp</th>
                <th className="py-3 px-4">Dirección</th>
                <th className="py-3 px-4 text-center">Pedidos</th>
                <th className="py-3 px-4 text-right">Total Gastado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-stone-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    Cargando clientes...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <span>{client.nombre}</span>
                      {client.email && (
                        <span className="block text-[11px] text-stone-400 font-normal">{client.email}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-300">
                      <span>{client.telefono}</span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-400 font-light truncate max-w-xs">
                      {client.direccion || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                      {client.total_pedidos || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#fbbf24]">
                      ${(client.total_gastado || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setClientToDelete(client)}
                        disabled={deletingId === client.id}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer border border-rose-500/20 disabled:opacity-50"
                        title={`Eliminar cliente ${client.nombre}`}
                      >
                        <Trash2 size={14} className={deletingId === client.id ? 'animate-pulse' : ''} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Confirmar Eliminar Todos los Clientes */}
      <ConfirmDeleteModal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={confirmDeleteAllClients}
        title="¿Eliminar TODOS los Clientes?"
        description="Esta acción eliminará todos los clientes registrados en Supabase."
        confirmText="Sí, Eliminar Todos los Clientes"
        itemCount={clients.length}
        isLoading={isDeletingAll}
      />

      {/* Modal: Confirmar Eliminar Cliente Individual */}
      <ConfirmDeleteModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={confirmSingleDelete}
        title={`¿Eliminar Cliente "${clientToDelete?.nombre}"?`}
        description={`Se eliminará permanentemente al cliente (${clientToDelete?.telefono}) de la base de datos de Supabase.`}
        confirmText="Eliminar Cliente"
        isLoading={!!deletingId}
      />
    </div>
  );
};
