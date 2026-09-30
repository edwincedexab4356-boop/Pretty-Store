import React, { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  User,
  MapPin,
  Phone,
  Truck,
  Store,
  Home,
  Lock,
  Calendar,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Send,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { MetodoPago, TipoEntrega, CourierOption } from '../../types/database';
import { createRealOrder, CreatedOrderResult } from '../../services/checkoutService';

export type PanamaProvince =
  | 'Panamá Oeste'
  | 'Panamá Capital'
  | 'Colón'
  | 'Coclé'
  | 'Herrera'
  | 'Los Santos'
  | 'Veraguas'
  | 'Chiriquí'
  | 'Bocas del Toro'
  | 'Darién'
  | 'Comarcas';

export const PANAMA_PROVINCES: {
  id: PanamaProvince;
  name: string;
  zone: 'cerca' | 'lejos';
  tag: string;
}[] = [
  { id: 'Panamá Oeste', name: 'Panamá Oeste', zone: 'cerca', tag: 'La Chorrera · Sede' },
  { id: 'Panamá Capital', name: 'Panamá Capital', zone: 'cerca', tag: 'Ciudad de Panamá' },
  { id: 'Colón', name: 'Colón', zone: 'lejos', tag: 'Costa Atlántica' },
  { id: 'Coclé', name: 'Coclé', zone: 'lejos', tag: 'Penonomé · Aguadulce' },
  { id: 'Herrera', name: 'Herrera', zone: 'lejos', tag: 'Chitré · Pesé' },
  { id: 'Los Santos', name: 'Los Santos', zone: 'lejos', tag: 'Las Tablas · Pedasí' },
  { id: 'Veraguas', name: 'Veraguas', zone: 'lejos', tag: 'Santiago · Soná' },
  { id: 'Chiriquí', name: 'Chiriquí', zone: 'lejos', tag: 'David · Boquete · Bugaba' },
  { id: 'Bocas del Toro', name: 'Bocas del Toro', zone: 'lejos', tag: 'Changuinola · Isla Colón' },
  { id: 'Darién', name: 'Darién', zone: 'lejos', tag: 'Metetí · La Palma' },
  { id: 'Comarcas', name: 'Comarcas', zone: 'lejos', tag: 'Guna Yala · Ngäbe-Buglé' },
];

export const CheckoutDemoModal: React.FC = () => {
  const { config } = useStoreConfig();
  const {
    items,
    subtotal,
    shipping,
    total,
    isCheckoutOpen,
    setIsCheckoutOpen,
    clearCart,
  } = useCart();

  // Tipo de Entrega: 'delivery' o 'retiro'
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('delivery');
  const [provincia, setProvincia] = useState<PanamaProvince>('Panamá Oeste');
  const [courier, setCourier] = useState<CourierOption>('Servientrega');
  const [servientregaModalidad, setServientregaModalidad] = useState<'sucursal' | 'domicilio'>('domicilio');
  const [sucursalRetiro, setSucursalRetiro] = useState('');

  // Contact Details
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');

  // Determinar si la provincia es lejana de La Chorrera
  const isFarProvince = useMemo(() => {
    const found = PANAMA_PROVINCES.find((p) => p.id === provincia);
    return found ? found.zone === 'lejos' : false;
  }, [provincia]);

  // Texto descriptivo de la tarifa estimada
  const shippingCostEstimate = useMemo(() => {
    if (tipoEntrega === 'retiro') return 'Gratis ($0.00)';
    if (courier === 'Ferguson') return '$5.00 - $6.50 (Solo retiro en sucursal)';
    if (courier === 'Uno Express') return '$6.50 - $7.50 (Solo retiro en sucursal)';
    // Servientrega
    if (servientregaModalidad === 'sucursal') {
      return isFarProvince ? '$5.00 (Retiro en sucursal)' : '$3.86 (Retiro en sucursal cercana)';
    }
    return isFarProvince
      ? '$7.03 (Delivery a domicilio - sujeto a cobertura)'
      : '$7.03 (Delivery a domicilio)';
  }, [tipoEntrega, courier, servientregaModalidad, isFarProvince]);

  // Payment Method
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('yappy');
  const [comprobantePago, setComprobantePago] = useState('');

  // Submission & Confirmation
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<CreatedOrderResult | null>(null);
  const [yappyRedirectUrl, setYappyRedirectUrl] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  if (!isCheckoutOpen) return null;

  const generateYappyWhatsAppUrl = (
    orderNum: string,
    orderIdVal: string,
    orderItems: { product: { nombre: string; precio: number }; quantity: number }[]
  ) => {
    const rawTarget = config.whatsapp || config.yappy_numero || '+507 6890-1234';
    const digitsOnly = rawTarget.replace(/\D/g, '') || '50768901234';
    const finalPhone = digitsOnly.length === 8 ? `507${digitsOnly}` : digitsOnly;

    const itemsSummary =
      orderItems && orderItems.length > 0
        ? orderItems
            .map(
              (it) =>
                `• ${it.quantity}x ${it.product.nombre} ($${(it.product.precio * it.quantity).toFixed(2)})`
            )
            .join('\n')
        : '• Productos de la orden';

    const deliveryDetail =
      tipoEntrega === 'retiro'
        ? '🏢 *Modalidad:* Retiro en el Local / Tienda física'
        : `🚚 *Modalidad:* Envío con ${courier}\n📍 *Provincia:* ${provincia} (${isFarProvince ? 'Interior / Zona Lejana' : 'Zona Central'})\n📦 *Tipo de Entrega:* ${
            courier === 'Servientrega' && servientregaModalidad === 'domicilio'
              ? `Delivery hasta la casa (${direccion.trim()})`
              : `Retiro en Sucursal ${courier} (${sucursalRetiro.trim() || direccion.trim() || 'Por definir'})`
          }\n💵 *Tarifa Estimada de Envío:* ${shippingCostEstimate} *(Sujeto al tamaño y peso del paquete)*`;

    const textMessage = `✨ *NUEVO PEDIDO - ${config.nombre_tienda || 'PRETTY-STORE'}* ✨

📋 *Pedido:* ${orderNum || '#' + orderIdVal}
👤 *Cliente:* ${nombre.trim()}
📱 *Teléfono:* ${telefono.trim()}
${deliveryDetail}

🛒 *Detalle del Pedido:*
${itemsSummary}

💰 *Total Productos:* $${total.toFixed(2)}
${comprobantePago.trim() ? `🧾 *Comprobante / Referencia:* ${comprobantePago.trim()}\n` : ''}
Hola, acabo de registrar mi pedido en la tienda y realizar el pago mediante Yappy. Adjunto aquí la captura / comprobante de mi pago para su verificación y envío. ¡Muchas gracias!`;

    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(textMessage)}`;
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!nombre.trim()) errors.nombre = 'El nombre completo es requerido';
    if (!telefono.trim()) errors.telefono = 'El teléfono de contacto es requerido';

    if (tipoEntrega === 'delivery') {
      if (!provincia) {
        errors.provincia = 'Selecciona la provincia de entrega';
      }
      if (!courier) {
        errors.courier = 'Selecciona la empresa de envíos preferida';
      }

      if (courier === 'Servientrega' && servientregaModalidad === 'domicilio') {
        if (!direccion.trim()) {
          errors.direccion = 'Ingresa la dirección completa para el delivery hasta la casa';
        }
      } else {
        if (!sucursalRetiro.trim() && !direccion.trim()) {
          errors.sucursalRetiro = `Indica la sucursal de ${courier} donde retirarás el paquete`;
        }
      }
    }

    if (!acceptedTerms) {
      errors.terms = 'Debes aceptar los Términos y Condiciones y la Política de Privacidad para finalizar tu pedido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      const orderSummary = await createRealOrder({
        items,
        subtotal,
        shipping,
        total,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        direccion: direccion.trim(),
        metodoPago,
        tipoEntrega,
        courier: tipoEntrega === 'delivery' ? courier : undefined,
        comprobantePago: metodoPago === 'tarjeta' ? 'PagueloFacil' : comprobantePago.trim() || undefined,
        tarjetaInfo:
          metodoPago === 'tarjeta'
            ? {
                numeroEnmascarado: 'PagueloFacil Checkout',
                titular: nombre.trim() || 'Cliente PagueloFacil',
              }
            : undefined,
        notas: notas.trim() || undefined,
      });

      setConfirmedOrder(orderSummary);
      clearCart();

      // Si pagó con Tarjeta (PagueloFacil), abrir automáticamente el link de pago sin ventanas emergentes
      if (metodoPago === 'tarjeta') {
        const pagueloUrl = config.link_pago_tarjeta || 'https://checkout.paguelofacil.com/gorras';
        setTimeout(() => {
          try {
            const anchor = document.createElement('a');
            anchor.href = pagueloUrl;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
          } catch (e) {
            console.warn('Could not auto-open PagueloFacil link:', e);
          }
        }, 500);
      } else if (metodoPago === 'yappy') {
        const waUrl = generateYappyWhatsAppUrl(
          orderSummary.orderNumber,
          orderSummary.orderId,
          orderSummary.items || items
        );
        setYappyRedirectUrl(waUrl);

        setTimeout(() => {
          try {
            const anchor = document.createElement('a');
            anchor.href = waUrl;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
          } catch (e) {
            console.warn('Could not auto-open WhatsApp link:', e);
          }
        }, 500);
      }
      // En caso de Efectivo, no redirecciona: muestra directamente el recibo completo con los productos
    } catch (err: any) {
      console.error('Error al registrar pedido:', err);
      setSubmissionError(
        err?.message || 'No se pudo procesar el pedido en este momento. Por favor verifica tus datos e inténtalo nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    setConfirmedOrder(null);
    setYappyRedirectUrl(null);
    setIsCheckoutOpen(false);
    setNombre('');
    setTelefono('');
    setEmail('');
    setDireccion('');
    setNotas('');
    setComprobantePago('');
  };

  const courierOptions: { id: CourierOption; name: string; desc: string }[] = [
    {
      id: 'Uno Express',
      name: 'Uno Express',
      desc: 'Envíos rápidos a sucursal o domicilio en todo Panamá',
    },
    {
      id: 'Ferguson',
      name: 'Ferguson',
      desc: 'Transporte y logística nacional de encomiendas',
    },
    {
      id: 'Servientrega',
      name: 'Servi Entrega',
      desc: 'Red nacional de entregas y paquetería segura',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0c0c0f] border border-white/10 shadow-2xl overflow-hidden my-4 sm:my-6 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => {
            if (confirmedOrder) handleFinish();
            else setIsCheckoutOpen(false);
          }}
          className="absolute top-5 right-5 z-30 p-2 text-stone-400 hover:text-white transition-colors cursor-pointer bg-black/70 hover:bg-black rounded-full border border-white/10"
          aria-label="Cerrar checkout"
        >
          <X size={18} />
        </button>

        {confirmedOrder ? (
          /* ================= ORDER CONFIRMATION SCREEN ================= */
          <div className="p-8 sm:p-14 text-center overflow-y-auto">
            <div className="w-16 h-16 border border-[#c5a059]/40 text-[#c5a059] flex items-center justify-center mx-auto mb-6 bg-stone-900/50">
              <CheckCircle2 size={32} className="stroke-[1.5]" />
            </div>

            <span className="text-[10px] uppercase font-medium tracking-[0.3em] text-[#c5a059] block mb-2">
              Pedido Registrado con Éxito
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif-luxury font-light text-white mb-3">
              Gracias por su compra, {confirmedOrder.nombre}
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto mb-8 font-light">
              Su orden se guardó en nuestro sistema de pedidos. Nos pondremos en contacto vía WhatsApp o teléfono para coordinar la entrega.
            </p>

            {/* Receipt Summary Card */}
            <div className="bg-stone-900/60 border border-white/10 p-6 sm:p-8 max-w-xl mx-auto text-left mb-6 space-y-5 rounded-2xl shadow-2xl">
              {/* Header del Recibo */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#c5a059] block font-semibold">
                    Recibo Oficial de Compra
                  </span>
                  <span className="text-lg font-mono tabular-nums text-white font-bold">
                    #{confirmedOrder.orderNumber || confirmedOrder.orderId}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 block">Fecha</span>
                  <span className="text-xs text-stone-300 font-mono">
                    {confirmedOrder.date}
                  </span>
                </div>
              </div>

              {/* Datos del Cliente y Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-black/40 p-4 rounded-xl border border-white/5">
                <div>
                  <span className="text-stone-400 font-light block text-[11px]">Cliente:</span>
                  <span className="text-white font-medium block">{confirmedOrder.nombre}</span>
                  <span className="text-stone-300 font-mono text-[11px] block">{confirmedOrder.telefono}</span>
                </div>
                <div>
                  <span className="text-stone-400 font-light block text-[11px]">Método de Pago:</span>
                  <span className="text-[#c5a059] font-medium uppercase text-[11px] tracking-wider block">
                    {confirmedOrder.metodoPago === 'tarjeta'
                      ? 'Tarjeta (PagueloFacil)'
                      : confirmedOrder.metodoPago === 'yappy'
                      ? 'Yappy'
                      : 'Efectivo'}
                  </span>
                  <span className="text-stone-400 font-light block text-[11px] mt-1">Entrega:</span>
                  <span className="text-white font-medium block">
                    {confirmedOrder.tipoEntrega === 'retiro'
                      ? 'Retiro en Boutique'
                      : `Delivery (${confirmedOrder.courier})`}
                  </span>
                </div>
                {confirmedOrder.tipoEntrega === 'delivery' ? (
                  <div className="sm:col-span-2 pt-2 border-t border-white/5 text-[11px]">
                    <span className="text-stone-400 font-light block">Dirección de Entrega:</span>
                    <span className="text-white font-medium">{confirmedOrder.direccion}</span>
                  </div>
                ) : (
                  <div className="sm:col-span-2 pt-2 border-t border-white/5 text-[11px]">
                    <span className="text-stone-400 font-light block">Lugar de Retiro:</span>
                    <a
                      href="https://maps.app.goo.gl/PxA3suMXNZxuFF5X7"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#c5a059] font-medium hover:underline inline-flex items-center gap-1"
                    >
                      Boutique Pretty-Store (Ver en Google Maps)
                    </a>
                  </div>
                )}
              </div>

              {/* DETALLE DE LO QUE COMPRASTE (Artículos adquiridos) */}
              <div className="space-y-2.5">
                <span className="text-xs uppercase tracking-[0.16em] text-white font-semibold flex items-center gap-1.5">
                  <span>Productos Comprados</span>
                  <span className="text-[10px] text-stone-400 font-normal">
                    ({(confirmedOrder.items || items).length} { (confirmedOrder.items || items).length === 1 ? 'artículo' : 'artículos'})
                  </span>
                </span>

                <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-black/40">
                  {(confirmedOrder.items || items).map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.product.imagen_url || '/images/products/gorra-1.webp'}
                          alt={item.product.nombre}
                          className="w-12 h-12 object-cover rounded-lg border border-white/10 shrink-0 bg-stone-900"
                        />
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate text-xs">{item.product.nombre}</p>
                          <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                            Cant: <strong className="text-white">{item.quantity}</strong> × ${item.product.precio.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-white font-semibold text-xs shrink-0">
                        ${(item.quantity * item.product.precio).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desglose de Precios */}
              <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                <div className="flex justify-between text-stone-400 font-light">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">${confirmedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-400 font-light">
                  <span>Envío / Entrega</span>
                  <span className="font-mono text-white">
                    {confirmedOrder.shipping > 0 ? `$${confirmedOrder.shipping.toFixed(2)}` : 'Gratis ($0.00)'}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm">
                  <span className="font-semibold text-white uppercase tracking-wider text-xs">Total:</span>
                  <span className="text-xl font-mono tabular-nums font-bold text-[#c5a059]">
                    ${confirmedOrder.total.toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION CARD: PAGUELOFACIL (TARJETA) */}
            {confirmedOrder.metodoPago === 'tarjeta' && (
              <div className="max-w-xl mx-auto mb-8 p-6 rounded-2xl bg-gradient-to-br from-[#c5a059]/15 via-[#0e0e12] to-black border border-[#c5a059]/40 text-left space-y-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#c5a059]/20 border border-[#c5a059]/40 flex items-center justify-center shrink-0 text-[#c5a059]">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#c5a059] block">
                      Pagar con Tarjeta · PagueloFacil
                    </span>
                    <h3 className="text-base font-semibold text-white">
                      Completar Pago en PagueloFacil
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed font-light">
                  Tu pedido <strong className="text-white">#{confirmedOrder.orderNumber || confirmedOrder.orderId}</strong> ha sido registrado en el sistema. Se abrió la pasarela oficial de PagueloFacil en tu navegador para realizar el pago. Si no se abrió automáticamente, presiona el botón a continuación para pagar tus <strong className="text-[#c5a059] font-mono">${confirmedOrder.total.toFixed(2)} USD</strong> con Visa, Mastercard o Clave:
                </p>

                <div className="pt-1">
                  <a
                    href={config.link_pago_tarjeta || 'https://checkout.paguelofacil.com/gorras'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#d4af37] hover:from-[#d4af37] hover:to-[#c5a059] text-black font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-[#c5a059]/20 cursor-pointer"
                  >
                    <CreditCard size={18} />
                    <span>Pagar ${confirmedOrder.total.toFixed(2)} USD en PagueloFacil</span>
                  </a>
                </div>
              </div>
            )}

            {/* ACTION CARD: EFECTIVO */}
            {confirmedOrder.metodoPago === 'efectivo' && (
              <div className="max-w-xl mx-auto mb-8 p-6 rounded-2xl bg-gradient-to-br from-stone-900 via-[#0e0e12] to-black border border-white/20 text-left space-y-3 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-white">
                    <Banknote size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block">
                      Pago en Efectivo
                    </span>
                    <h3 className="text-base font-semibold text-white">
                      Pedido Registrado con Éxito
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed font-light">
                  {confirmedOrder.tipoEntrega === 'retiro'
                    ? 'Tus artículos están reservados. Podrás abonar el monto exacto en efectivo al momento de retirarlos en nuestra boutique.'
                    : 'Tus productos están siendo preparados para entrega. Recuerda tener preparado el monto en efectivo al recibir al repartidor.'}
                </p>
              </div>
            )}

            {/* ACTION CARD: YAPPY */}
            {confirmedOrder.metodoPago === 'yappy' && (
              <div className="max-w-xl mx-auto mb-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-[#0e0e12] to-emerald-950/40 border border-emerald-500/40 text-left space-y-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center shrink-0">
                    <MessageSquare size={24} className="text-[#25D366]" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#25D366] block">
                      Paso Final · Validación Yappy
                    </span>
                    <h3 className="text-base font-semibold text-white">
                      Envía tu Comprobante por WhatsApp
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed font-light">
                  Tu pedido <strong className="text-white">#{confirmedOrder.orderNumber || confirmedOrder.orderId}</strong> ha sido registrado en el sistema. Para procesar tu despacho, envía la captura o comprobante de tu pago por Yappy al WhatsApp oficial del comercio. El mensaje ya ha sido redactado con todos los detalles de tu orden.
                </p>

                <div className="pt-2">
                  <a
                    href={
                      yappyRedirectUrl ||
                      generateYappyWhatsAppUrl(
                        confirmedOrder.orderNumber,
                        confirmedOrder.orderId,
                        confirmedOrder.items || items
                      )
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-black font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-950/60 cursor-pointer"
                  >
                    <MessageSquare size={18} className="fill-black" />
                    <span>Abrir WhatsApp & Enviar Comprobante</span>
                  </a>
                </div>

                <p className="text-[10px] text-stone-400 text-center font-light">
                  Si WhatsApp no se abrió automáticamente, presiona el botón verde de arriba.
                </p>
              </div>
            )}

            <button
              onClick={handleFinish}
              className="px-8 py-3.5 bg-white hover:bg-stone-200 text-stone-950 text-xs uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer"
            >
              Volver a la Tienda
            </button>
          </div>
        ) : (
          /* ================= MAIN CHECKOUT FORM ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
            {/* Left Column: Delivery Type, Customer Data & Payment Form */}
            <div className="lg:col-span-7 p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-white/10">
              <div className="mb-6">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#c5a059] font-medium block mb-1">
                  Finalizar Compra
                </span>
                <h2 className="text-2xl font-serif-luxury font-light text-white tracking-wide">
                  Datos de Entrega & Pago
                </h2>
              </div>

              <form onSubmit={handleSubmitOrder} className="space-y-6">
                {submissionError && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                    <AlertCircle size={17} className="shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-rose-200">No se pudo procesar la orden</p>
                      <p className="text-[11px] text-rose-300/90 font-light mt-0.5 leading-relaxed">
                        {submissionError}
                      </p>
                    </div>
                  </div>
                )}

                {/* 1. SELECTOR: DELIVERY O RETIRO EN EL LOCAL */}
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.16em] text-stone-300 font-light block">
                    ¿Cómo deseas recibir tu compra? *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTipoEntrega('delivery')}
                      className={`p-3.5 border text-left cursor-pointer transition-all flex items-center gap-3 ${
                        tipoEntrega === 'delivery'
                          ? 'border-[#c5a059] bg-[#c5a059]/10 text-white'
                          : 'border-white/10 bg-stone-900/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <Truck size={20} className={tipoEntrega === 'delivery' ? 'text-[#c5a059]' : 'text-stone-400'} />
                      <div>
                        <p className="text-xs font-semibold text-white">Envío / Delivery</p>
                        <p className="text-[10px] text-stone-400 font-light">A domicilio o sucursal</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoEntrega('retiro')}
                      className={`p-3.5 border text-left cursor-pointer transition-all flex items-center gap-3 ${
                        tipoEntrega === 'retiro'
                          ? 'border-[#c5a059] bg-[#c5a059]/10 text-white'
                          : 'border-white/10 bg-stone-900/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <Store size={20} className={tipoEntrega === 'retiro' ? 'text-[#c5a059]' : 'text-stone-400'} />
                      <div>
                        <p className="text-xs font-semibold text-white">Retirar en el Local</p>
                        <p className="text-[10px] text-stone-400 font-light">En tienda física</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. CAMPOS DE CONTACTO (Nombre y Teléfono siempre requeridos) */}
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-[0.16em] text-stone-300 font-light block">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Roberto De La Espriella"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className={`w-full px-3.5 py-2.5 bg-stone-900/60 border text-xs text-white placeholder-stone-600 focus:outline-none transition-colors ${
                          formErrors.nombre ? 'border-rose-500' : 'border-white/10 focus:border-white/30'
                        }`}
                      />
                      {formErrors.nombre && (
                        <p className="text-[10px] text-rose-400">{formErrors.nombre}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-[0.16em] text-stone-300 font-light block">
                        Número de Teléfono / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        placeholder="+507 6000-0000"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className={`w-full px-3.5 py-2.5 bg-stone-900/60 border text-xs text-white placeholder-stone-600 focus:outline-none transition-colors ${
                          formErrors.telefono ? 'border-rose-500' : 'border-white/10 focus:border-white/30'
                        }`}
                      />
                      {formErrors.telefono && (
                        <p className="text-[10px] text-rose-400">{formErrors.telefono}</p>
                      )}
                    </div>
                  </div>

                  {/* 3. SI ELIGE DELIVERY: SELECCIÓN DE PROVINCIA Y COURIER CON TARIFAS EXACTAS */}
                  {tipoEntrega === 'delivery' ? (
                    <div className="space-y-4 p-4 rounded-xl bg-stone-900/40 border border-white/10 animate-in fade-in duration-200">
                      {/* Apartado visual: Selecciona tu Provincia */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5">
                          <label className="text-[11px] uppercase tracking-[0.16em] text-white font-medium flex items-center gap-1.5">
                            <MapPin size={13} className="text-[#c5a059]" />
                            <span>1. Elige la Provincia donde te encuentras *</span>
                          </label>
                          <span className="text-[10px] text-[#c5a059] font-mono font-medium">
                            {provincia}
                          </span>
                        </div>

                        {/* Grid de Provincias de Panamá */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {PANAMA_PROVINCES.map((prov) => {
                            const isSelected = provincia === prov.id;
                            return (
                              <button
                                key={prov.id}
                                type="button"
                                onClick={() => setProvincia(prov.id)}
                                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between min-h-[58px] ${
                                  isSelected
                                    ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-1 ring-[#c5a059] shadow-md shadow-[#c5a059]/10'
                                    : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/20 hover:text-stone-200'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-semibold text-xs text-white leading-tight">
                                    {prov.name}
                                  </span>
                                  {isSelected && (
                                    <span className="w-2 h-2 rounded-full bg-[#c5a059] shrink-0 mt-0.5" />
                                  )}
                                </div>
                                <div className="mt-1 flex items-center justify-between gap-1 text-[9px]">
                                  <span className="text-stone-400 truncate font-light">
                                    {prov.tag}
                                  </span>
                                  <span
                                    className={`px-1 py-0.2 rounded font-mono shrink-0 ${
                                      prov.zone === 'cerca'
                                        ? 'text-emerald-400 bg-emerald-500/10'
                                        : 'text-amber-300 bg-amber-500/10'
                                    }`}
                                  >
                                    {prov.zone === 'cerca' ? 'Cerca' : 'Interior'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Indicador de cercanía de la provincia */}
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] text-[10px] text-stone-300 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-stone-400">Provincia seleccionada:</span>
                            <strong className="text-white font-semibold">{provincia}</strong>
                          </div>
                          {isFarProvince ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/20 text-amber-300 font-medium">
                              Zona Interior / Lejana a La Chorrera
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-medium">
                              Zona Cercana a La Chorrera
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selector de Empresa de Envíos */}
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase tracking-[0.16em] text-stone-300 font-light block">
                          ¿Por cuál empresa deseas recibirlo? *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Servientrega */}
                          <button
                            type="button"
                            onClick={() => setCourier('Servientrega')}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              courier === 'Servientrega'
                                ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-1 ring-[#c5a059]'
                                : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-white">Servi Entrega</span>
                              {courier === 'Servientrega' && <span className="w-2 h-2 rounded-full bg-[#c5a059]" />}
                            </div>
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-medium">
                              Delivery a Casa o Sucursal
                            </span>
                            <span className="text-[10px] text-[#c5a059] block mt-1 font-mono font-medium">
                              Desde $3.86
                            </span>
                          </button>

                          {/* Ferguson */}
                          <button
                            type="button"
                            onClick={() => setCourier('Ferguson')}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              courier === 'Ferguson'
                                ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-1 ring-[#c5a059]'
                                : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-white">Ferguson</span>
                              {courier === 'Ferguson' && <span className="w-2 h-2 rounded-full bg-[#c5a059]" />}
                            </div>
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 text-[9px]">
                              Solo retiro en sucursal
                            </span>
                            <span className="text-[10px] text-[#c5a059] block mt-1 font-mono font-medium">
                              $5.00 - $6.50
                            </span>
                          </button>

                          {/* Uno Express */}
                          <button
                            type="button"
                            onClick={() => setCourier('Uno Express')}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              courier === 'Uno Express'
                                ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-1 ring-[#c5a059]'
                                : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-white">Uno Express</span>
                              {courier === 'Uno Express' && <span className="w-2 h-2 rounded-full bg-[#c5a059]" />}
                            </div>
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 text-[9px]">
                              Solo retiro en sucursal
                            </span>
                            <span className="text-[10px] text-[#c5a059] block mt-1 font-mono font-medium">
                              $6.50 - $7.50
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Modalidad específica si eligió Servientrega: Preguntar envío a la casa o retiro en sucursal */}
                      {courier === 'Servientrega' && (
                        <div className="p-4 rounded-xl bg-black/60 border border-[#c5a059]/40 space-y-3 shadow-lg animate-in fade-in duration-200">
                          <div className="flex items-center justify-between pb-1 border-b border-white/[0.08]">
                            <label className="text-xs uppercase tracking-wider text-white font-medium flex items-center gap-1.5">
                              <Truck size={14} className="text-[#c5a059]" />
                              <span>¿Cómo deseas recibir tu pedido con Servi Entrega? *</span>
                            </label>
                            <span className="text-[10px] text-[#c5a059] font-mono font-semibold">
                              {servientregaModalidad === 'domicilio' ? 'Envío a la Casa' : 'Retiro en Sucursal'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Opción 1: Envío a la Casa */}
                            <button
                              type="button"
                              onClick={() => setServientregaModalidad('domicilio')}
                              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                                servientregaModalidad === 'domicilio'
                                  ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-2 ring-[#c5a059] shadow-lg shadow-[#c5a059]/15'
                                  : 'border-white/10 bg-stone-900/60 text-stone-400 hover:border-white/25 hover:text-white'
                              }`}
                            >
                              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                                servientregaModalidad === 'domicilio'
                                  ? 'bg-[#c5a059] text-black'
                                  : 'bg-white/5 text-stone-400'
                              }`}>
                                <Home size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white">Envío a la Casa</span>
                                  <span className="text-xs font-mono font-bold text-[#c5a059]">$7.03</span>
                                </div>
                                <p className="text-[10px] text-stone-300 font-light mt-0.5 leading-tight">
                                  Delivery directo hasta la puerta de tu casa o local comercial.
                                </p>
                                <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-medium">
                                  Entrega a Domicilio
                                </span>
                              </div>
                            </button>

                            {/* Opción 2: Retiro en Sucursal */}
                            <button
                              type="button"
                              onClick={() => setServientregaModalidad('sucursal')}
                              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                                servientregaModalidad === 'sucursal'
                                  ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-2 ring-[#c5a059] shadow-lg shadow-[#c5a059]/15'
                                  : 'border-white/10 bg-stone-900/60 text-stone-400 hover:border-white/25 hover:text-white'
                              }`}
                            >
                              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                                servientregaModalidad === 'sucursal'
                                  ? 'bg-[#c5a059] text-black'
                                  : 'bg-white/5 text-stone-400'
                              }`}>
                                <Store size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white">Retiro en Sucursal</span>
                                  <span className="text-xs font-mono font-bold text-[#c5a059]">
                                    {isFarProvince ? '$5.00' : '$3.86'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-stone-300 font-light mt-0.5 leading-tight">
                                  Pasa a retirar personalmente en la agencia Servi Entrega.
                                </p>
                                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-medium ${
                                  isFarProvince
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                  {isFarProvince ? 'Tarifa Interior ($5.00)' : 'Tarifa Cercana ($3.86)'}
                                </span>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Dirección o Sucursal según modalidad */}
                      {courier === 'Servientrega' && servientregaModalidad === 'domicilio' ? (
                        <div className="space-y-1.5 p-3.5 rounded-xl bg-stone-900/60 border border-white/10">
                          <label className="text-[11px] uppercase tracking-[0.16em] text-white font-medium block flex items-center gap-1.5">
                            <Home size={13} className="text-[#c5a059]" />
                            <span>Dirección completa para el Envío a tu Casa *</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Barriada, calle, número de casa/apto o punto de referencia"
                            value={direccion}
                            onChange={(e) => setDireccion(e.target.value)}
                            className={`w-full px-3.5 py-2.5 bg-black/60 border text-xs text-white placeholder-stone-600 focus:outline-none transition-colors rounded-lg ${
                              formErrors.direccion ? 'border-rose-500' : 'border-white/10 focus:border-[#c5a059]'
                            }`}
                          />
                          {formErrors.direccion && (
                            <p className="text-[10px] text-rose-400">{formErrors.direccion}</p>
                          )}
                          <p className="text-[10px] text-stone-400 font-light">
                            Servi Entrega entregará tu pedido directamente en esta dirección en {provincia}.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 p-3.5 rounded-xl bg-stone-900/60 border border-white/10">
                          <label className="text-[11px] uppercase tracking-[0.16em] text-white font-medium block flex items-center gap-1.5">
                            <Store size={13} className="text-[#c5a059]" />
                            <span>Sucursal de {courier} para Retiro Personal *</span>
                          </label>
                          <input
                            type="text"
                            placeholder={`Ej. Sucursal ${courier} ${provincia === 'Chiriquí' ? 'David' : provincia === 'Herrera' ? 'Chitré' : 'Central'}...`}
                            value={sucursalRetiro}
                            onChange={(e) => setSucursalRetiro(e.target.value)}
                            className={`w-full px-3.5 py-2.5 bg-black/60 border text-xs text-white placeholder-stone-600 focus:outline-none transition-colors rounded-lg ${
                              formErrors.sucursalRetiro ? 'border-rose-500' : 'border-white/10 focus:border-[#c5a059]'
                            }`}
                          />
                          {formErrors.sucursalRetiro && (
                            <p className="text-[10px] text-rose-400">{formErrors.sucursalRetiro}</p>
                          )}
                          <p className="text-[10px] text-stone-400 font-light">
                            {courier === 'Ferguson' && 'Ferguson solo opera con retiro en sus agencias y sucursales autorizadas.'}
                            {courier === 'Uno Express' && 'Uno Express solo opera con retiro en sus agencias nacionales.'}
                            {courier === 'Servientrega' && `Retirarás personalmente en la sucursal de Servi Entrega en ${provincia}.`}
                          </p>
                        </div>
                      )}

                      {/* NOTA OBLIGATORIA DEL TAMAÑO DEL PAQUETE */}
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2">
                        <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-[11px] leading-relaxed">
                          <strong className="block font-semibold text-amber-300">
                            Tarifa Estimada: {shippingCostEstimate}
                          </strong>
                          <span className="text-stone-300 font-light">
                            Nota: El costo final del envío depende del tamaño y peso del paquete.
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* SI ELIGE RETIRO EN EL LOCAL: AVISO ELEGANTE */
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-1 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 font-medium">
                        <Store size={15} />
                        <span>Retiro directo en Tienda física</span>
                      </div>
                      <p className="text-[11px] text-stone-300 font-light">
                        Boutique Pretty-Store (<a href="https://maps.app.goo.gl/PxA3suMXNZxuFF5X7" target="_blank" rel="noreferrer" className="text-[#c5a059] underline underline-offset-2">Ver ubicación en Google Maps</a>). Tu pedido se apartará de inmediato a tu nombre y teléfono sin costo de envío.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.16em] text-stone-400 font-light block">
                      Notas Especiales / Indicaciones (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Horario preferido o alguna observación..."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-900/60 border border-white/10 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-white/30 transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* 4. MÉTODO DE PAGO (Solo Yappy, Tarjeta y Efectivo - ACH removido) */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <label className="text-[11px] uppercase tracking-[0.16em] text-stone-300 font-light block">
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Yappy */}
                    <button
                      type="button"
                      onClick={() => setMetodoPago('yappy')}
                      className={`p-3 border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                        metodoPago === 'yappy'
                          ? 'border-[#c5a059] bg-[#c5a059]/10 text-white'
                          : 'border-white/10 bg-stone-900/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <Smartphone size={18} className={metodoPago === 'yappy' ? 'text-[#c5a059]' : 'text-stone-400'} />
                      <span className="text-xs font-medium">Yappy</span>
                    </button>

                    {/* Tarjeta */}
                    <button
                      type="button"
                      onClick={() => setMetodoPago('tarjeta')}
                      className={`p-3 border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                        metodoPago === 'tarjeta'
                          ? 'border-[#c5a059] bg-[#c5a059]/10 text-white'
                          : 'border-white/10 bg-stone-900/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <CreditCard size={18} className={metodoPago === 'tarjeta' ? 'text-[#c5a059]' : 'text-stone-400'} />
                      <span className="text-xs font-medium">Tarjeta</span>
                    </button>

                    {/* Efectivo */}
                    <button
                      type="button"
                      onClick={() => setMetodoPago('efectivo')}
                      className={`p-3 border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                        metodoPago === 'efectivo'
                          ? 'border-[#c5a059] bg-[#c5a059]/10 text-white'
                          : 'border-white/10 bg-stone-900/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <Banknote size={18} className={metodoPago === 'efectivo' ? 'text-[#c5a059]' : 'text-stone-400'} />
                      <span className="text-xs font-medium">Efectivo</span>
                    </button>
                  </div>

                  {/* DETALLE SEGÚN MÉTODO DE PAGO */}
                  {metodoPago === 'yappy' && (
                    <div className="p-4 rounded-xl bg-stone-900/80 border border-[#c5a059]/30 space-y-3.5 text-xs animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="text-stone-300 font-medium">Pagar vía Yappy Comercial o Celular:</span>
                        <span className="text-[#c5a059] font-mono font-bold text-sm">
                          {config.yappy_numero || '+507 6890-1234'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 leading-relaxed font-light">
                        Envía el total de <strong className="text-white">${total.toFixed(2)}</strong> desde tu app de Banco General al número{' '}
                        <strong className="text-[#c5a059]">{config.yappy_numero || '+507 6890-1234'}</strong> o buscando al comercio.
                      </p>

                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-start gap-2.5 text-[11px] leading-relaxed">
                        <MessageSquare size={16} className="text-[#25D366] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white block font-medium">Confirmación Automática por WhatsApp:</strong>
                          Al presionar <span className="text-white font-semibold">"Confirmar Pedido"</span> serás redirigido directamente a nuestro WhatsApp con todos los datos de tu compra listos para enviar sin necesidad de ingresar comprobantes o datos manuales aquí.
                        </div>
                      </div>
                    </div>
                  )}

                  {metodoPago === 'tarjeta' && (
                    <div className="p-4 rounded-xl bg-stone-900/80 border border-white/10 space-y-3.5 text-xs animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="text-stone-300 font-medium flex items-center gap-1.5">
                          <Lock size={12} className="text-[#c5a059]" />
                          <span>Pago Seguro con Tarjeta</span>
                        </span>
                        <span className="text-[10px] text-[#c5a059] uppercase tracking-widest font-mono font-medium">
                          PagueloFacil / Visa / Mastercard / Clave
                        </span>
                      </div>

                      {/* MODO PAGUELOFACIL DIRECTO SIN FORMULARIO MANUAL */}
                      <div className="p-4 rounded-xl bg-black/60 border border-[#c5a059]/40 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white font-medium text-xs">
                            <CreditCard size={15} className="text-[#c5a059]" />
                            <span>Pasarela Oficial PagueloFacil Panamá</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">
                            Activa
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-300 leading-relaxed font-light">
                          Al presionar <strong className="text-white">"Confirmar Pedido"</strong> abajo, se generará tu recibo detallado con lo que compraste y te enviaremos directamente al enlace oficial de PagueloFacil para pagar tus <strong className="text-[#c5a059] font-mono">${total.toFixed(2)} USD</strong> con tus tarjetas Visa, Mastercard o Clave.
                        </p>
                        <div className="flex items-center gap-2 pt-1 text-[10px] text-emerald-400 font-mono">
                          <ShieldCheck size={12} />
                          <span>Conexión cifrada sin ingresar datos bancarios en esta página</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {metodoPago === 'efectivo' && (
                    <div className="p-4 rounded-xl bg-stone-900/80 border border-white/10 text-xs text-stone-300 space-y-1 animate-in fade-in duration-200">
                      <p className="font-semibold text-white">Pago en Efectivo:</p>
                      <p className="text-[11px] text-stone-400 font-light">
                        {tipoEntrega === 'retiro'
                          ? 'Cancela en caja directamente al momento de retirar tus piezas en nuestro local.'
                          : 'Cancela en efectivo al recibir el paquete.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mandatory Legal Acceptance Checkbox */}
                <div className="pt-4 border-t border-white/[0.08] space-y-1.5">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none group">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        setAcceptedTerms(e.target.checked);
                        if (formErrors.terms) {
                          setFormErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.terms;
                            return updated;
                          });
                        }
                      }}
                      className="mt-0.5 w-4 h-4 rounded border border-white/20 bg-black/60 text-[#c5a059] focus:ring-1 focus:ring-[#c5a059] focus:ring-offset-0 cursor-pointer accent-[#c5a059]"
                    />
                    <span className="leading-snug text-[11px] text-stone-300 font-light">
                      He leído y acepto los{' '}
                      <a
                        href="/terminos-y-condiciones"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#c5a059] hover:underline underline-offset-2 font-medium"
                      >
                        Términos y Condiciones
                      </a>{' '}
                      y la{' '}
                      <a
                        href="/politica-de-privacidad"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#c5a059] hover:underline underline-offset-2 font-medium"
                      >
                        Política de Privacidad
                      </a>
                      .*
                    </span>
                  </label>
                  {formErrors.terms && (
                    <p className="text-[10px] text-rose-400 pl-6.5 font-medium leading-tight">
                      {formErrors.terms}
                    </p>
                  )}
                </div>

                {/* Submit button on mobile/desktop */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || items.length === 0}
                    className="w-full py-4 bg-white hover:bg-stone-200 text-stone-950 font-semibold uppercase tracking-[0.2em] text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Registrando Pedido...</span>
                    ) : (
                      <>
                        <span>Confirmar Pedido · ${total.toFixed(2)}</span>
                        <ArrowRight size={14} className="stroke-[2]" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 p-6 sm:p-10 bg-stone-950/60 flex flex-col justify-between">
              <div>
                <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-stone-300 mb-6">
                  Resumen de la Orden ({items.reduce((acc, i) => acc + i.quantity, 0)})
                </h3>

                <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1 divide-y divide-white/[0.06]">
                  {items.map((item) => (
                    <div key={item.product.id} className="pt-4 first:pt-0 flex gap-3">
                      <div className="w-14 h-16 bg-stone-900 border border-white/10 overflow-hidden shrink-0">
                        <img
                          src={item.product.imagen_url || '/images/logo/logotipo.jpeg'}
                          alt={item.product.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-serif-luxury text-white truncate">
                            {item.product.nombre}
                          </h4>
                          <span className="text-[10px] text-stone-400 font-light">
                            Cant: {item.quantity}
                          </span>
                        </div>
                        <span className="text-xs font-mono tabular-nums text-white">
                          ${(item.product.precio * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="pt-6 border-t border-white/10 space-y-2.5 text-xs mt-6">
                <div className="flex justify-between text-stone-400 font-light">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-400 font-light gap-2">
                  <span>
                    {tipoEntrega === 'retiro' ? 'Retiro en Local' : `Envío (${courier})`}
                  </span>
                  <span className="font-mono text-xs text-right text-white">
                    {tipoEntrega === 'retiro' ? (
                      <span className="text-emerald-400">Gratis ($0.00)</span>
                    ) : (
                      <span className="text-[#c5a059] font-medium text-[11px] block">
                        {shippingCostEstimate}
                      </span>
                    )}
                  </span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between text-sm">
                  <span className="uppercase tracking-[0.16em] text-xs font-medium text-white">Total</span>
                  <span className="text-lg font-mono tabular-nums font-semibold text-white">
                    ${total.toFixed(2)}
                  </span>
                </div>

                <div className="pt-4 flex items-center gap-2 text-[10px] text-stone-400 font-light">
                  <ShieldCheck size={14} className="text-[#c5a059]" />
                  <span>Transacción protegida. Registro automático en Supabase.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
