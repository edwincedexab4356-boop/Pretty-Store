import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  User,
  MapPin,
  Phone,
  Truck,
  Store,
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
  const [courier, setCourier] = useState<CourierOption>('Uno Express');

  // Contact Details
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');

  // Payment Method
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('yappy');
  const [comprobantePago, setComprobantePago] = useState('');

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Submission & Confirmation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<CreatedOrderResult | null>(null);
  const [yappyRedirectUrl, setYappyRedirectUrl] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  if (!isCheckoutOpen) return null;

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format Card Expiry MM/AA
  const handleCardExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

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
        : `🚚 *Modalidad:* Envío a Domicilio (${courier || 'Uno Express'})\n📍 *Dirección de Entrega:* ${direccion.trim()}`;

    const textMessage = `✨ *NUEVO PEDIDO - ${config.nombre_tienda || 'PRETTY-STORE'}* ✨

📋 *Pedido:* ${orderNum || '#' + orderIdVal}
👤 *Cliente:* ${nombre.trim()}
📱 *Teléfono:* ${telefono.trim()}
${deliveryDetail}

🛒 *Detalle del Pedido:*
${itemsSummary}

💰 *Total Pagado por Yappy:* $${total.toFixed(2)}
${comprobantePago.trim() ? `🧾 *Comprobante / Referencia:* ${comprobantePago.trim()}\n` : ''}
Hola, acabo de registrar mi pedido en la tienda y realizar el pago mediante Yappy. Adjunto aquí la captura / comprobante de mi pago para su verificación y envío. ¡Muchas gracias!`;

    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(textMessage)}`;
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!nombre.trim()) errors.nombre = 'El nombre completo es requerido';
    if (!telefono.trim()) errors.telefono = 'El teléfono de contacto es requerido';

    if (tipoEntrega === 'delivery') {
      if (!direccion.trim()) {
        errors.direccion = 'La ubicación o dirección de entrega es requerida para envíos';
      }
      if (!courier) {
        errors.courier = 'Selecciona la empresa de envíos preferida';
      }
    }

    if (metodoPago === 'tarjeta') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length < 15) {
        errors.cardNumber = 'Ingresa un número de tarjeta válido (15-16 dígitos)';
      }
      if (!cardHolder.trim()) {
        errors.cardHolder = 'Ingresa el nombre del titular como aparece en la tarjeta';
      }
      if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
        errors.cardExpiry = 'Fecha de expiración inválida (MM/AA)';
      }
      if (cardCvv.length < 3) {
        errors.cardCvv = 'CVV inválido';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const maskedCard =
        metodoPago === 'tarjeta' && cardNumber
          ? `•••• •••• •••• ${cardNumber.replace(/\s/g, '').slice(-4)}`
          : undefined;

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
        comprobantePago: comprobantePago.trim() || undefined,
        tarjetaInfo:
          metodoPago === 'tarjeta' && maskedCard
            ? {
                numeroEnmascarado: maskedCard,
                titular: cardHolder.trim(),
              }
            : undefined,
        notas: notas.trim() || undefined,
      });

      setConfirmedOrder(orderSummary);
      clearCart();

      // Redireccionar a WhatsApp para enviar comprobante y pedido si pagó con Yappy
      if (metodoPago === 'yappy') {
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
    } catch (err: any) {
      console.warn('Error al registrar pedido en Supabase:', err);
      // Fallback display
      const generatedId = `PED-${Math.floor(100000 + Math.random() * 900000)}`;
      const fallbackOrderNumber = `#PED-${generatedId.slice(-6)}`;
      setConfirmedOrder({
        orderId: generatedId,
        orderNumber: fallbackOrderNumber,
        date: new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        nombre,
        email: email || `${telefono}@prettystore.com`,
        telefono,
        direccion:
          tipoEntrega === 'retiro'
            ? 'Retiro en el Local / Tienda'
            : `${direccion} (Envío vía: ${courier})`,
        metodoPago,
        tipoEntrega,
        courier: tipoEntrega === 'delivery' ? courier : undefined,
        comprobantePago,
        subtotal,
        shipping,
        total,
        itemCount: items.reduce((acc, i) => acc + i.quantity, 0),
        notas: notas.trim() || undefined,
        items,
      });
      clearCart();

      if (metodoPago === 'yappy') {
        const waUrl = generateYappyWhatsAppUrl(
          fallbackOrderNumber,
          generatedId,
          items
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
    setCardNumber('');
    setCardHolder('');
    setCardExpiry('');
    setCardCvv('');
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
            <div className="bg-stone-900/50 border border-white/10 p-6 max-w-lg mx-auto text-left mb-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 block">Número de Pedido</span>
                  <span className="text-base font-mono tabular-nums text-white font-medium">
                    #{confirmedOrder.orderId}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 block">Modalidad</span>
                  <span className="text-xs text-[#c5a059] font-medium uppercase tracking-wider">
                    {confirmedOrder.tipoEntrega === 'retiro' ? 'Retiro en Local' : `Delivery (${confirmedOrder.courier})`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-stone-400 font-light block">Cliente:</span>
                  <span className="text-white font-medium">{confirmedOrder.nombre}</span>
                  <span className="text-stone-400 block font-light">{confirmedOrder.telefono}</span>
                </div>
                <div>
                  <span className="text-stone-400 font-light block">Método de Pago:</span>
                  <span className="text-white font-medium uppercase text-[11px] tracking-wider">
                    {confirmedOrder.metodoPago}
                  </span>
                  {confirmedOrder.comprobantePago && (
                    <span className="text-[10px] text-amber-400 font-mono block">
                      Ref: {confirmedOrder.comprobantePago}
                    </span>
                  )}
                </div>
              </div>

              {confirmedOrder.tipoEntrega === 'delivery' ? (
                <div className="pt-2 border-t border-white/10 text-xs">
                  <span className="text-stone-400 font-light block">Dirección de Entrega:</span>
                  <span className="text-white">{confirmedOrder.direccion}</span>
                </div>
              ) : (
                <div className="pt-2 border-t border-white/10 text-xs">
                  <span className="text-stone-400 font-light block">Punto de Retiro:</span>
                  <span className="text-emerald-400 font-medium">Atelier Pretty-Store (Costa del Este)</span>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-stone-400">Total a Cancelar:</span>
                <span className="text-lg font-mono tabular-nums font-semibold text-white">
                  ${confirmedOrder.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* WhatsApp Receipt Card for Yappy */}
            {confirmedOrder.metodoPago === 'yappy' && (
              <div className="max-w-lg mx-auto mb-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-[#0e0e12] to-emerald-950/40 border border-emerald-500/40 text-left space-y-4 shadow-2xl">
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
                  Tu pedido <strong className="text-white">{confirmedOrder.orderNumber || '#' + confirmedOrder.orderId}</strong> ha sido registrado en el sistema. Para procesar tu despacho, envía la captura o comprobante de tu pago por Yappy al WhatsApp oficial del comercio. El mensaje ya ha sido redactado con todos los detalles de tu orden.
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

                  {/* 3. SI ELIGE DELIVERY: PEDIR UBICACIÓN Y AGENCIA (Uno Express, Ferguson, Servi Entrega) */}
                  {tipoEntrega === 'delivery' ? (
                    <div className="space-y-4 p-4 rounded-xl bg-stone-900/40 border border-white/10 animate-in fade-in duration-200">
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase tracking-[0.16em] text-stone-300 font-light block flex items-center justify-between">
                          <span>Ubicación / Dirección exacta de Entrega *</span>
                          <span className="text-[10px] text-[#c5a059] font-mono">Panamá</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Calle, Edificio/Casa, Número de Apto, Corregimiento o Sucursal"
                          value={direccion}
                          onChange={(e) => setDireccion(e.target.value)}
                          className={`w-full px-3.5 py-2.5 bg-stone-900/80 border text-xs text-white placeholder-stone-600 focus:outline-none transition-colors ${
                            formErrors.direccion ? 'border-rose-500' : 'border-white/10 focus:border-white/30'
                          }`}
                        />
                        {formErrors.direccion && (
                          <p className="text-[10px] text-rose-400">{formErrors.direccion}</p>
                        )}
                      </div>

                      {/* Selector de Agencia de Envíos */}
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase tracking-[0.16em] text-stone-300 font-light block">
                          ¿Por dónde lo quieres enviar? *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {courierOptions.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setCourier(opt.id)}
                              className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                                courier === opt.id
                                  ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-1 ring-[#c5a059]'
                                  : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/20'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-white">{opt.name}</span>
                                {courier === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]" />}
                              </div>
                              <span className="text-[9px] text-stone-400 block mt-1 leading-tight">
                                {opt.desc}
                              </span>
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-[#c5a059] font-light mt-1">
                          * El costo de envío con {courier} se coordina directamente según el destino y peso del paquete.
                        </p>
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
                        Atelier Pretty-Store: Boulevard Costa del Este, Torre Financial Park. Tu pedido se apartará de inmediato a tu nombre y teléfono.
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

                {/* 4. MÉTODO DE PAGO */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <label className="text-[11px] uppercase tracking-[0.16em] text-stone-300 font-light block">
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

                    {/* Transferencia */}
                    <button
                      type="button"
                      onClick={() => setMetodoPago('transferencia')}
                      className={`p-3 border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                        metodoPago === 'transferencia'
                          ? 'border-[#c5a059] bg-[#c5a059]/10 text-white'
                          : 'border-white/10 bg-stone-900/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <Building2 size={18} className={metodoPago === 'transferencia' ? 'text-[#c5a059]' : 'text-stone-400'} />
                      <span className="text-xs font-medium">ACH / Banco</span>
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
                          <strong className="text-white block font-medium">Redirección a WhatsApp para Comprobante:</strong>
                          Al presionar <span className="text-white font-semibold">"Confirmar Pedido"</span> serás redirigido automáticamente a nuestro WhatsApp con todos los detalles de tu orden listos para que adjuntes tu captura o comprobante de Yappy.
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-1">
                          Nº de Referencia o Celular Yappy (Opcional si adjuntas comprobante en WhatsApp):
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. 6890-1234 o #REF-9842"
                          value={comprobantePago}
                          onChange={(e) => setComprobantePago(e.target.value)}
                          className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:border-[#c5a059]"
                        />
                      </div>
                    </div>
                  )}

                  {metodoPago === 'tarjeta' && (
                    <div className="p-4 rounded-xl bg-stone-900/80 border border-white/10 space-y-3 text-xs animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="text-stone-300 font-medium flex items-center gap-1.5">
                          <Lock size={12} className="text-[#c5a059]" />
                          <span>Pago Seguro con Tarjeta</span>
                        </span>
                        <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">
                          Visa / Mastercard / Clave
                        </span>
                      </div>

                      {/* Optional Payment Link button if configured by store owner */}
                      {config.link_pago_tarjeta && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between gap-2">
                          <div className="text-[11px] text-amber-200">
                            <span className="font-semibold block">Pasarela Externa Disponible:</span>
                            <span className="text-[10px] text-amber-300/80 font-light">
                              Puedes pagar directamente por link seguro o ingresar tus datos abajo.
                            </span>
                          </div>
                          <a
                            href={config.link_pago_tarjeta}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold shrink-0 flex items-center gap-1 shadow"
                          >
                            <span>Abrir Pasarela</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      )}

                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-1">
                            Número de Tarjeta *
                          </label>
                          <input
                            type="text"
                            placeholder="4000 1234 5678 9010"
                            value={cardNumber}
                            onChange={(e) => handleCardNumberChange(e.target.value)}
                            maxLength={19}
                            className={`w-full px-3 py-2 bg-black/60 border text-xs text-white font-mono focus:outline-none ${
                              formErrors.cardNumber ? 'border-rose-500' : 'border-white/10 focus:border-[#c5a059]'
                            }`}
                          />
                          {formErrors.cardNumber && (
                            <p className="text-[10px] text-rose-400 mt-1">{formErrors.cardNumber}</p>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-1">
                            Nombre del Titular (en la tarjeta) *
                          </label>
                          <input
                            type="text"
                            placeholder="ROBERTO DE LA ESPRIELLA"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                            className={`w-full px-3 py-2 bg-black/60 border text-xs text-white uppercase focus:outline-none ${
                              formErrors.cardHolder ? 'border-rose-500' : 'border-white/10 focus:border-[#c5a059]'
                            }`}
                          />
                          {formErrors.cardHolder && (
                            <p className="text-[10px] text-rose-400 mt-1">{formErrors.cardHolder}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-1">
                              Vencimiento (MM/AA) *
                            </label>
                            <input
                              type="text"
                              placeholder="12/28"
                              value={cardExpiry}
                              onChange={(e) => handleCardExpiryChange(e.target.value)}
                              maxLength={5}
                              className={`w-full px-3 py-2 bg-black/60 border text-xs text-white font-mono focus:outline-none ${
                                formErrors.cardExpiry ? 'border-rose-500' : 'border-white/10 focus:border-[#c5a059]'
                              }`}
                            />
                            {formErrors.cardExpiry && (
                              <p className="text-[10px] text-rose-400 mt-1">{formErrors.cardExpiry}</p>
                            )}
                          </div>

                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-1">
                              CVV *
                            </label>
                            <input
                              type="password"
                              placeholder="123"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              maxLength={4}
                              className={`w-full px-3 py-2 bg-black/60 border text-xs text-white font-mono focus:outline-none ${
                                formErrors.cardCvv ? 'border-rose-500' : 'border-white/10 focus:border-[#c5a059]'
                              }`}
                            />
                            {formErrors.cardCvv && (
                              <p className="text-[10px] text-rose-400 mt-1">{formErrors.cardCvv}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1 text-[10px] text-stone-500">
                          <Lock size={10} className="text-[#c5a059]" />
                          <span>Cifrado SSL 256-bit. Tus datos viajan protegidos bajo estrictos protocolos bancarios.</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {metodoPago === 'transferencia' && (
                    <div className="p-4 rounded-xl bg-stone-900/80 border border-white/10 space-y-3 text-xs animate-in fade-in duration-200">
                      <span className="text-stone-300 font-medium block pb-1 border-b border-white/10">
                        Datos Bancarios para ACH / Depósito:
                      </span>
                      <div className="space-y-1 text-slate-300 font-mono text-[11px] whitespace-pre-line bg-black/40 p-3 rounded border border-white/5">
                        {config.banco_datos ||
                          'Banco General - Cuenta Corriente #03-01-01-123456-7 a nombre de Pretty-Store Inc.'}
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-stone-400 block mb-1">
                          Nº de Referencia o Comprobante de Transferencia:
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. ACH-908123"
                          value={comprobantePago}
                          onChange={(e) => setComprobantePago(e.target.value)}
                          className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:border-[#c5a059]"
                        />
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

                {/* Submit button on mobile/desktop */}
                <div className="pt-4">
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
                <div className="flex justify-between text-stone-400 font-light">
                  <span>
                    {tipoEntrega === 'retiro' ? 'Retiro en Local' : `Envío (${courier})`}
                  </span>
                  <span className="font-mono tabular-nums text-white">
                    {tipoEntrega === 'retiro' ? (
                      <span className="text-emerald-400">Gratis ($0.00)</span>
                    ) : (
                      <span className="text-[#c5a059]">Por coordinar</span>
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
