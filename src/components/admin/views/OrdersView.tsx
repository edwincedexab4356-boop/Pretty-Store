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
  Plus,
} from 'lucide-react';
import { getAdminOrders, updateOrderStatus } from '../../../services/adminService';
import { Pedido, EstadoPedido } from '../../../types/database';
import { isPermissionError } from '../../../utils/supabaseSqlFix';
import { PermissionErrorBanner } from '../PermissionErrorBanner';
import { ManualSaleModal } from '../ManualSaleModal';

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
  const [isManualSaleOpen, setIsManualSaleOpen] = useState(false);

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={12} />
            <span>Entregado</span>
          </span>
        );
      case 'confirmado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <CheckCircle2 size={12} />
            <span>Confirmado</span>
          </span>
        );
      case 'preparando':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Package size={12} />
            <span>Preparando</span>
          </span>
        );
      case 'enviado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Truck size={12} />
            <span>Enviado</span>
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle size={12} />
            <span>Cancelado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock size={12} />
            <span>Pendiente</span>
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((o) => {
    const rawId = String(o.id || '');
    const orderNum = `PED-${rawId.replace(/-/g, '').slice(0, 6)}`.toLowerCase();
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
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs ${
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
      <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#c5a059] font-medium block mb-1">
            Gestión de Pedidos
          </span>
          <h2 className="text-xl sm:text-2xl font-serif-luxury font-semibold text-white tracking-wide">
            Registro de Pedidos ({filteredOrders.length})
          </h2>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Auditoría de compras, comprobantes y actualización de logística en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={() => setIsManualSaleOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#d4af37] hover:opacity-95 text-black font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-[#c5a059]/20"
          >
            <Plus size={15} />
            <span>Registrar Venta Manual</span>
          </button>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-stone-200 hover:text-white text-xs font-medium border border-white/[0.08] flex items-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#c5a059]' : 'text-stone-400'} />
            <span>Actualizar Pedidos</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Buscar por Nº de pedido (#PED-...), nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0e0e12] border border-white/[0.08] text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/40 transition-colors"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e12] border border-white/[0.08] text-xs text-stone-200 focus:outline-none focus:border-[#c5a059] cursor-pointer transition-colors"
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
      <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-[#c5a059]" />
            <span>Sincronizando pedidos desde Supabase...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400 space-y-2">
            <ShoppingBag size={36} className="mx-auto text-stone-600 mb-2" />
            <p className="font-serif-luxury font-semibold text-white text-base">No hay pedidos registrados</p>
            <p className="text-stone-500 max-w-sm mx-auto font-light">
              Las órdenes procesadas en el checkout de la tienda se registrarán aquí en tiempo real.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-stone-400 uppercase text-[10px] font-medium tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="py-3.5 px-4">Nº Pedido</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Cliente & Entrega</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Método</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredOrders.map((order) => {
                  const rawOrderId = String(order.id || '');
                  const orderCode = `#PED-${rawOrderId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
                  return (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#c5a059]">
                        {orderCode}
                      </td>
                      <td className="py-3.5 px-4 text-stone-400 whitespace-nowrap font-light">
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
                        <div className="font-medium text-white">
                          {order.cliente?.nombre || 'Cliente General'}
                        </div>
                        <div className="text-[11px] text-stone-400 font-light">
                          {order.cliente?.telefono || order.cliente?.email || '—'}
                        </div>
                        {/* Tipo de Entrega Badge */}
                        <div className="mt-1">
                          {order.direccion?.toLowerCase().includes('retiro') || order.notas?.includes('[RETIRO') ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Retiro en Local
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              <Truck size={10} />
                              <span>
                                {order.direccion?.includes('Uno Express') || order.notas?.includes('UNO EXPRESS')
                                  ? 'Uno Express'
                                  : order.direccion?.includes('Ferguson') || order.notas?.includes('FERGUSON')
                                  ? 'Ferguson'
                                  : order.direccion?.includes('Servientrega') || order.notas?.includes('SERVIENTREGA')
                                  ? 'Servi Entrega'
                                  : 'Delivery'}
                              </span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white font-mono">
                        {formatMoney(order.total)}
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[11px] text-stone-300 font-mono">
                        {order.metodo_pago}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={order.estado}
                          onChange={(e) =>
                            handleSaveStatus(order.id, e.target.value as EstadoPedido)
                          }
                          className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] font-medium text-stone-200 focus:outline-none focus:border-[#c5a059] cursor-pointer"
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
                          className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#c5a059] border border-white/[0.08] hover:border-white/20 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0e0e12] border border-white/10 rounded-2xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
              <div>
                <span className="text-[10px] uppercase font-medium tracking-wider text-[#c5a059] block">
                  Detalle del Pedido
                </span>
                <h3 className="text-xl sm:text-2xl font-serif-luxury font-semibold text-white">
                  #PED-{String(selectedOrder.id || '').replace(/-/g, '').slice(0, 6).toUpperCase()}
                </h3>
                <span className="text-xs text-stone-400 font-light">
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
                className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Client Info Card */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3 mb-6">
              <span className="text-xs font-medium text-[#c5a059] uppercase tracking-wider block">
                Información del Cliente
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-stone-300">
                  <User size={14} className="text-[#c5a059] shrink-0" />
                  <span className="font-medium text-white">
                    {selectedOrder.cliente?.nombre || 'Cliente General'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-stone-300">
                  <Phone size={14} className="text-[#c5a059] shrink-0" />
                  <span>{selectedOrder.cliente?.telefono || 'Sin teléfono'}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-300">
                  <Mail size={14} className="text-[#c5a059] shrink-0" />
                  <span>{selectedOrder.cliente?.email || 'Sin email'}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-300">
                  <CreditCard size={14} className="text-[#c5a059] shrink-0" />
                  <span className="uppercase font-mono text-[11px]">
                    Método: {selectedOrder.metodo_pago}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06] text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-stone-400 font-medium">Modalidad de Entrega:</span>
                  {selectedOrder.direccion?.toLowerCase().includes('retiro') || selectedOrder.notas?.includes('[RETIRO') ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Retiro en Tienda Física (Costa del Este)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                      <Truck size={12} />
                      <span>
                        Delivery Nacional ({
                          selectedOrder.direccion?.includes('Uno Express') || selectedOrder.notas?.includes('UNO EXPRESS')
                            ? 'Uno Express'
                            : selectedOrder.direccion?.includes('Ferguson') || selectedOrder.notas?.includes('FERGUSON')
                            ? 'Ferguson'
                            : selectedOrder.direccion?.includes('Servientrega') || selectedOrder.notas?.includes('SERVIENTREGA')
                            ? 'Servi Entrega'
                            : 'Courier'
                        })
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-2 text-stone-300 font-light">
                  <MapPin size={14} className="text-[#c5a059] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-200 font-medium">Dirección:</strong> {selectedOrder.direccion || 'Entrega en tienda'}
                  </span>
                </div>

                {selectedOrder.notas && (
                  <div className="flex items-start gap-2 text-stone-300 p-2.5 bg-black/30 border border-white/[0.06] rounded-xl font-light">
                    <FileText size={14} className="shrink-0 mt-0.5 text-[#c5a059]" />
                    <div>
                      <strong className="text-[#c5a059] block text-[11px] mb-0.5 font-medium">Detalles del Pedido:</strong>
                      <span className="text-xs text-stone-300 leading-relaxed font-mono">
                        {selectedOrder.notas}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Products List */}
            <div className="mb-6 space-y-3">
              <span className="text-xs font-medium text-white uppercase tracking-wider block">
                Productos Comprados ({selectedOrder.detalles?.length || 0})
              </span>

              {(!selectedOrder.detalles || selectedOrder.detalles.length === 0) ? (
                <div className="p-4 rounded-xl bg-white/[0.02] text-xs text-stone-500 text-center font-light">
                  Líneas de detalle no registradas para este pedido.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedOrder.detalles.map((d) => (
                    <div
                      key={d.id}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {d.producto?.imagen_url ? (
                          <img
                            src={d.producto.imagen_url}
                            alt={d.producto.nombre}
                            className="w-10 h-10 rounded-lg object-cover bg-black border border-white/10"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-stone-900 border border-white/10 flex items-center justify-center text-stone-500">
                            <Package size={16} />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white">
                            {d.producto?.nombre || 'Producto'}
                          </p>
                          <p className="text-[11px] text-stone-400 font-light">
                            {d.cantidad} x {formatMoney(d.precio_unitario)}
                          </p>
                        </div>
                      </div>

                      <span className="font-mono font-medium text-[#c5a059]">
                        {formatMoney(d.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2 text-xs mb-6 font-mono">
              <div className="flex justify-between text-stone-400">
                <span>Subtotal:</span>
                <span>{formatMoney(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Envío:</span>
                <span className="text-emerald-400">Gratis ($0.00)</span>
              </div>
              <div className="pt-2 border-t border-white/[0.08] flex justify-between text-base font-semibold text-white">
                <span>Total:</span>
                <span className="text-[#c5a059]">{formatMoney(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Status Change Form */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-[#c5a059]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-medium text-white mb-1">
                  Actualizar Estado del Pedido
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as EstadoPedido)}
                  className="px-3 py-2 rounded-xl bg-black border border-white/10 text-xs text-white focus:outline-none focus:border-[#c5a059] cursor-pointer"
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
                className="px-5 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isUpdatingStatus ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-black" />
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

      {/* Manual Sale Creation Modal */}
      <ManualSaleModal
        isOpen={isManualSaleOpen}
        onClose={() => setIsManualSaleOpen(false)}
        onSuccess={() => {
          setActionMessage({
            type: 'success',
            text: '¡Venta manual registrada y asociada al historial de pedidos con éxito!',
          });
          loadData();
        }}
      />
    </div>
  );
};
