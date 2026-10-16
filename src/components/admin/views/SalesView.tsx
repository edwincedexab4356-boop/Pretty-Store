import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  Search,
  Trash2,
  Package,
  Calendar,
  CheckCircle2,
  FileText,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { VentaRecord, getAdminSales, deleteAdminSale, deleteAllAdminSales } from '../../../services/adminService';
import { Pedido } from '../../../types/database';
import { OfficialInvoiceModal } from '../OfficialInvoiceModal';
import { getPrimaryProductImage } from '../../../utils/productImages';

export const SalesView: React.FC = () => {
  const [sales, setSales] = useState<VentaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Pedido | null>(null);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminSales();
      setSales(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteSale = async (sale: VentaRecord) => {
    const saleNum = sale.numero_orden || `#${String(sale.id).slice(0, 8)}`;
    const confirmMsg = `¿Estás seguro de que deseas eliminar la venta ${saleNum} (${sale.cliente.nombre})?\n\nEsta acción eliminará el registro de venta y sus comprobantes de Supabase.`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(sale.id);
    try {
      const ok = await deleteAdminSale(sale.id, sale.pedido_id || undefined);
      if (ok) {
        setSales((prev) => prev.filter((s) => s.id !== sale.id));
      } else {
        alert('No se pudo eliminar la venta.');
      }
    } catch (err: any) {
      alert('Error al eliminar venta: ' + (err?.message || 'Error'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAllSales = async () => {
    if (sales.length === 0) return;
    const confirm1 = window.confirm(
      `⚠️ ¿Estás seguro de que deseas eliminar TODAS las ${sales.length} ventas registradas?\n\nEsta acción eliminará el historial de ventas y los pedidos asociados de Supabase.`
    );
    if (!confirm1) return;
    const confirm2 = window.confirm(
      `¡Confirmación final!\n\n¿Deseas reiniciar y vaciar la lista completa de ventas definitivamente?`
    );
    if (!confirm2) return;

    setIsDeletingAll(true);
    try {
      const ok = await deleteAllAdminSales();
      if (ok) {
        setSales([]);
        alert('Se han eliminado todas las ventas exitosamente.');
      } else {
        alert('Ocurrió un error al intentar eliminar las ventas.');
      }
    } catch (err: any) {
      alert('Error: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsDeletingAll(false);
      await loadData();
    }
  };

  const totalSales = sales.reduce((acc, s) => acc + (s.total || 0), 0);
  const totalCount = sales.length;
  const avgTicket = totalCount > 0 ? totalSales / totalCount : 0;

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      (s.numero_orden || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.cliente.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.cliente.telefono || '').includes(searchTerm) ||
      s.items.some((it) => (it.producto?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMethod = methodFilter === 'all' || s.metodo_pago === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const handleOpenInvoice = (sale: VentaRecord) => {
    // Construir objeto Pedido compatible para OfficialInvoiceModal
    const mockOrder: Pedido = {
      id: sale.id,
      numero_orden: sale.numero_orden?.replace('#', '') || String(sale.id),
      total: sale.total,
      subtotal: sale.subtotal || sale.total,
      descuento: sale.descuento || 0,
      metodo_pago: (sale.metodo_pago as any) || 'efectivo',
      tipo_entrega: (sale.tipo_entrega as any) || 'delivery',
      estado: 'confirmado',
      created_at: sale.fecha,
      cliente: {
        id: sale.cliente.id || sale.id,
        nombre: sale.cliente.nombre,
        telefono: sale.cliente.telefono,
        email: sale.cliente.email || null,
        direccion: sale.cliente.direccion || null,
      },
      items: sale.items,
    };
    setSelectedInvoice(mockOrder);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="font-serif-luxury font-bold text-white text-base">
          Registro de Ventas & Facturación
        </h3>
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={handleDeleteAllSales}
            disabled={isLoading || isDeletingAll || sales.length === 0}
            className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-40 active:scale-95 hover:scale-102"
            title="Eliminar todas las ventas"
          >
            <Trash2 size={13} className={isDeletingAll ? 'animate-spin' : ''} />
            <span>Eliminar Todas las Ventas</span>
          </button>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-stone-300 border border-white/10 transition-all duration-200 cursor-pointer active:scale-90 hover:scale-105"
            title="Actualizar ventas"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-[#100f14] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Ingresos</span>
            <DollarSign size={18} className="text-[#fbbf24]" />
          </div>
          <span className="text-3xl font-mono font-bold text-white block">
            ${totalSales.toFixed(2)} USD
          </span>
          <span className="text-[11px] text-emerald-400 font-medium block">
            Facturación acumulada en tienda
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-[#100f14] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Ventas Realizadas</span>
            <ShoppingCart size={18} className="text-[#c5a059]" />
          </div>
          <span className="text-3xl font-mono font-bold text-white block">{totalCount}</span>
          <span className="text-[11px] text-stone-400 font-light block">
            Transacciones registradas
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-[#100f14] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Ticket Promedio</span>
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <span className="text-3xl font-mono font-bold text-white block">
            ${avgTicket.toFixed(2)} USD
          </span>
          <span className="text-[11px] text-stone-400 font-light block">Por compra realizada</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              placeholder="Buscar por cliente, tel, orden o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#c5a059]"
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-stone-300 focus:outline-none focus:border-[#c5a059]"
          >
            <option value="all">Todos los métodos de pago</option>
            <option value="yappy">Yappy</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </div>
      </div>

      {/* Sales Table with Product Images & Delete Button */}
      <div className="bg-[#100f14] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-stone-400 bg-black/40">
                <th className="py-3 px-4"># Venta / Fecha</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Productos e Imágenes</th>
                <th className="py-3 px-4">Método de Pago</th>
                <th className="py-3 px-4 text-right">Total Facturado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-stone-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    Cargando ventas...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    No se encontraron registros de ventas.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isExpanded = expandedSaleId === sale.id;

                  return (
                    <React.Fragment key={sale.id}>
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-mono">
                          <button
                            onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                            className="font-bold text-white hover:text-[#c5a059] flex items-center gap-1 cursor-pointer"
                            title="Expandir productos de la venta"
                          >
                            <span>{sale.numero_orden}</span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                          <span className="text-[11px] text-stone-400 block mt-0.5">
                            {sale.fecha ? new Date(sale.fecha).toLocaleDateString('es-PA') : 'Reciente'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <strong className="text-white block font-medium">{sale.cliente.nombre}</strong>
                          <span className="text-stone-400 font-mono text-[11px] block">
                            {sale.cliente.telefono}
                          </span>
                        </td>

                        {/* Product Miniatures with Images */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {sale.items && sale.items.length > 0 ? (
                              sale.items.map((it, idx) => (
                                <div
                                  key={idx}
                                  className="relative group shrink-0"
                                  title={`${it.producto?.nombre || 'Producto'} (${it.cantidad}x) ${it.selectedSize ? `- Talla ${it.selectedSize}` : ''}`}
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
                              <span className="text-stone-500 text-[11px]">Venta registrada</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 uppercase text-[10px] font-semibold text-stone-300">
                          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 inline-block">
                            {sale.metodo_pago}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#fbbf24] text-sm">
                          ${sale.total.toFixed(2)}
                        </td>

                        {/* Actions: View Invoice & Delete Sale */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenInvoice(sale)}
                              className="p-1.5 rounded-lg bg-[#c5a059]/15 hover:bg-[#c5a059]/30 text-[#c5a059] transition-colors cursor-pointer border border-[#c5a059]/30"
                              title="Ver Factura de Venta"
                            >
                              <FileText size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteSale(sale)}
                              disabled={deletingId === sale.id}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer border border-rose-500/20 disabled:opacity-50"
                              title="Eliminar Venta"
                            >
                              <Trash2 size={14} className={deletingId === sale.id ? 'animate-pulse' : ''} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable items breakdown */}
                      {isExpanded && sale.items && sale.items.length > 0 && (
                        <tr className="bg-black/40 border-b border-white/5">
                          <td colSpan={6} className="p-4 pl-12">
                            <div className="space-y-2">
                              <span className="text-[10px] uppercase font-bold text-[#c5a059] tracking-wider block">
                                Productos incluidos en la venta:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {sale.items.map((it, idx) => (
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
                                        <span>{it.cantidad}x ${it.precio_unitario?.toFixed(2)}</span>
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

      {/* Invoice Modal for Sales */}
      {selectedInvoice && (
        <OfficialInvoiceModal order={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
    </div>
  );
};
