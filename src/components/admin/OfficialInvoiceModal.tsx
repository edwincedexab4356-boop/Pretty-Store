import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Truck,
  Package,
  ZoomIn,
  Eye,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  ShoppingCart,
  AlertCircle,
} from 'lucide-react';
import { Pedido } from '../../types/database';
import { StoredOrderReceipt, getOrderReceipt } from '../../utils/orderReceiptStorage';
import { getVoucherImageFromDb, memoryVoucherCache } from '../../utils/voucherDb';

interface OfficialInvoiceModalProps {
  order: Pedido | StoredOrderReceipt;
  voucherImage?: string | null;
  onClose: () => void;
  initialTab?: 'factura' | 'comprobante' | 'pedido';
}

export const OfficialInvoiceModal: React.FC<OfficialInvoiceModalProps> = ({
  order,
  voucherImage,
  onClose,
  initialTab = 'factura',
}) => {
  const [activeTab, setActiveTab] = useState<'factura' | 'comprobante' | 'pedido'>(initialTab);
  const [isZoomingVoucher, setIsZoomingVoucher] = useState(false);
  const [dbVoucherUrl, setDbVoucherUrl] = useState<string | null>(null);

  // Normalize order properties between Pedido and StoredOrderReceipt
  const isStored = 'orderNumber' in order;
  const orderNumber = isStored
    ? (order as StoredOrderReceipt).orderNumber
    : `#PED-${String(order.id || '').replace(/-/g, '').slice(0, 6).toUpperCase()}`;

  const rawOrderId = isStored ? (order as StoredOrderReceipt).orderId : String((order as any).id || '');
  const storedReceipt = getOrderReceipt(orderNumber) || (rawOrderId ? getOrderReceipt(rawOrderId) : null);

  useEffect(() => {
    let isMounted = true;
    const lookupKey = rawOrderId || orderNumber;
    if (lookupKey) {
      getVoucherImageFromDb(lookupKey).then((url) => {
        if (isMounted && url) setDbVoucherUrl(url);
      }).catch(() => {});
      if (orderNumber && orderNumber !== lookupKey) {
        getVoucherImageFromDb(orderNumber).then((url) => {
          if (isMounted && url) setDbVoucherUrl(url);
        }).catch(() => {});
      }
    }
    return () => {
      isMounted = false;
    };
  }, [rawOrderId, orderNumber]);

  const clientName = isStored
    ? (order as StoredOrderReceipt).nombre
    : (order as Pedido).cliente?.nombre || storedReceipt?.nombre || 'Cliente General';

  const clientPhone = isStored
    ? (order as StoredOrderReceipt).telefono
    : (order as Pedido).cliente?.telefono || storedReceipt?.telefono || '—';

  const clientEmail = isStored
    ? (order as StoredOrderReceipt).email
    : (order as Pedido).cliente?.email || storedReceipt?.email || '—';

  const address = isStored
    ? (order as StoredOrderReceipt).direccion
    : (order as Pedido).direccion || storedReceipt?.direccion || 'Entrega en tienda';

  const paymentMethod = isStored
    ? (order as StoredOrderReceipt).metodoPago
    : (order as Pedido).metodo_pago || storedReceipt?.metodoPago || 'yappy';

  const paymentLabel =
    paymentMethod === 'yappy'
      ? 'Yappy (6215-0251)'
      : paymentMethod === 'transferencia'
      ? 'Banco General (ACH)'
      : paymentMethod === 'tarjeta'
      ? 'Tarjeta de Débito o Crédito'
      : 'Efectivo';

  const subtotal = Number(order.subtotal || storedReceipt?.subtotal || 0);
  const total = Number(order.total || storedReceipt?.total || 0);
  const shipping = isStored
    ? Number((order as StoredOrderReceipt).shipping || 0)
    : storedReceipt?.shipping !== undefined
    ? Number(storedReceipt.shipping)
    : Math.max(0, total - subtotal);
  const discount = isStored
    ? Number((order as StoredOrderReceipt).discount || 0)
    : Number(storedReceipt?.discount || 0);

  const items =
    (isStored ? (order as StoredOrderReceipt).items : null) ||
    (((order as Pedido).detalles && (order as Pedido).detalles!.length > 0)
      ? (order as Pedido).detalles!.map((d) => ({
          product: {
            id: d.producto?.id || d.producto_id,
            nombre: d.producto?.nombre || (d as any).producto_nombre || 'Producto Pretty Store',
            precio: Number(d.precio_unitario || 0),
            imagen_url: d.producto?.imagen_url || (d as any).producto_imagen || '/images/products/gorra-1.webp',
          },
          quantity: d.cantidad || 1,
          subtotal: Number(d.subtotal || 0),
        }))
      : storedReceipt?.items || []);

  let voucherUrl =
    voucherImage ||
    dbVoucherUrl ||
    (isStored ? (order as StoredOrderReceipt).comprobanteUrl : null) ||
    storedReceipt?.comprobanteUrl ||
    memoryVoucherCache.get(orderNumber)?.url ||
    (rawOrderId ? memoryVoucherCache.get(rawOrderId)?.url : null) ||
    ((order as Pedido).comprobante_pago?.startsWith('data:') || (order as Pedido).comprobante_pago?.startsWith('http') || (order as Pedido).comprobante_pago?.startsWith('/') ? (order as Pedido).comprobante_pago : null) ||
    null;

  if (!voucherUrl && (order as Pedido).notas && typeof (order as Pedido).notas === 'string') {
    const match = (order as Pedido).notas!.match(/(https?:\/\/[^\s|]+(?:supabase\.co|storage)[^\s|]+|https?:\/\/[^\s|]+\.(?:jpg|jpeg|png|webp|gif)[^\s|]*|data:image\/[a-zA-Z]+;base64,[^\s|]+)/i);
    if (match) {
      voucherUrl = match[1];
    } else {
      const refMatch = (order as Pedido).notas!.match(/Comprobante\/Ref[^:]*:\s*([^\s|]+)/i);
      if (refMatch && (refMatch[1].startsWith('http') || refMatch[1].startsWith('data:'))) {
        voucherUrl = refMatch[1];
      }
    }
  }

  const formattedDate = isStored
    ? (order as StoredOrderReceipt).date || new Date().toLocaleDateString('es-PA')
    : (order as Pedido).created_at
    ? new Date((order as Pedido).created_at!).toLocaleDateString('es-PA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : storedReceipt?.date || new Date().toLocaleDateString('es-PA');

  const notes =
    (order as any).notas ||
    storedReceipt?.notas ||
    '';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0b0e] border border-white/15 rounded-2xl w-full max-w-3xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden relative text-white">
        {/* Header Actions Bar (No se imprime) */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-stone-950 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
            <span className="text-xs uppercase tracking-[0.2em] text-[#fbbf24] font-bold">
              Registro del Pedido y Factura
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
              {orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'factura' && (
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#fbbf24] hover:text-black text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Imprimir o guardar como PDF"
              >
                <Printer size={14} />
                <span className="hidden sm:inline">Imprimir Factura</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Sub-header Tabs de navegación */}
        <div className="px-4 py-2 border-b border-white/10 bg-stone-900/60 flex items-center gap-2 print:hidden overflow-x-auto text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('factura')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'factura'
                ? 'bg-[#fbbf24] text-black font-semibold shadow-sm'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText size={13} />
            <span>Factura Oficial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comprobante')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'comprobante'
                ? 'bg-[#fbbf24] text-black font-semibold shadow-sm'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIcon size={13} />
            <span>Captura de Comprobante</span>
            {voucherUrl ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5 animate-pulse" title="Captura adjunta" />
            ) : (
              <span className="text-[10px] text-stone-500 font-mono">(Sin captura)</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pedido')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'pedido'
                ? 'bg-[#fbbf24] text-black font-semibold shadow-sm'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingCart size={13} />
            <span>Captura del Pedido ({items.length} prod.)</span>
          </button>
        </div>

        {/* CONTENIDO DE LA PESTAÑA: FACTURA OFICIAL */}
        {activeTab === 'factura' && (
          <div className="overflow-y-auto p-6 sm:p-8 space-y-6 text-xs font-sans print:p-8 print:text-black print:bg-white">
            {/* Cabecera de la Factura */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-white/10 print:border-black/20">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-black border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src="/images/logo/logotipo.jpeg"
                      alt="Pretty Store"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif-luxury font-black text-white uppercase tracking-wider print:text-black">
                      PRETTY STORE
                    </h2>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-[#fbbf24] font-semibold print:text-stone-700">
                      Almacén y accesorio urbano · Panamá
                    </p>
                  </div>
                </div>
                <p className="text-stone-400 text-[11px] mt-2 font-light print:text-stone-600">
                  WhatsApp Oficial: +507 6215-0251 · Instagram: @pretty_store_pty
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 block font-semibold print:text-stone-600">
                  RECIBO OFICIAL DE COMPRA
                </span>
                <p className="text-xl sm:text-2xl font-mono font-black text-[#fbbf24] print:text-black">
                  {orderNumber}
                </p>
                <p className="text-stone-400 text-[11px] font-mono print:text-stone-700">
                  Fecha: {formattedDate}
                </p>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold mt-1 print:border-emerald-600 print:text-emerald-800">
                  <ShieldCheck size={11} />
                  <span>Pedido Registrado</span>
                </span>
              </div>
            </div>

            {/* Datos del Cliente y Modalidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/10 print:border-black/20 print:bg-stone-50">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#fbbf24] font-bold block print:text-stone-800">
                  Datos del Cliente
                </span>
                <div className="flex items-center gap-2 text-stone-200 print:text-black">
                  <User size={13} className="text-stone-400 shrink-0" />
                  <span className="font-bold text-sm text-white print:text-black">{clientName}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-300 print:text-stone-700">
                  <Phone size={13} className="text-stone-400 shrink-0" />
                  <span className="font-mono">{clientPhone}</span>
                </div>
                {clientEmail && clientEmail !== '—' && (
                  <div className="flex items-center gap-2 text-stone-300 print:text-stone-700">
                    <Mail size={13} className="text-stone-400 shrink-0" />
                    <span className="truncate">{clientEmail}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#fbbf24] font-bold block print:text-stone-800">
                  Entrega y Pago
                </span>
                <div className="flex items-center gap-2 text-stone-200 print:text-black">
                  <CreditCard size={13} className="text-[#fbbf24] shrink-0" />
                  <span className="font-semibold text-white print:text-black">
                    Método de Pago: <strong className="text-[#fbbf24] print:text-black">{paymentLabel}</strong>
                  </span>
                </div>
                <div className="flex items-start gap-2 text-stone-300 print:text-stone-700">
                  <MapPin size={13} className="text-[#fbbf24] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white print:text-black">Dirección de Entrega:</span>
                    <p className="text-[11px] text-stone-400 leading-snug print:text-stone-800">{address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de Productos */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-stone-300 font-bold block print:text-stone-800">
                Detalle de Productos ({items.length})
              </span>

              <div className="rounded-xl border border-white/10 overflow-hidden print:border-black/20">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-stone-400 uppercase text-[10px] print:bg-stone-100 print:text-black print:border-black/20">
                    <tr>
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-3 text-center">Cant.</th>
                      <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 print:divide-black/10">
                    {items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={it.product.imagen_url || '/images/products/gorra-1.webp'}
                              alt={it.product.nombre}
                              className="w-10 h-10 rounded-lg object-cover bg-black border border-white/10 print:hidden shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.src.endsWith('/images/products/gorra-1.webp')) {
                                  target.src = '/images/products/gorra-1.webp';
                                }
                              }}
                            />
                            <span className="font-semibold text-white print:text-black">{it.product.nombre}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-medium text-stone-300 print:text-black">
                          {it.quantity}x
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-stone-300 print:text-black">
                          ${it.product.precio.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white print:text-black">
                          ${it.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Desglose Financiero */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-72 space-y-2 p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs font-mono print:border-black/20 print:bg-stone-50">
                <div className="flex justify-between text-stone-400 print:text-stone-700">
                  <span>Subtotal productos:</span>
                  <span className="text-white font-medium print:text-black">${subtotal.toFixed(2)} USD</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 print:text-emerald-800">
                    <span>Descuento aplicado:</span>
                    <span>-${discount.toFixed(2)} USD</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-400 print:text-stone-700">
                  <span>Costo estimado de envío:</span>
                  <span className="text-[#fbbf24] font-bold print:text-black">
                    {shipping > 0 ? `+$${shipping.toFixed(2)} USD` : 'Gratis ($0.00)'}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 print:border-black/20 flex justify-between items-center text-sm font-bold">
                  <span className="text-white uppercase tracking-wider text-xs print:text-black">TOTAL CANCELADO:</span>
                  <span className="text-lg font-mono text-[#fbbf24] font-black print:text-black">
                    ${total.toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>

            {/* Captura del Comprobante Miniatura en Factura */}
            <div className="pt-4 border-t border-white/10 print:border-black/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-[#fbbf24] font-bold block print:text-stone-800">
                  Captura del Comprobante de Pago
                </span>
                {voucherUrl ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('comprobante')}
                    className="text-[11px] text-[#fbbf24] hover:underline flex items-center gap-1 font-semibold print:hidden cursor-pointer"
                  >
                    <span>Ver en pestaña dedicada</span>
                    <Eye size={12} />
                  </button>
                ) : null}
              </div>

              {voucherUrl ? (
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center gap-4">
                  <div
                    onClick={() => setIsZoomingVoucher(true)}
                    className="relative group cursor-pointer shrink-0 rounded-xl overflow-hidden border border-white/20 hover:border-[#fbbf24] transition-all bg-black"
                  >
                    <img
                      src={voucherUrl}
                      alt="Comprobante de Pago"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] gap-1 font-semibold">
                      <ZoomIn size={14} />
                      <span>Ampliar</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-white">Comprobante guardado con éxito</p>
                    <p className="text-[11px] text-stone-400 font-light">
                      La captura fue recibida y vinculada al pedido <strong>{orderNumber}</strong>.
                    </p>
                    <div className="flex items-center gap-2 pt-1 print:hidden">
                      <button
                        onClick={() => setIsZoomingVoucher(true)}
                        className="px-2.5 py-1 rounded bg-[#fbbf24] text-black font-semibold text-[11px] flex items-center gap-1 hover:bg-[#f59e0b] cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>Ver en grande</span>
                      </button>
                      <a
                        href={voucherUrl}
                        download={`comprobante_${orderNumber}.jpg`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded border border-white/20 text-stone-300 hover:text-white text-[11px] flex items-center gap-1"
                      >
                        <Download size={12} />
                        <span>Descargar</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-light">
                  Sin captura adjuntada digitalmente en el checkout (pago presencial o enviado directo a WhatsApp).
                </div>
              )}
            </div>

            {/* AVISO LEGAL Y CONDICIÓN DE STOCK EN FACTURA OFICIAL */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs print:bg-stone-100 print:border-black/20 print:text-black space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-300 print:text-black text-[11px] uppercase tracking-wider">
                <AlertCircle size={15} className="shrink-0 text-amber-400 print:text-black" />
                <span>Aviso de Disponibilidad e Inventario:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-200/90 print:text-stone-800 font-light">
                En caso de que algún producto solicitado se agote o quede fuera de stock al momento de procesar y empacar su orden, <strong>Pretty Store le contactará directamente por WhatsApp</strong> para coordinar oportunamente la devolución íntegra de su dinero o el cambio del producto por otro artículo de igual precio, según su preferencia.
              </p>
            </div>
          </div>
        )}

        {/* CONTENIDO DE LA PESTAÑA: CAPTURA DEL COMPROBANTE DE PAGO */}
        {activeTab === 'comprobante' && (
          <div className="overflow-y-auto p-6 sm:p-8 space-y-6 text-xs font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#fbbf24] font-bold block mb-1">
                  Comprobante Oficial de Pago
                </span>
                <h3 className="text-lg font-serif-luxury font-bold text-white">
                  Captura Enviada por el Cliente ({clientName})
                </h3>
                <p className="text-xs text-stone-400 font-light mt-0.5">
                  Pedido {orderNumber} · Monto Total: <strong className="text-white">${total.toFixed(2)}</strong> ({paymentLabel})
                </p>
              </div>

              {voucherUrl && (
                <div className="flex items-center gap-2">
                  <a
                    href={voucherUrl}
                    download={`comprobante_${orderNumber}.jpg`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#fbbf24]/20"
                  >
                    <Download size={14} />
                    <span>Descargar Imagen</span>
                  </a>
                  <button
                    onClick={() => setIsZoomingVoucher(true)}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ZoomIn size={14} />
                    <span>Zoom Completo</span>
                  </button>
                </div>
              )}
            </div>

            {voucherUrl ? (
              <div className="space-y-4">
                <div className="flex justify-center bg-black/60 rounded-2xl p-4 sm:p-6 border border-white/10">
                  <div
                    onClick={() => setIsZoomingVoucher(true)}
                    className="relative group cursor-zoom-in max-w-full max-h-[60vh] rounded-xl overflow-hidden border border-white/20 shadow-2xl"
                  >
                    <img
                      src={voucherUrl}
                      alt={`Comprobante ${orderNumber}`}
                      className="max-h-[58vh] max-w-full object-contain mx-auto"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-2 font-semibold">
                      <ZoomIn size={20} />
                      <span>Haz clic para pantalla completa</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                    <span className="text-[10px] uppercase text-stone-400 block mb-1">Cliente</span>
                    <strong className="text-white block truncate">{clientName}</strong>
                    <span className="text-stone-400 font-mono text-[11px]">{clientPhone}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                    <span className="text-[10px] uppercase text-stone-400 block mb-1">Método Verificado</span>
                    <strong className="text-[#fbbf24] block">{paymentLabel}</strong>
                    <span className="text-emerald-400 text-[11px] font-mono">Monto: ${total.toFixed(2)}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                    <span className="text-[10px] uppercase text-stone-400 block mb-1">Estado en Servidor</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 size={13} />
                      <span>Captura Almacenada</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center space-y-3 bg-white/[0.02] border border-white/10 rounded-2xl">
                <ImageIcon size={40} className="mx-auto text-stone-600 mb-2" />
                <h4 className="text-base font-semibold text-white">No se encontró captura digital</h4>
                <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
                  El cliente realizó el pedido sin subir captura en la web (posiblemente enviado directo a tu WhatsApp de ventas o pago al retirar).
                </p>
              </div>
            )}
          </div>
        )}

        {/* CONTENIDO DE LA PESTAÑA: CAPTURA Y RESUMEN DEL PEDIDO (HOJITA) */}
        {activeTab === 'pedido' && (
          <div className="overflow-y-auto p-6 sm:p-8 space-y-6 text-xs font-sans">
            <div className="pb-4 border-b border-white/10">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#fbbf24] font-bold block mb-1">
                Hoja de Resumen del Pedido
              </span>
              <h3 className="text-lg font-serif-luxury font-bold text-white">
                Detalle Exacto que Vio el Cliente al Comprar
              </h3>
              <p className="text-xs text-stone-400 font-light mt-0.5">
                Número Oficial: <strong className="text-white font-mono">{orderNumber}</strong> · Fecha: {formattedDate}
              </p>
            </div>

            {/* Tarjeta de Resumen con estilo exacto de la tienda */}
            <div className="bg-[#141416] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold text-[#fbbf24] uppercase tracking-wider">
                  Productos en la Orden ({items.reduce((acc, i) => acc + (i.quantity || 1), 0)} unidades)
                </span>
                <span className="text-xs font-mono text-stone-400">{formattedDate}</span>
              </div>

              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {it.product.imagen_url ? (
                        <img
                          src={it.product.imagen_url}
                          alt={it.product.nombre}
                          className="w-12 h-12 rounded-xl object-cover bg-stone-900 border border-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-stone-900 border border-white/10 flex items-center justify-center text-stone-600">
                          <Package size={18} />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-white text-xs">{it.product.nombre}</h4>
                        <p className="text-[11px] text-stone-400 font-light mt-0.5">
                          Cantidad: <strong className="text-stone-200">{it.quantity}x</strong> a ${it.product.precio.toFixed(2)} c/u
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm text-[#fbbf24]">
                      ${it.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Datos de Entrega y Envío */}
              <div className="p-4 rounded-xl bg-stone-950 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-stone-200">
                  <Truck size={14} className="text-[#fbbf24] shrink-0" />
                  <span className="font-semibold text-white">Logística de Entrega:</span>
                </div>
                <p className="text-xs text-stone-300 font-light pl-5">{address}</p>

                {notes && (
                  <div className="pt-2 border-t border-white/10 mt-2">
                    <span className="text-[11px] text-stone-400 block mb-0.5">Instrucciones y Notas del Pedido:</span>
                    <p className="text-xs text-[#fbbf24] font-mono bg-black/40 p-2.5 rounded-lg border border-white/5">
                      {notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Total final */}
              <div className="flex justify-between items-center pt-3 border-t border-white/10 text-sm">
                <div>
                  <span className="text-stone-400 text-xs block">Subtotal: ${subtotal.toFixed(2)}</span>
                  {shipping > 0 && <span className="text-stone-400 text-xs block">Envío: +${shipping.toFixed(2)}</span>}
                  {discount > 0 && <span className="text-emerald-400 text-xs block">Descuento: -${discount.toFixed(2)}</span>}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Total del Pedido</span>
                  <span className="text-xl font-bold font-mono text-[#fbbf24]">
                    ${total.toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Zoom de la Captura en Pantalla Completa */}
        {isZoomingVoucher && voucherUrl && (
          <div
            onClick={() => setIsZoomingVoucher(false)}
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
          >
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
              <button
                onClick={() => setIsZoomingVoucher(false)}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/70 text-white hover:bg-white/20 cursor-pointer"
              >
                <X size={20} />
              </button>
              <img
                src={voucherUrl}
                alt="Comprobante Completo"
                className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl border border-white/20"
              />
              <span className="text-stone-400 text-xs mt-2 font-mono">
                {orderNumber} · Captura Original de Comprobante
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
