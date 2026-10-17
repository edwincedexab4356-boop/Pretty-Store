import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle2,
  Check,
  Clock,
  Truck,
  Package,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Pedido, EstadoPedido } from '../../../types/database';
import {
  getAdminOrders,
  updateOrderStatus,
  deleteAdminOrder,
  deleteAllAdminOrders,
} from '../../../services/adminService';
import { OfficialInvoiceModal } from '../OfficialInvoiceModal';
import { getPrimaryProductImage } from '../../../utils/productImages';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const OrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  const [invoiceModalTab, setInvoiceModalTab] = useState<'factura' | 'comprobante'>('factura');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Pedido | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminOrders();
      setOrders(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: EstadoPedido) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    await updateOrderStatus(orderId, newStatus, targetOrder);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, estado: newStatus } : o))
    );
    if (newStatus === 'confirmado') {
      showToast('¡Pedido aceptado! Se descontó del inventario y se agregó al registro de Ventas.');
    } else if (newStatus === 'cancelado') {
      showToast('Pedido cancelado. Si estaba confirmado, el inventario ha sido restaurado.');
    } else {
      showToast(`Pedido actualizado a "${newStatus}"`);
    }
  };

  const confirmSingleDelete = async () => {
    if (!orderToDelete) return;
    const target = orderToDelete;
    setDeletingId(target.id);
    try {
      const ok = await deleteAdminOrder(target.id);
      if (ok) {
        setOrders((prev) => prev.filter((o) => o.id !== target.id));
        showToast(`Pedido #${target.numero_orden || String(target.id).slice(0, 8)} eliminado exitosamente`);
      } else {
        showToast('No se pudo eliminar el pedido. Verifica la conexión.', 'error');
      }
    } catch (err: any) {
      showToast('Error al eliminar pedido: ' + (err?.message || 'Error'), 'error');
    } finally {
      setDeletingId(null);
      setOrderToDelete(null);
    }
  };

  const confirmDeleteAllOrders = async () => {
    setIsDeletingAll(true);
    try {
      const ok = await deleteAllAdminOrders();
      if (ok) {
        setOrders([]);
        showToast('Todos los pedidos han sido eliminados de Supabase exitosamente.');
      } else {
        showToast('Ocurrió un error al intentar eliminar los pedidos.', 'error');
      }
    } catch (err: any) {
      showToast('Error: ' + (err?.message || 'Error desconocido'), 'error');
    } finally {
      setIsDeletingAll(false);
      setShowDeleteAllModal(false);
      await loadOrders();
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      (o.numero_orden || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.cliente?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.cliente?.telefono || '').includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || o.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              placeholder="Buscar por cliente, tel o # orden..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#c5a059]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-stone-300 focus:outline-none focus:border-[#c5a059]"
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

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowDeleteAllModal(true)}
            disabled={isLoading || isDeletingAll || orders.length === 0}
            className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-40 shrink-0 active:scale-95 hover:scale-102"
            title="Eliminar todos los pedidos"
          >
            <Trash2 size={13} className={isDeletingAll ? 'animate-spin' : ''} />
            <span>Eliminar Todos los Pedidos</span>
          </button>

          <button
            onClick={loadOrders}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-stone-300 text-xs flex items-center gap-2 border border-white/10 transition-all duration-200 cursor-pointer shrink-0 active:scale-95 hover:scale-102"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#100f14] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-stone-400 bg-black/40">
                <th className="py-3 px-4">Orden</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Productos e Imágenes</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4 text-center">Comprobante</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-stone-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    Cargando pedidos...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    No se encontraron pedidos.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const orderNum = order.numero_orden || String(order.id || '').slice(0, 8);
                  const hasCapture = Boolean(
                    order.comprobante_pago ||
                    (order.notas && (order.notas.includes('http') || order.notas.includes('/uploads/')))
                  );
                  const items = order.items || [];
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                          <button
                            onClick={() => toggleExpand(order.id)}
                            className="inline-flex items-center gap-1 hover:text-[#c5a059] transition-colors cursor-pointer text-left"
                            title="Ver detalles de productos"
                          >
                            <span>#{orderNum}</span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <strong className="text-white block">{order.cliente?.nombre || 'Cliente'}</strong>
                          <span className="text-stone-400 font-mono text-[11px] block">
                            {order.cliente?.telefono || '—'}
                          </span>
                        </td>

                        {/* Product Images Miniatures */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {items.length > 0 ? (
                              items.map((it, idx) => (
                                <div
                                  key={idx}
                                  className="relative group shrink-0"
                                  title={`${it.producto?.nombre || 'Producto'} (${it.cantidad}x) ${it.selectedSize ? `Talla: ${it.selectedSize}` : ''}`}
                                >
                                  <img
                                    src={getPrimaryProductImage(it.producto, '/images/logo/logotipo.jpeg')}
                                    alt={it.producto?.nombre || 'Producto'}
                                    className="w-9 h-9 rounded-xl object-cover bg-black/60 border border-white/10 group-hover:border-[#c5a059] transition-all"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = '/images/logo/logotipo.jpeg';
                                    }}
                                  />
                                  {it.cantidad > 1 && (
                                    <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow">
                                      {it.cantidad}
                                    </span>
                                  )}
                                </div>
                              ))
                            ) : (
                              <span className="text-stone-500 text-[11px]">Ver en factura</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-[#fbbf24] whitespace-nowrap">
                          ${order.total.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 uppercase text-[10px] font-semibold text-stone-400 whitespace-nowrap">
                          {order.metodo_pago}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {hasCapture ? (
                            <button
                              onClick={() => {
                                setInvoiceModalTab('comprobante');
                                setSelectedOrder(order);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 hover:text-white text-[11px] font-bold hover:bg-emerald-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
                              title="Ver foto del comprobante de pago"
                            >
                              <ImageIcon size={13} className="text-emerald-400" />
                              <span>Ver Foto</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setInvoiceModalTab('comprobante');
                                setSelectedOrder(order);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white text-[10px] border border-white/10 transition-all cursor-pointer"
                              title="Adjuntar o verificar comprobante"
                            >
                              <span>+ Adjuntar</span>
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {order.estado === 'pendiente' ? (
                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 w-fit animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <span>Por Aceptar</span>
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(order.id, 'confirmado')}
                                  className="px-2 py-1 rounded-md bg-emerald-500 hover:bg-emerald-600 text-black text-[10px] font-black tracking-wider cursor-pointer shadow flex items-center gap-1 active:scale-95"
                                  title="Aceptar este pedido y contabilizarlo como venta oficial"
                                >
                                  <Check size={12} className="stroke-[3]" />
                                  <span>ACEPTAR</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(order.id, 'cancelado')}
                                  className="px-1.5 py-1 rounded-md bg-stone-850 hover:bg-rose-950/80 text-stone-400 hover:text-rose-300 text-[10px] cursor-pointer border border-white/10"
                                  title="Rechazar pedido"
                                >
                                  Rechazar
                                </button>
                              </div>
                            </div>
                          ) : order.estado === 'confirmado' ? (
                            <div className="flex flex-col gap-1 min-w-[130px]">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 w-fit">
                                <Check size={11} className="stroke-[2.5]" />
                                <span>Venta Aceptada</span>
                              </span>
                              <select
                                value={order.estado}
                                onChange={(e) => handleStatusChange(order.id, e.target.value as EstadoPedido)}
                                className="px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-[10px] text-stone-300 focus:outline-none focus:border-[#c5a059]"
                              >
                                <option value="confirmado">Confirmado</option>
                                <option value="preparando">Preparando</option>
                                <option value="enviado">Enviado</option>
                                <option value="entregado">Entregado</option>
                                <option value="cancelado">Cancelar</option>
                              </select>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 min-w-[130px]">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                                order.estado === 'entregado'
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                  : order.estado === 'enviado'
                                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                  : order.estado === 'preparando'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              }`}>
                                <span className="capitalize">{order.estado}</span>
                              </span>
                              <select
                                value={order.estado}
                                onChange={(e) => handleStatusChange(order.id, e.target.value as EstadoPedido)}
                                className="px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-[10px] text-stone-300 focus:outline-none focus:border-[#c5a059]"
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="preparando">Preparando</option>
                                <option value="enviado">Enviado</option>
                                <option value="entregado">Entregado</option>
                                <option value="cancelado">Cancelado</option>
                              </select>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setInvoiceModalTab('factura');
                                setSelectedOrder(order);
                              }}
                              className="p-1.5 rounded-lg bg-[#c5a059]/15 hover:bg-[#c5a059]/30 text-[#c5a059] transition-colors cursor-pointer"
                              title="Ver Factura Completa"
                            >
                              <FileText size={14} />
                            </button>
                            <button
                              onClick={() => setOrderToDelete(order)}
                              disabled={deletingId === order.id}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer border border-rose-500/20 disabled:opacity-50"
                              title="Eliminar Pedido"
                            >
                              <Trash2 size={14} className={deletingId === order.id ? 'animate-pulse' : ''} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Order Items with Full Product Images & Details */}
                      {isExpanded && items.length > 0 && (
                        <tr className="bg-black/40 border-b border-white/5">
                          <td colSpan={8} className="p-4 pl-12">
                            <div className="space-y-2">
                              <span className="text-[10px] uppercase font-bold text-[#c5a059] tracking-wider block">
                                Detalle de Productos en Orden #{orderNum}:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {items.map((it, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3"
                                  >
                                    <img
                                      src={getPrimaryProductImage(it.producto, '/images/logo/logotipo.jpeg')}
                                      alt={it.producto?.nombre}
                                      className="w-12 h-12 rounded-lg object-cover bg-black/80 border border-white/10 shrink-0"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = '/images/logo/logotipo.jpeg';
                                      }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <strong className="text-white text-xs block truncate">
                                        {it.producto?.nombre || 'Producto'}
                                      </strong>
                                      {it.selectedSize && (
                                        <span className="text-[10px] text-amber-300 font-mono block">
                                          Talla: {it.selectedSize}
                                        </span>
                                      )}
                                      <div className="flex items-center justify-between text-[11px] text-stone-400 mt-1 font-mono">
                                        <span>{it.cantidad} unidad(es)</span>
                                        <span className="text-[#fbbf24] font-bold">
                                          ${it.subtotal?.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice & Voucher Modal */}
      {selectedOrder && (
        <OfficialInvoiceModal
          order={selectedOrder}
          initialTab={invoiceModalTab}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Modal: Confirmar Eliminar Todos los Pedidos */}
      <ConfirmDeleteModal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={confirmDeleteAllOrders}
        title="¿Eliminar TODOS los Pedidos?"
        description="Esta acción eliminará todos los pedidos registrados en Supabase junto con sus ventas y comprobantes asociados."
        confirmText="Sí, Eliminar Todos los Pedidos"
        itemCount={orders.length}
        isLoading={isDeletingAll}
      />

      {/* Modal: Confirmar Eliminar Pedido Individual */}
      <ConfirmDeleteModal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={confirmSingleDelete}
        title={`¿Eliminar Pedido #${orderToDelete?.numero_orden || String(orderToDelete?.id || '').slice(0, 8)}?`}
        description={`Se eliminará permanentemente el pedido de ${orderToDelete?.cliente?.nombre || 'este cliente'} de la base de datos.`}
        confirmText="Eliminar Pedido"
        isLoading={!!deletingId}
      />
    </div>
  );
};
