import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  DollarSign,
  Calendar,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { getAdminClients, deleteAdminClient } from '../../../services/adminService';
import { Cliente } from '../../../types/database';
import { isPermissionError } from '../../../utils/supabaseSqlFix';
import { PermissionErrorBanner } from '../PermissionErrorBanner';

interface ClientsViewProps {
  onOpenSqlFix?: (desc?: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ onOpenSqlFix }) => {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Cliente | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getAdminClients();
      setClients(data);
    } catch (e: any) {
      const msg = e?.message || 'Error al cargar clientes.';
      console.warn('Error loading clients:', e);
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    setFeedback(null);
    try {
      await deleteAdminClient(clientToDelete.id);
      setFeedback({
        type: 'success',
        text: `El cliente "${clientToDelete.nombre}" ha sido eliminado exitosamente.`,
      });
      setClientToDelete(null);
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'No se pudo eliminar el cliente.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredClients = clients.filter((c) => {
    const q = searchTerm.toLowerCase();
    const nombre = String(c.nombre || '').toLowerCase();
    const email = String(c.email || '').toLowerCase();
    const telefono = String(c.telefono || '').toLowerCase();
    const id = String(c.id || '').toLowerCase();
    return (
      nombre.includes(q) ||
      email.includes(q) ||
      telefono.includes(q) ||
      id.includes(q)
    );
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
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={16} className="text-rose-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-white p-1 rounded cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Permission Warning Banner if any error */}
      {loadError && isPermissionError(loadError) && (
        <PermissionErrorBanner
          errorMessage={loadError}
          onOpenFixModal={() => onOpenSqlFix?.('Permisos en tabla clientes')}
          onDismiss={() => setLoadError(null)}
        />
      )}

      {/* Header */}
      <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#c5a059] font-medium block mb-1">
            Directorio de Clientes
          </span>
          <h2 className="text-xl sm:text-2xl font-serif-luxury font-semibold text-white tracking-wide">
            Clientes Registrados ({filteredClients.length})
          </h2>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Directorio de compradores, historial de órdenes acumuladas y gestión de cuentas.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-stone-200 hover:text-white text-xs font-medium border border-white/[0.08] flex items-center gap-2 cursor-pointer transition-all self-start md:self-auto"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#c5a059]' : 'text-stone-400'} />
          <span>Actualizar Clientes</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
        <input
          type="text"
          placeholder="Buscar cliente, correo o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0e0e12] border border-white/[0.08] text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/40 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-[#c5a059]" />
            <span>Sincronizando clientes desde Supabase...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400 space-y-2">
            <Users size={36} className="mx-auto text-stone-600 mb-2" />
            <p className="font-serif-luxury font-semibold text-white text-base">No hay clientes registrados</p>
            <p className="text-stone-500 max-w-sm mx-auto font-light">
              Cuando los clientes completen órdenes en el checkout de la tienda o se registren ventas, se indexarán automáticamente aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-stone-400 uppercase text-[10px] font-medium tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Contacto</th>
                  <th className="py-3.5 px-4">Dirección</th>
                  <th className="py-3.5 px-4">Pedidos</th>
                  <th className="py-3.5 px-4">Total Gastado</th>
                  <th className="py-3.5 px-4">Última Compra</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredClients.map((client) => {
                  const clientIdStr = String(client.id ?? '');
                  const displayId = clientIdStr.length > 8 ? clientIdStr.slice(0, 8) : clientIdStr;
                  return (
                    <tr key={clientIdStr || Math.random().toString()} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white text-sm">
                          {client.nombre}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          ID: {displayId || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-stone-300">
                          <Mail size={12} className="text-[#c5a059]" />
                          <span>{client.email || '—'}</span>
                        </div>
                        {client.telefono && (
                          <div className="flex items-center gap-1.5 text-stone-400 font-light">
                            <Phone size={12} className="text-[#c5a059]" />
                            <span>{client.telefono}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-stone-400 max-w-xs truncate font-light">
                        {client.direccion || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono text-stone-300">
                          <ShoppingBag size={12} className="text-[#c5a059]" />
                          <span>{client.pedidos_count ?? 0}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-emerald-400">
                        {formatMoney(client.total_gastado ?? 0)}
                      </td>
                      <td className="py-3.5 px-4 text-stone-400 font-light">
                        {client.ultimo_pedido
                          ? new Date(client.ultimo_pedido).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setClientToDelete(client)}
                          className="p-2 rounded-xl text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Eliminar cliente"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0e0e12] border border-white/10 rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">¿Eliminar Cliente?</h3>
                <p className="text-xs text-stone-400 font-light">Esta acción eliminará la ficha del cliente</p>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed mb-6 font-light">
              Estás a punto de eliminar a <span className="font-semibold text-white">{clientToDelete.nombre}</span>{' '}
              ({clientToDelete.email || clientToDelete.telefono || 'Sin datos de contacto'}).
              Sus pedidos históricos permanecerán registrados en el sistema para mantener la integridad contable.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-stone-300 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-rose-900/30"
              >
                {isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
