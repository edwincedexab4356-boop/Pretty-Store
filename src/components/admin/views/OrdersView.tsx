import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
} from 'lucide-react';
import { getAdminOrders, updateOrderStatus } from '../../../services/adminService';
import { Pedido, EstadoPedido } from '../../../types/database';
import { isPermissionError } from '../../../utils/supabaseSqlFix';
import { PermissionErrorBanner } from '../PermissionErrorBanner';

interface OrdersViewProps {
  initialSelectedOrder?: Pedido | null;
  onOpenSqlFix?: (desc?: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ initialSelectedOrder, onOpenSqlFix }) => {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Order for detail modal
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(initialSelectedOrder || null);
  const [newStatus, setNewStatus] = useState<EstadoPedido>('pendiente');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminOrders();
      setOrders(data);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al consultar pedidos.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialSelectedOrder) {
      setSelectedOrder(initialSelectedOrder);
      setNewStatus(initialSelectedOrder.estado);
    }
  }, [initialSelectedOrder]);

  const handleOpenDetail = (order: Pedido) => {
    setSelectedOrder(order);
    setNewStatus(order.estado);
  };

  const handleSaveStatus = async (orderId: string, statusToSave: EstadoPedido) => {
    setIsUpdatingStatus(true);
    try {
      await updateOrderStatus(orderId, statusToSave);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, estado: statusToSave } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, estado: statusToSave });
      }
      setActionMessage({ type: 'success', text: `Estado del pedido actualizado a "${statusToSave}".` });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al actualizar pedido.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (estado: EstadoPedido) => {
    switch (estado) {
      case 'entregado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={11} />
            <span>Entregado</span>
          </span>
        );
      case 'confirmado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <CheckCircle2 size={11} />
            <span>Confirmado</span>
          </span>
        );
      case 'preparando':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Package size={11} />
            <span>Preparando</span>
          </span>
        );
      case 'enviado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Truck size={11} />
            <span>Enviado</span>
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle size={11} />
            <span>Cancelado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock size={11} />
            <span>Pendiente</span>
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((o) => {
    const orderNum = `PED-${o.id.replace(/-/g, '').slice(0, 6)}`.toLowerCase();
    const clientName = (o.cliente?.nombre || '').toLowerCase();
    const clientEmail = (o.cliente?.email || '').toLowerCase();
    const matchesSearch =
      orderNum.includes(searchTerm.toLowerCase()) ||
      clientName.includes(searchTerm.toLowerCase()) ||
      clientEmail.includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || o.estado === statusFilter;
    return matchesSearch && matchesStatus;
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
      {/* Toast Alert / Permission Alert */}
      {actionMessage && isPermissionError(actionMessage.text) ? (
        <PermissionErrorBanner
          errorMessage={actionMessage.text}
          onOpenFixModal={() => onOpenSqlFix?.('Permisos en tabla pedidos')}
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
            Pedidos Recibidos ({filteredOrders.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Revisa las compras de tus clientes, detalle de productos y actualiza el estado de entrega.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors self-start md:self-auto"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Actualizar Lista</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por código de pedido (#PED-...), nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="preparando">Preparando</option>
            <option value="enviado">Enviado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-amber-400" />
            <span>Cargando pedidos de Supabase...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <ShoppingBag size={36} className="mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-white">No se encontraron pedidos.</p>
            <p className="text-slate-500 max-w-sm mx-auto">
              Los pedidos realizados en la tienda se registrarán aquí en tiempo real.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Nº Pedido</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Pago</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((order) => {
                  const orderCode = `#PED-${order.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {orderCode}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">
                          {order.cliente?.nombre || 'Cliente General'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {order.cliente?.telefono || order.cliente?.email || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white font-mono">
                        {formatMoney(order.total)}
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[11px] text-slate-300 font-mono">
                        {order.metodo_pago}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={order.estado}
                          onChange={(e) =>
                            handleSaveStatus(order.id, e.target.value as EstadoPedido)
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="preparando">Preparando</option>
                          <option value="enviado">Enviado</option>
                          <option value="entregado">Entregado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenDetail(order)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye size={12} />
                          <span>Detalle</span>
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

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                  Detalle del Pedido
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-mono">
                  #PED-{selectedOrder.id.replace(/-/g, '').slice(0, 6).toUpperCase()}
                </h3>
                <span className="text-xs text-slate-400">
                  {selectedOrder.created_at
                    ? new Date(selectedOrder.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Client Info Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 mb-6">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Información del Cliente
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <User size={14} className="text-amber-400 shrink-0" />
                  <span className="font-semibold text-white">
                    {selectedOrder.cliente?.nombre || 'Cliente General'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone size={14} className="text-amber-400 shrink-0" />
                  <span>{selectedOrder.cliente?.telefono || 'Sin teléfono'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail size={14} className="text-amber-400 shrink-0" />
                  <span>{selectedOrder.cliente?.email || 'Sin email'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CreditCard size={14} className="text-amber-400 shrink-0" />
                  <span className="uppercase font-mono">
                    Método: {selectedOrder.metodo_pago}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex items-start gap-2 text-slate-300 mb-1">
                  <MapPin size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Dirección:</strong> {selectedOrder.direccion || 'Entrega en tienda / no especificada'}
                  </span>
                </div>
                {selectedOrder.notas && (
                  <div className="flex items-start gap-2 text-slate-400 mt-2 p-2 bg-slate-900 rounded-lg">
                    <FileText size={14} className="shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      <strong>Notas:</strong> {selectedOrder.notas}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Products List */}
            <div className="mb-6 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Productos Comprados ({selectedOrder.detalles?.length || 0})
              </span>

              {(!selectedOrder.detalles || selectedOrder.detalles.length === 0) ? (
                <div className="p-4 rounded-xl bg-slate-950 text-xs text-slate-500 text-center">
                  Líneas de detalle no registradas para este pedido.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedOrder.detalles.map((d) => (
                    <div
                      key={d.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {d.producto?.imagen_url ? (
                          <img
                            src={d.producto.imagen_url}
                            alt={d.producto.nombre}
                            className="w-10 h-10 rounded-lg object-cover bg-black"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                            <Package size={16} />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-white">
                            {d.producto?.nombre || 'Producto'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {d.cantidad} x {formatMoney(d.precio_unitario)}
                          </p>
                        </div>
                      </div>

                      <span className="font-mono font-bold text-amber-400">
                        {formatMoney(d.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs mb-6 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>{formatMoney(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Envío:</span>
                <span className="text-emerald-400">Gratis ($0.00)</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-base font-bold text-white">
                <span>Total:</span>
                <span className="text-amber-400">{formatMoney(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Status Change Form */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Actualizar Estado del Pedido
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as EstadoPedido)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="preparando">Preparando</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <button
                onClick={() => handleSaveStatus(selectedOrder.id, newStatus)}
                disabled={isUpdatingStatus || newStatus === selectedOrder.estado}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isUpdatingStatus ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Cambios</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
