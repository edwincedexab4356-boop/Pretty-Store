import React, { useState, useEffect, useRef } from 'react';
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
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Eye,
  MessageCircle,
  Package,
  Truck,
  Download,
  Upload,
  ZoomIn,
} from 'lucide-react';
import { getAdminClients, deleteAdminClient, getAdminOrders } from '../../../services/adminService';
import { Cliente, Pedido } from '../../../types/database';
import { isPermissionError, SUPABASE_UNLOCK_DELETE_SQL } from '../../../utils/supabaseSqlFix';
import { PermissionErrorBanner } from '../PermissionErrorBanner';
import { OfficialInvoiceModal } from '../OfficialInvoiceModal';
import {
  StoredOrderReceipt,
  getClientReceipts,
  getOrderReceipt,
  updateOrderVoucher,
} from '../../../utils/orderReceiptStorage';
import { compressImageFile } from '../../../utils/imageOptimizer';

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
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
    showSqlTip?: boolean;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Ficha y Pedidos del Cliente Seleccionado
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [clientOrders, setClientOrders] = useState<(Pedido | StoredOrderReceipt)[]>([]);
  const [isLoadingClientOrders, setIsLoadingClientOrders] = useState(false);

  // Factura y Comprobantes
  const [invoiceOrder, setInvoiceOrder] = useState<Pedido | StoredOrderReceipt | null>(null);
  const [invoiceInitialTab, setInvoiceInitialTab] = useState<'factura' | 'comprobante' | 'pedido'>('factura');
  const [isUploadingVoucher, setIsUploadingVoucher] = useState(false);
  const voucherFileInputRef = useRef<HTMLInputElement | null>(null);

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_UNLOCK_DELETE_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

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

  // Cargar pedidos y comprobantes del cliente seleccionado
  useEffect(() => {
    if (!selectedClient) {
      setClientOrders([]);
      return;
    }

    const fetchOrdersForClient = async () => {
      setIsLoadingClientOrders(true);
      // 1. Obtener recibos locales guardados para este cliente
      const localReceipts = getClientReceipts(
        selectedClient.telefono,
        selectedClient.nombre,
        selectedClient.email
      );

      // 2. Obtener pedidos desde Supabase
      try {
        const allOrders = await getAdminOrders();
        const cIdStr = String(selectedClient.id || '');
        const cleanPhone = selectedClient.telefono?.replace(/\D/g, '') || '';
        const cleanEmail = selectedClient.email?.trim().toLowerCase() || '';

        const dbOrders = allOrders.filter((o) => {
          if (o.cliente_id && String(o.cliente_id) === cIdStr) return true;
          const oPhone = o.cliente?.telefono?.replace(/\D/g, '') || '';
          const oEmail = o.cliente?.email?.trim().toLowerCase() || '';
          if (cleanPhone && oPhone && (cleanPhone.includes(oPhone) || oPhone.includes(cleanPhone))) return true;
          if (cleanEmail && oEmail && oEmail !== '—' && cleanEmail === oEmail) return true;
          return false;
        });

        // Combinar evitando duplicados
        const combined: (Pedido | StoredOrderReceipt)[] = [...dbOrders];
        localReceipts.forEach((lr) => {
          const alreadyExists = combined.some((c) => {
            const cId = 'id' in c ? String(c.id) : (c as StoredOrderReceipt).orderId;
            const cNum = 'orderNumber' in c ? (c as StoredOrderReceipt).orderNumber : `#PED-${String((c as Pedido).id).replace(/-/g, '').slice(0, 6).toUpperCase()}`;
            return cId === lr.orderId || cNum === lr.orderNumber;
          });
          if (!alreadyExists) {
            combined.push(lr);
          }
        });

        setClientOrders(combined);
      } catch (err) {
        console.warn('Error fetching client orders:', err);
        setClientOrders(localReceipts);
      } finally {
        setIsLoadingClientOrders(false);
      }
    };

    fetchOrdersForClient();
  }, [selectedClient]);

  const handleOpenInvoice = (order: Pedido | StoredOrderReceipt, tab: 'factura' | 'comprobante' | 'pedido' = 'factura') => {
    setInvoiceOrder(order);
    setInvoiceInitialTab(tab);
  };

  const handleUploadVoucherForClientOrder = async (e: React.ChangeEvent<HTMLInputElement>, orderIdOrNumber: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setFeedback({ type: 'error', text: 'La imagen supera los 20MB permitidos.' });
      return;
    }

    setIsUploadingVoucher(true);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.82,
      });

      await updateOrderVoucher(orderIdOrNumber, compressed.dataUrl, file.name);

      setClientOrders((prev) =>
        prev.map((o) => {
          const oId = 'id' in o ? String(o.id) : (o as StoredOrderReceipt).orderId;
          const oNum = 'orderNumber' in o ? (o as StoredOrderReceipt).orderNumber : '';
          if (oId === orderIdOrNumber || oNum === orderIdOrNumber) {
            if ('comprobante_pago' in o) {
              return { ...o, comprobante_pago: compressed.dataUrl };
            } else {
              return { ...o, comprobanteUrl: compressed.dataUrl };
            }
          }
          return o;
        })
      );

      setFeedback({
        type: 'success',
        text: '¡Captura del comprobante adjuntada y guardada en la ficha del cliente con éxito!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Error al guardar la captura del comprobante.',
      });
    } finally {
      setIsUploadingVoucher(false);
      if (voucherFileInputRef.current) voucherFileInputRef.current.value = '';
    }
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    setFeedback(null);
    try {
      const res = await deleteAdminClient(clientToDelete.id);
      setClients((prev) => prev.filter((c) => String(c.id) !== String(clientToDelete.id)));
      if (res?.localOnly) {
        setFeedback({
          type: 'error',
          text: `Supabase bloqueó el borrado de "${clientToDelete.nombre}" en la base de datos (Error 42501: Falta permiso DELETE en PostgreSQL). Se ocultó temporalmente en este navegador. Para que se borre directamente en Supabase, ejecuta el comando SQL abajo.`,
          showSqlTip: true,
        });
      } else {
        setFeedback({
          type: 'success',
          text: `El cliente "${clientToDelete.nombre}" ha sido eliminado exitosamente y directamente de la base de datos de Supabase.`,
        });
      }
      setClientToDelete(null);
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'No se pudo eliminar el cliente.',
        showSqlTip: true,
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
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div className="space-y-1">
              <span>{feedback.text}</span>
              {feedback.showSqlTip && (
                <p className="text-[11px] text-stone-300 font-light leading-relaxed">
                  Para que Supabase borre físicamente el cliente en la base de datos sin error 42501, presiona <strong className="text-white">"Copiar Comando SQL"</strong> y ejecútalo en tu <strong>Supabase Dashboard ➔ SQL Editor</strong>.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {feedback.showSqlTip && (
              <button
                type="button"
                onClick={copySqlToClipboard}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] flex items-center gap-1.5 transition-all cursor-pointer border border-white/15"
                title="Copiar comando GRANT ALL para Supabase SQL Editor"
              >
                {copiedSql ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} className="text-[#c5a059]" />
                    <span>Copiar Comando SQL</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setFeedback(null)}
              className="text-stone-400 hover:text-white p-1 rounded cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
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

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {onOpenSqlFix && (
            <button
              onClick={() => onOpenSqlFix('Desbloquear permisos de eliminación en Supabase')}
              className="px-3.5 py-2.5 rounded-xl bg-[#c5a059]/15 hover:bg-[#c5a059]/25 text-[#c5a059] hover:text-white text-xs font-semibold border border-[#c5a059]/40 flex items-center gap-2 cursor-pointer transition-all shadow-sm"
              title="Ver instrucciones y script SQL para autorizar eliminación en Supabase"
            >
              <span>Desbloquear Borrados (SQL)</span>
            </button>
          )}

          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-stone-200 hover:text-white text-xs font-medium border border-white/[0.08] flex items-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#c5a059]' : 'text-stone-400'} />
            <span>Actualizar Clientes</span>
          </button>
        </div>
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
                        <div
                          onClick={() => setSelectedClient(client)}
                          className="font-medium text-white text-sm hover:text-[#c5a059] cursor-pointer transition-colors inline-block"
                          title="Haz clic para ver el expediente y pedidos de este cliente"
                        >
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
                        <span
                          onClick={() => setSelectedClient(client)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono text-stone-300 hover:border-[#c5a059]/40 cursor-pointer transition-colors"
                          title="Ver pedidos de este cliente"
                        >
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedClient(client)}
                            className="px-3 py-1.5 rounded-xl bg-[#c5a059]/10 hover:bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Ver ficha, pedidos, capturas y facturas oficiales del cliente"
                          >
                            <FileText size={13} />
                            <span>Ver Pedidos</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setClientToDelete(client)}
                            className="p-1.5 rounded-xl text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Eliminar cliente"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FICHA COMPLETA DEL CLIENTE, PEDIDOS Y COMPROBANTES */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0e0e12] border border-white/10 rounded-2xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
              <div>
                <span className="text-[10px] uppercase font-medium tracking-wider text-[#c5a059] block">
                  Ficha del Cliente & Historial de Compras
                </span>
                <h3 className="text-xl sm:text-2xl font-serif-luxury font-semibold text-white">
                  {selectedClient.nombre}
                </h3>
                <span className="text-xs text-stone-400 font-mono">
                  ID: {String(selectedClient.id || '')}
                </span>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Datos de Contacto y Métricas */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-[#c5a059] uppercase tracking-wider block">
                  Información y Contacto
                </span>
                {selectedClient.telefono && (
                  <a
                    href={`https://wa.me/${selectedClient.telefono.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageCircle size={13} />
                    <span>Contactar por WhatsApp</span>
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-stone-300">
                  <Phone size={14} className="text-[#c5a059] shrink-0" />
                  <span>{selectedClient.telefono || 'Sin teléfono registrado'}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-300">
                  <Mail size={14} className="text-[#c5a059] shrink-0" />
                  <span>{selectedClient.email || 'Sin correo electrónico'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06] text-xs">
                <div className="flex items-start gap-2 text-stone-300 font-light">
                  <MapPin size={14} className="text-[#c5a059] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-200 font-medium">Dirección habitual:</strong>{' '}
                    {selectedClient.direccion || 'Sin dirección registrada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Resumen de Compras del Cliente */}
            <div className="grid grid-cols-3 gap-3 mb-6 text-center">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] uppercase text-stone-400 block mb-1">Pedidos Totales</span>
                <span className="text-lg font-mono font-bold text-white">
                  {clientOrders.length || selectedClient.pedidos_count || 0}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] uppercase text-stone-400 block mb-1">Total Gastado</span>
                <span className="text-lg font-mono font-bold text-emerald-400">
                  {formatMoney(selectedClient.total_gastado || 0)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] uppercase text-stone-400 block mb-1">Última Actividad</span>
                <span className="text-xs font-mono text-stone-300 block truncate mt-1">
                  {selectedClient.ultimo_pedido
                    ? new Date(selectedClient.ultimo_pedido).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
            </div>

            {/* LISTA DE PEDIDOS, FACTURAS Y COMPROBANTES DE ESTE CLIENTE */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <h4 className="text-xs uppercase font-bold tracking-wider text-white flex items-center gap-2">
                  <ShoppingBag size={14} className="text-[#c5a059]" />
                  <span>Pedidos y Comprobantes de Este Cliente ({clientOrders.length})</span>
                </h4>
              </div>

              {isLoadingClientOrders ? (
                <div className="p-8 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                  <RefreshCw size={15} className="animate-spin text-[#c5a059]" />
                  <span>Cargando historial de pedidos y facturas...</span>
                </div>
              ) : clientOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400 space-y-2 bg-white/[0.02] border border-white/10 rounded-xl">
                  <Package size={28} className="mx-auto text-stone-600 mb-1" />
                  <p className="font-semibold text-white">No hay pedidos registrados para este cliente</p>
                  <p className="text-stone-500 font-light text-[11px]">
                    Cuando este cliente compre en la tienda web con su número o correo, sus órdenes y comprobantes aparecerán aquí.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientOrders.map((ord, idx) => {
                    const isStored = 'orderNumber' in ord;
                    const orderNum = isStored
                      ? (ord as StoredOrderReceipt).orderNumber
                      : `#PED-${String((ord as Pedido).id || '').replace(/-/g, '').slice(0, 6).toUpperCase()}`;

                    const rawId = isStored ? (ord as StoredOrderReceipt).orderId : String((ord as Pedido).id);
                    const storedReceipt = getOrderReceipt(orderNum) || getOrderReceipt(rawId);

                    const orderDate = isStored
                      ? (ord as StoredOrderReceipt).date
                      : (ord as Pedido).created_at
                      ? new Date((ord as Pedido).created_at!).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—';

                    const orderTotal = Number(ord.total || 0);
                    const orderStatus = isStored ? 'confirmado' : (ord as Pedido).estado;

                    const voucher =
                      (isStored ? (ord as StoredOrderReceipt).comprobanteUrl : null) ||
                      storedReceipt?.comprobanteUrl ||
                      (('comprobante_pago' in ord &&
                        ((ord as Pedido).comprobante_pago?.startsWith('data:') ||
                          (ord as Pedido).comprobante_pago?.startsWith('http') ||
                          (ord as Pedido).comprobante_pago?.startsWith('/')))
                        ? (ord as Pedido).comprobante_pago
                        : null);

                    const itemsList = isStored
                      ? (ord as StoredOrderReceipt).items || []
                      : ((ord as Pedido).detalles || []).map((d) => ({
                          product: {
                            id: d.producto?.id || d.producto_id,
                            nombre: d.producto?.nombre || 'Producto',
                            precio: Number(d.precio_unitario || 0),
                            imagen_url: d.producto?.imagen_url,
                          },
                          quantity: d.cantidad || 1,
                          subtotal: Number(d.subtotal || 0),
                        }));

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3 hover:border-white/20 transition-all"
                      >
                        {/* Cabecera del Pedido */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/[0.06]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[#c5a059]">{orderNum}</span>
                            <span className="text-[11px] text-stone-400 font-light">· {orderDate}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase font-mono ${
                                orderStatus === 'entregado'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : orderStatus === 'cancelado'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              }`}
                            >
                              {orderStatus}
                            </span>
                            <span className="font-mono font-bold text-sm text-white">
                              {formatMoney(orderTotal)}
                            </span>
                          </div>
                        </div>

                        {/* Productos del pedido y Comprobante */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {/* Columna de Productos */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-semibold text-stone-400 block">
                              Artículos Comprados ({itemsList.length})
                            </span>
                            {itemsList.slice(0, 3).map((it, itemIdx) => (
                              <div key={itemIdx} className="flex items-center justify-between text-[11px] text-stone-300">
                                <span className="truncate max-w-[180px]">{it.product.nombre}</span>
                                <span className="font-mono text-stone-400">{it.quantity}x (${it.product.precio.toFixed(2)})</span>
                              </div>
                            ))}
                            {itemsList.length > 3 && (
                              <span className="text-[10px] text-[#c5a059] block font-light">
                                +{itemsList.length - 3} producto(s) más
                              </span>
                            )}
                          </div>

                          {/* Columna de Comprobante / Captura */}
                          <div className="space-y-1.5 sm:border-l sm:border-white/[0.06] sm:pl-3">
                            <span className="text-[10px] uppercase font-semibold text-stone-400 block">
                              Captura del Comprobante
                            </span>
                            {voucher ? (
                              <div className="flex items-center gap-2.5">
                                <div
                                  onClick={() => handleOpenInvoice(ord, 'comprobante')}
                                  className="relative group cursor-pointer w-12 h-12 rounded-lg overflow-hidden border border-white/20 hover:border-[#c5a059] shrink-0 bg-black"
                                >
                                  <img
                                    src={voucher}
                                    alt="Comprobante"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                    <ZoomIn size={12} />
                                  </div>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                                    <CheckCircle2 size={11} />
                                    <span>Captura guardada</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenInvoice(ord, 'comprobante')}
                                    className="text-[10px] text-[#c5a059] hover:underline block cursor-pointer"
                                  >
                                    Ver en grande / Descargar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="text-[11px] text-stone-500 block">Sin captura adjunta</span>
                                <label className="inline-flex items-center gap-1 text-[10px] text-[#c5a059] hover:underline cursor-pointer">
                                  <Upload size={10} />
                                  <span>{isUploadingVoucher ? 'Guardando...' : 'Adjuntar captura recibida'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={isUploadingVoucher}
                                    ref={voucherFileInputRef}
                                    onChange={(e) => handleUploadVoucherForClientOrder(e, rawId)}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Botones de acción del pedido */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06] flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenInvoice(ord, 'factura')}
                            className="px-2.5 py-1.5 rounded-lg bg-[#c5a059]/10 hover:bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Ver Factura Oficial Imprimible de este pedido"
                          >
                            <FileText size={12} />
                            <span>Factura Oficial</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenInvoice(ord, 'comprobante')}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                              voucher
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-white/[0.04] hover:bg-white/[0.08] text-stone-400 border-white/[0.08]'
                            }`}
                            title="Ver captura del comprobante enviada por el cliente"
                          >
                            <ImageIcon size={12} />
                            <span>{voucher ? 'Ver Captura' : 'Adjuntar Captura'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenInvoice(ord, 'pedido')}
                            className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 border border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Ver resumen y hoja del pedido"
                          >
                            <ShoppingBag size={12} />
                            <span>Hoja de Pedido</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
      {/* Modal de Factura Oficial, Captura de Comprobante y Hoja del Pedido */}
      {invoiceOrder && (
        <OfficialInvoiceModal
          order={invoiceOrder}
          initialTab={invoiceInitialTab}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
};
