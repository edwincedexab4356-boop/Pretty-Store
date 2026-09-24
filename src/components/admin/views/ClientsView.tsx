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
} from 'lucide-react';
import { getAdminClients } from '../../../services/adminService';
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

  const filteredClients = clients.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.telefono && c.telefono.includes(q))
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
      {/* Permission Warning Banner if any error */}
      {loadError && isPermissionError(loadError) && (
        <PermissionErrorBanner
          errorMessage={loadError}
          onOpenFixModal={() => onOpenSqlFix?.('Permisos en tabla clientes')}
          onDismiss={() => setLoadError(null)}
        />
      )}

      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-luxury">
            Directorio de Clientes ({filteredClients.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Información de contacto, historial de pedidos y volumen de compras de los clientes registrados.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors self-start md:self-auto"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Actualizar Clientes</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por nombre, correo o teléfono..."
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
            <span>Cargando directorio de clientes...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Users size={36} className="mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-white">No hay clientes registrados aún.</p>
            <p className="text-slate-500 max-w-sm mx-auto">
              Cuando los clientes realicen pedidos a través del checkout, se registrarán automáticamente aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Contacto</th>
                  <th className="py-3.5 px-4">Dirección</th>
                  <th className="py-3.5 px-4">Pedidos Realizados</th>
                  <th className="py-3.5 px-4">Total Comprado</th>
                  <th className="py-3.5 px-4">Último Pedido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">
                        {client.nombre}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ID: {client.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail size={12} className="text-amber-400" />
                        <span>{client.email}</span>
                      </div>
                      {client.telefono && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Phone size={12} className="text-amber-400" />
                          <span>{client.telefono}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                      {client.direccion || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                        <ShoppingBag size={12} className="text-amber-400" />
                        <span>{client.pedidos_count ?? 0}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {formatMoney(client.total_gastado ?? 0)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {client.ultimo_pedido
                        ? new Date(client.ultimo_pedido).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
