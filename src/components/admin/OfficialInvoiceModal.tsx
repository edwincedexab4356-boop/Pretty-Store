import React, { useState } from 'react';
import { X, Printer, Download, Check, ShieldCheck, Eye, ExternalLink, Upload, AlertCircle, RefreshCw } from 'lucide-react';
import { Pedido } from '../../types/database';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { getPrimaryProductImage } from '../../utils/productImages';
import { supabase } from '../../lib/supabase';

interface OfficialInvoiceModalProps {
  order: Pedido | null;
  onClose: () => void;
  initialTab?: 'factura' | 'comprobante';
}

export const OfficialInvoiceModal: React.FC<OfficialInvoiceModalProps> = ({ order, onClose, initialTab = 'factura' }) => {
  const { config } = useStoreConfig();
  const [activeTab, setActiveTab] = useState<'factura' | 'comprobante'>(initialTab);
  const [imgError, setImgError] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fallback voucher resolution
  let initialVoucherUrl = order?.comprobante_pago || null;
  if (!initialVoucherUrl && order?.notas) {
    const match = order.notas.match(/https?:\/\/[^\s"',]+\.(jpg|jpeg|png|webp|pdf)/i) || order.notas.match(/\/uploads\/[^\s"',]+/i);
    if (match) {
      initialVoucherUrl = match[0];
    }
  }
  if (initialVoucherUrl && typeof initialVoucherUrl === 'string' && initialVoucherUrl.startsWith('/') && typeof window !== 'undefined') {
    initialVoucherUrl = `${window.location.origin}${initialVoucherUrl}`;
  }

  const [currentVoucher, setCurrentVoucher] = useState<string | null>(initialVoucherUrl);

  if (!order) return null;

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });

      if (!base64) throw new Error('No se pudo leer el archivo.');

      const clientOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const orderNum = order.numero_orden || String(order.id);
      const res = await fetch('/api/upload-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          orderNumber: orderNum,
          clientOrigin,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newUrl = data.url;
        setCurrentVoucher(newUrl);
        setImgError(false);
        // Persistir en Supabase
        try {
          await supabase.from('pedidos').update({ comprobante_pago: newUrl }).eq('id', String(order.id));
        } catch {
          // ignore
        }
        // Persistir en el servidor
        try {
          await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...order, comprobante_pago: newUrl }),
          });
        } catch {
          // ignore
        }
      } else {
        alert('Error al subir el comprobante.');
      }
    } catch (err: any) {
      alert('Error al procesar archivo: ' + (err?.message || 'Error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const clientName = order.cliente?.nombre || 'Cliente';
  const clientPhone = order.cliente?.telefono || '—';
  const clientAddress = order.cliente?.direccion || '—';
  const orderNumber = order.numero_orden || String(order.id || '').slice(0, 8);
  const items = order.items || [];
  
  const voucherUrl = currentVoucher;
  const isPdf = typeof voucherUrl === 'string' && (voucherUrl.toLowerCase().endsWith('.pdf') || voucherUrl.includes('application/pdf'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn print:p-0 print:bg-white print:fixed">
      <div className="bg-[#100f14] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black print:max-h-full print:rounded-none animate-scaleUp">
        {/* Modal Top Actions (hidden in print) */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('factura')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                activeTab === 'factura' ? 'bg-[#c5a059] text-black shadow-md shadow-[#c5a059]/20' : 'text-stone-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Factura Oficial
            </button>
            <button
              onClick={() => setActiveTab('comprobante')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                activeTab === 'comprobante' ? 'bg-[#c5a059] text-black shadow-md shadow-[#c5a059]/20' : 'text-stone-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Captura de Pago</span>
              {voucherUrl && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 hover:scale-105"
            >
              <Printer size={14} />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 cursor-pointer transition-all duration-300 hover:rotate-90 active:scale-90"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* FACTURA TAB */}
        {activeTab === 'factura' && (
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-stone-300 print:text-black print:p-8">
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-6 print:border-black/20">
              <div className="space-y-1">
                <span className="font-serif-luxury font-bold text-xl sm:text-2xl text-white print:text-black block">
                  {config.nombre_tienda || 'PRETTY STORE'}
                </span>
                <p className="text-[11px] text-stone-400 print:text-stone-600 font-light">
                  {config.descripcion || 'Boutique Exclusiva de Moda y Accesorios'}
                </p>
                <p className="text-[11px] text-stone-400 print:text-stone-600">
                  Tel: {config.telefono || '+507 6215-0251'} · {config.direccion || 'Panamá'}
                </p>
              </div>

              <div className="text-right space-y-1">
                <span className="px-3 py-1 rounded-full bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/30 font-mono font-bold text-xs uppercase print:border-black print:text-black">
                  Factura Oficial
                </span>
                <p className="text-sm font-mono font-bold text-white print:text-black mt-2">
                  #{orderNumber}
                </p>
                <p className="text-[11px] text-stone-400 print:text-stone-600 font-light">
                  {order.created_at ? new Date(order.created_at).toLocaleString('es-PA') : 'Fecha reciente'}
                </p>
              </div>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-black/40 border border-white/10 print:bg-transparent print:border-black/20">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#c5a059] print:text-black block mb-1">
                  Facturado A:
                </span>
                <strong className="text-white print:text-black block text-sm">{clientName}</strong>
                <span className="text-stone-400 print:text-stone-700 block mt-0.5">Tel: {clientPhone}</span>
                {clientAddress && clientAddress !== '—' && (
                  <span className="text-stone-400 print:text-stone-700 block mt-0.5">Dir: {clientAddress}</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#c5a059] print:text-black block mb-1">
                  Modalidad de Entrega:
                </span>
                <span className="text-white print:text-black block font-semibold">
                  {order.tipo_entrega === 'delivery' ? `Envío (${order.courier || 'Courier'})` : 'Retiro en Tienda'}
                </span>
                <span className="text-stone-400 print:text-stone-700 block mt-0.5">
                  Método: {order.metodo_pago?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-stone-400 print:border-black/20 print:text-black">
                    <th className="py-2 px-2">Producto & Talla</th>
                    <th className="py-2 px-2 text-center">Cant.</th>
                    <th className="py-2 px-2 text-right">Precio Unit.</th>
                    <th className="py-2 px-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-black/10">
                  {items.length > 0 ? (
                    items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={getPrimaryProductImage(it.producto, '/images/logo/logotipo.jpeg')}
                              alt={it.producto?.nombre || 'Producto'}
                              className="w-9 h-9 rounded-lg object-cover bg-black/60 border border-white/10 shrink-0 print:border-black/20"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/images/logo/logotipo.jpeg';
                              }}
                            />
                            <div>
                              <strong className="text-white print:text-black block">{it.producto?.nombre || 'Producto'}</strong>
                              {it.selectedOption && (
                                <span className="text-[10px] text-amber-300 print:text-stone-800 font-mono block">
                                  Opción: {it.selectedOption.nombre}
                                </span>
                              )}
                              {it.selectedSize && (
                                <span className="text-[10px] text-amber-300 print:text-stone-800 font-mono block">
                                  Talla / Tamaño: {it.selectedSize}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">{it.cantidad}x</td>
                        <td className="py-2.5 px-2 text-right font-mono">${it.precio_unitario?.toFixed(2)}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-white print:text-black">
                          ${it.subtotal?.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-stone-400">
                        {order.notas || 'Detalle procesado mediante checkout'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-2 border-t border-white/10 print:border-black/20">
              <div className="w-64 space-y-1.5 text-xs">
                {order.subtotal !== undefined && (
                  <div className="flex justify-between text-stone-400 print:text-stone-700">
                    <span>Subtotal:</span>
                    <span className="font-mono">${order.subtotal.toFixed(2)}</span>
                  </div>
                )}
                {order.descuento ? (
                  <div className="flex justify-between text-emerald-400 font-semibold print:text-black">
                    <span>Descuento Promo:</span>
                    <span className="font-mono">-${order.descuento.toFixed(2)}</span>
                  </div>
                ) : null}
                {order.envio ? (
                  <div className="flex justify-between text-stone-400 print:text-stone-700">
                    <span>Envío / Flete:</span>
                    <span className="font-mono">${order.envio.toFixed(2)}</span>
                  </div>
                ) : null}
                <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-base text-white print:text-black print:border-black">
                  <span>Total Pagado:</span>
                  <span className="font-mono text-[#fbbf24] print:text-black">${order.total.toFixed(2)} USD</span>
                </div>
              </div>
            </div>

            {/* Guaranteed Refund Policy on Invoice */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-stone-300 print:bg-stone-50 print:text-black print:border-black/20 space-y-1">
              <span className="font-bold text-amber-300 print:text-black uppercase block">
                Política de Stock y Devolución por Equivocación:
              </span>
              <p className="font-light leading-relaxed">
                Si un artículo se acabó y fue pagado por equivocación, responderemos con la devolución completa del 100% de su dinero transferido de inmediato a su cuenta o Yappy, o el cambio por otro producto de su preferencia.
              </p>
            </div>
          </div>
        )}

        {/* COMPROBANTE TAB */}
        {activeTab === 'comprobante' && (
          <div className="p-6 overflow-y-auto space-y-4 text-center">
            <h4 className="font-serif-luxury font-bold text-white text-base">
              Captura del Comprobante de Pago
            </h4>
            <p className="text-xs text-stone-400 font-light">
              Coteja el abono de <strong className="text-white">${order.total.toFixed(2)} USD</strong> con la cuenta de destino oficial de Pretty Store.
            </p>

            {voucherUrl ? (
              <div className="max-w-xl mx-auto space-y-3">
                {isPdf ? (
                  <div className="rounded-2xl overflow-hidden border border-white/15 bg-black/80 p-2 shadow-2xl">
                    <iframe
                      src={voucherUrl}
                      title="Comprobante PDF"
                      className="w-full h-[500px] rounded-xl border-none"
                    />
                  </div>
                ) : imgError ? (
                  <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2 text-center">
                    <p className="font-semibold">⚠️ No se pudo previsualizar la imagen miniatura directamente.</p>
                    <p className="text-[11px] text-stone-300">
                      El archivo puede estar en formato de alta resolución o enlace externo. Puedes abrirlo directamente o descargarlo:
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <a
                        href={voucherUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-[#c5a059] text-black font-bold text-xs inline-flex items-center gap-1.5"
                      >
                        <ExternalLink size={14} />
                        <span>Abrir enlace del comprobante</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden border border-white/15 bg-black/80 p-2 shadow-2xl">
                    <img
                      src={voucherUrl}
                      alt="Comprobante de Pago"
                      onError={() => setImgError(true)}
                      className="w-full h-auto max-h-[60vh] object-contain rounded-xl mx-auto"
                    />
                  </div>
                )}

                {/* Voucher Action Buttons */}
                <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                  {voucherUrl.startsWith('http') && (
                    <a
                      href={voucherUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <ExternalLink size={14} />
                      <span>Abrir en Pestaña Completa</span>
                    </a>
                  )}

                  <a
                    href={voucherUrl}
                    download={`comprobante_${orderNumber}.jpg`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 cursor-pointer transition-colors"
                  >
                    <Download size={14} />
                    <span>Descargar Archivo</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      if (voucherUrl) {
                        navigator.clipboard.writeText(voucherUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-semibold border border-white/10 cursor-pointer transition-colors"
                  >
                    {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Eye size={14} />}
                    <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                  </button>

                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-semibold border border-white/10 cursor-pointer transition-colors">
                    <Upload size={14} className="text-[#fbbf24]" />
                    <span>{isUploading ? 'Subiendo...' : 'Actualizar Foto'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      disabled={isUploading}
                      onChange={handleManualUpload}
                    />
                  </label>
                </div>

                <p className="text-[10px] text-stone-400 pt-1">
                  💡 Soporta imágenes JPG, PNG, WEBP y recibos PDF de Banco General o Yappy.
                </p>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-black/40 border border-white/10 max-w-md mx-auto space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-stone-400">
                  <AlertCircle size={24} />
                </div>
                <div className="space-y-1">
                  <span className="text-white text-xs font-bold block">
                    No se encontró captura de comprobante registrada
                  </span>
                  <p className="text-[11px] text-stone-400 font-light">
                    Si el cliente te envió el comprobante por WhatsApp o correo, puedes adjuntarlo directamente a esta orden:
                  </p>
                </div>

                <label className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#c5a059] hover:bg-[#b08d4b] text-black font-extrabold text-xs cursor-pointer shadow-lg transition-transform active:scale-95 mx-auto">
                  <Upload size={16} />
                  <span>{isUploading ? 'Subiendo archivo...' : 'Adjuntar Comprobante de Pago'}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    disabled={isUploading}
                    onChange={handleManualUpload}
                  />
                </label>

                <div className="text-[10px] text-stone-400 border-t border-white/5 pt-3">
                  Formatos válidos: Capturas de pantalla (JPG, PNG, WEBP), fotos de cámara y recibos oficiales PDF.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
