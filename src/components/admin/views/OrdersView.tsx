import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle2,
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

export const OrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

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
    await updateOrderStatus(orderId, newStatus);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, estado: newStatus } : o))
    );
  };

  const handleDelete = async (order: Pedido) => {
    const orderNum = order.numero_orden || String(order.id || '').slice(0, 8);
    const clientName = order.cliente?.nombre || 'Cliente';
    const confirmMsg = `¿Estás seguro de que deseas eliminar el pedido #${orderNum} de ${clientName}?\n\nEsta acción eliminará el registro de pedidos de Supabase.`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(order.id);
    try {
      const ok = await deleteAdminOrder(order.id);
      if (ok) {
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
      } else {
        alert('No se pudo eliminar el pedido. Verifica la conexión.');
      }
    } catch (err: any) {
      alert('Error al eliminar pedido: ' + (err?.message || 'Error'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAllOrders = async () => {
    if (orders.length === 0) return;
    const confirm1 = window.confirm(
      `⚠️ ¿Estás seguro de que deseas eliminar TODOS los ${orders.length} pedidos registrados?\n\nEsta acción eliminará todos los pedidos, comprobantes y ventas asociadas de Supabase.`
    );
    if (!confirm1) return;
    const confirm2 = window.confirm(
      `¡Confirmación final!\n\n¿Deseas vaciar la lista completa de pedidos definitivamente?`
    );
    if (!confirm2) return;

    setIsDeletingAll(true);
    try {
      const ok = await deleteAllAdminOrders();
      if (ok) {
        setOrders([]);
        alert('Se han eliminado todos los pedidos exitosamente.');
      } else {
        alert('Ocurrió un error al intentar eliminar los pedidos.');
      }
    } catch (err: any) {
      alert('Error: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsDeletingAll(false);
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
            onClick={handleDeleteAllOrders}
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
                  const hasCapture = Boolean(order.comprobante_pago);
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
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/20 transition-colors cursor-pointer"
                            >
                              <ImageIcon size={12} />
                              <span>Ver Foto</span>
                            </button>
                          ) : (
                            <span className="text-stone-600 text-[11px]">Sin captura</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={order.estado}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as EstadoPedido)}
                            className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-[#c5a059]"
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="confirmado">Confirmado</option>
                            <option value="preparando">Preparando</option>
                            <option value="enviado">Enviado</option>
                            <option value="entregado">Entregado</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 rounded-lg bg-[#c5a059]/15 hover:bg-[#c5a059]/30 text-[#c5a059] transition-colors cursor-pointer"
                              title="Ver Factura Completa"
                            >
                              <FileText size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(order)}
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
        <OfficialInvoiceModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};
