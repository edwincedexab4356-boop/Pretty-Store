import React, { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  User,
  MapPin,
  Truck,
  Store,
  Home,
  Lock,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Landmark,
  Copy,
  Check,
  Clock,
  Tag,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { MetodoPago, TipoEntrega, CourierOption } from '../../types/database';
import { createRealOrder, CreatedOrderResult } from '../../services/checkoutService';
import { isLegendaryCap } from '../../utils/promoUtils';

// NÚMEROS OFICIALES ESPECIFICADOS POR EL USUARIO:
// 1. Número EXCLUSIVO para pagar por Yappy: 6402-8245
export const YAPPY_PAY_PHONE = '6402-8245';
// 2. Número oficial de WhatsApp para enviar el pedido y recibo de compra: 6215-0251
export const WHATSAPP_ORDERS_PHONE = '50762150251';

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

export const COURIER_SUCURSALES: Record<PanamaProvince, { ferguson: string[]; unoExpress: string[]; servientrega: string[] }> = {
  'Panamá Oeste': {
    ferguson: ['La Chorrera (Parque Feuillet)', 'Arraiján Cabecera', 'Vista Alegre', 'Capira', 'Coronado'],
    unoExpress: ['La Chorrera (Plaza Italia)', 'Westland Mall', 'Arraiján (Plaza Paseo)', 'Coronado'],
    servientrega: ['La Chorrera (Av. de las Américas)', 'Westland Mall (Kiosco)', 'Arraiján Cabecera', 'Coronado'],
  },
  'Panamá Capital': {
    ferguson: ['Vía España (Central)', 'Albrook Mall', 'El Dorado', 'Calidonia', 'Los Pueblos', 'Tocumen'],
    unoExpress: ['El Dorado', 'Albrook Terminal', 'Calle 50 / San Francisco', 'Costa del Este', 'Vía Brasil', 'Los Pueblos'],
    servientrega: ['Vía España (Edif. Dominó)', 'El Dorado (Plaza Golden)', 'Albrook Mall', 'Calle 50 / Marbella', 'Costa del Este', 'Los Pueblos (Juan Díaz)', 'Brisas del Golf'],
  },
  'Chiriquí': {
    ferguson: ['David (Terminal)', 'David (Calle 4ta)', 'Boquete', 'Bugaba', 'Paso Canoas'],
    unoExpress: ['David (Plaza Oteima)', 'David (Centro)', 'Boquete', 'Paso Canoas Frontera'],
    servientrega: ['David (Calle F Sur)', 'David (Plaza Coquito)', 'Boquete (Bajo Boquete)', 'Paso Canoas'],
  },
  'Veraguas': {
    ferguson: ['Santiago (Terminal)', 'Santiago (Calle Décima)', 'Soná'],
    unoExpress: ['Santiago (Plaza Boulevard)', 'Santiago (Centro)'],
    servientrega: ['Santiago (Av. Central)', 'Santiago (Terminal de Transporte)'],
  },
  'Herrera': {
    ferguson: ['Chitré (Paseo Enrique Geenzier)', 'Chitré (Terminal)', 'Pesé'],
    unoExpress: ['Chitré (Plaza Moderna)', 'Chitré (Terminal)'],
    servientrega: ['Chitré (Av. Herrera)', 'Chitré (Plaza Azuero)'],
  },
  'Los Santos': {
    ferguson: ['Las Tablas (Parque Porras)', 'Las Tablas (Terminal)', 'Pedasí'],
    unoExpress: ['Las Tablas (Centro)', 'Guararé'],
    servientrega: ['Las Tablas (Vía Santo Domingo)', 'Pedasí Centro'],
  },
  'Coclé': {
    ferguson: ['Penonomé (Central)', 'Aguadulce (Vía Interamericana)', 'Antón'],
    unoExpress: ['Penonomé (Plaza Boulevard)', 'Aguadulce (Centro)'],
    servientrega: ['Penonomé (Interamericana frente al Machetazo)', 'Aguadulce (Av. Rodolfo Chiari)'],
  },
  'Colón': {
    ferguson: ['Colón Centro (Calle 11)', 'Cuatro Altos'],
    unoExpress: ['Colón 2000', 'Cuatro Altos Shopping'],
    servientrega: ['Colón (Calle 13 y Bolívar)', 'Cuatro Altos (Plaza Millenium)'],
  },
  'Bocas del Toro': {
    ferguson: ['Changuinola (Frente al Parque)', 'Almirante', 'Isla Colón'],
    unoExpress: ['Changuinola (Terminal)', 'Almirante'],
    servientrega: ['Changuinola (Av. 17 de Abril)', 'Isla Colón (Calle 3ra)'],
  },
  'Darién': {
    ferguson: ['Metetí (Centro)', 'La Palma'],
    unoExpress: ['Metetí (Agencia Principal)'],
    servientrega: ['Metetí (Plaza Darién)'],
  },
  'Comarcas': {
    ferguson: ['Agencia Principal / Más Cercana'],
    unoExpress: ['Agencia Principal / Más Cercana'],
    servientrega: ['Agencia Principal / Más Cercana'],
  },
};

export const CheckoutDemoModal: React.FC = () => {
  const { config } = useStoreConfig();
  const {
    items,
    subtotal,
    discount,
    promo,
    isCheckoutOpen,
    setIsCheckoutOpen,
    clearCart,
  } = useCart();

  // 1. Tipo de Entrega: 'delivery' o 'retiro'
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('delivery');

  // 2. Courier de Envíos: Ferguson, Uno Express o Servientrega
  const [courier, setCourier] = useState<CourierOption>('Ferguson');

  // 3. Si eligió Servientrega: modalidad sucursal o domicilio
  const [servientregaModalidad, setServientregaModalidad] = useState<'sucursal' | 'domicilio'>('sucursal');

  // 4. Provincia seleccionada
  const [provincia, setProvincia] = useState<PanamaProvince>('Panamá Oeste');

  // 5. Sucursal de retiro o dirección
  const [sucursalRetiro, setSucursalRetiro] = useState('La Chorrera (Parque Feuillet)');
  const [direccion, setDireccion] = useState('');

  // Contact Details
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [notas, setNotas] = useState('');

  // Payment Method (Yappy, Transferencia, Tarjeta)
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('yappy');
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedYappy, setCopiedYappy] = useState(false);

  // Submission & Confirmation
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<CreatedOrderResult | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Helper para avanzar suavemente a la siguiente sección
  const scrollToSection = (id: string) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 80);
  };

  // Determinar si la provincia es zona lejana / interior
  const isFarProvince = useMemo(() => {
    const found = PANAMA_PROVINCES.find((p) => p.id === provincia);
    return found ? found.zone === 'lejos' : false;
  }, [provincia]);

  // Lista de sucursales según courier y provincia
  const currentBranchList = useMemo(() => {
    const provData = COURIER_SUCURSALES[provincia];
    if (!provData) return [`Agencia Principal (${provincia})`];
    if (courier === 'Ferguson') return provData.ferguson || [];
    if (courier === 'Uno Express') return provData.unoExpress || [];
    if (courier === 'Servientrega') return provData.servientrega || [`Servi Entrega ${provincia} Central`];
    return [];
  }, [provincia, courier]);

  // Tarifa exacta del envío según opciones
  const shippingCost = useMemo(() => {
    if (tipoEntrega === 'retiro') return 0;
    if (courier === 'Ferguson') return isFarProvince ? 6.50 : 5.00;
    if (courier === 'Uno Express') return isFarProvince ? 7.50 : 6.50;
    if (courier === 'Servientrega') {
      return servientregaModalidad === 'sucursal' ? (isFarProvince ? 5.00 : 3.86) : 7.03;
    }
    return 5.00;
  }, [tipoEntrega, courier, servientregaModalidad, isFarProvince]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - discount) + shippingCost;
  }, [subtotal, discount, shippingCost]);

  if (!isCheckoutOpen) return null;

  const copyBankDetails = (accountNum: string) => {
    navigator.clipboard.writeText(accountNum);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const copyYappyNumber = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedYappy(true);
    setTimeout(() => setCopiedYappy(false), 2500);
  };

  // Generador del Recibo Oficial de Compra formateado con el diseño exacto solicitado
  const generateOfficialReceiptWhatsAppUrl = (
    orderNum: string,
    orderIdVal: string,
    orderItems: { product: { nombre: string; precio: number }; quantity: number }[],
    orderSubtotal: number,
    orderShipping: number,
    orderTotal: number,
    orderPaymentMethod: MetodoPago,
    orderDeliveryType: TipoEntrega,
    orderCourier: CourierOption,
    orderServiModality: 'sucursal' | 'domicilio',
    orderProvincia: PanamaProvince,
    orderAddress: string,
    orderSucursal: string,
    orderDiscount: number = 0,
    orderPromoTitle: string = 'Promoción 2 Gorras Legendarias ($55)'
  ) => {
    const now = new Date();
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const dateFormatted = `${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()} a las ${now.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', hour12: false })}`;

    const paymentLabel =
      orderPaymentMethod === 'yappy'
        ? 'Yappy'
        : orderPaymentMethod === 'transferencia'
        ? 'Transferencia Bancaria'
        : 'Tarjeta (PagueloFacil)';

    let entregaLabel = '';
    let direccionLabel = '';

    if (orderDeliveryType === 'retiro') {
      entregaLabel = 'Retiro en el Local';
      direccionLabel = 'Sede Pretty-Store (La Chorrera, Panamá Oeste)';
    } else {
      entregaLabel = `Delivery (${orderCourier})`;
      if (orderCourier === 'Servientrega' && orderServiModality === 'domicilio') {
        direccionLabel = `Entrega a Domicilio: ${orderAddress.trim()} (${orderProvincia})`;
      } else {
        direccionLabel = `Sucursal ${orderCourier}: ${orderSucursal.trim() || orderAddress.trim()} (${orderProvincia})`;
      }
    }

    const itemsCount = (orderItems || []).reduce((acc, it) => acc + it.quantity, 0);
    const itemsHeader = `(${itemsCount} ${itemsCount === 1 ? 'artículo' : 'artículos'})`;

    const itemsText = (orderItems || []).map((it) => {
      const lineTotal = (it.quantity * it.product.precio).toFixed(2);
      return `${it.product.nombre}\n\nCant: ${it.quantity} × $${it.product.precio.toFixed(2)}\n\n$${lineTotal}`;
    }).join('\n\n');

    const discountBlock = orderDiscount > 0
      ? `\n\n${orderPromoTitle || 'Promoción 2 Gorras Legendarias ($55)'}\n-$${orderDiscount.toFixed(2)}`
      : '';

    const receiptMessage = `Recibo Oficial de Compra
${orderNum || '#' + orderIdVal}

Fecha
${dateFormatted}

Cliente:
${nombre.trim()}
${telefono.trim()}

Método de Pago:
${paymentLabel}

Entrega:
${entregaLabel}

Dirección de Entrega:
${direccionLabel}

Productos Comprados
${itemsHeader}
${itemsText}

Subtotal
$${orderSubtotal.toFixed(2)}${discountBlock}

Envío / Entrega
$${orderShipping.toFixed(2)}

Total:
$${orderTotal.toFixed(2)} USD`;

    return `https://wa.me/${WHATSAPP_ORDERS_PHONE}?text=${encodeURIComponent(receiptMessage)}`;
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
          errors.direccion = 'Ingresa la dirección para el delivery hasta la casa';
        }
      } else {
        if (!sucursalRetiro.trim()) {
          const defaultSuc = currentBranchList[0] || `Agencia Principal (${provincia})`;
          setSucursalRetiro(defaultSuc);
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
      const branchClean = sucursalRetiro.trim() || currentBranchList[0] || `Agencia Principal (${provincia})`;
      const resolvedAddress =
        tipoEntrega === 'retiro'
          ? 'Retiro en el Local / Tienda física (Pretty-Store)'
          : (courier === 'Servientrega' && servientregaModalidad === 'domicilio')
            ? (direccion.trim() || `Entrega a Domicilio (${provincia})`)
            : `Sucursal ${courier}: ${branchClean} (${provincia})`;

      const orderSummary = await createRealOrder({
        items,
        subtotal,
        discount,
        promoTitle: promo.promoTitle,
        shipping: shippingCost,
        total: finalTotal,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        direccion: resolvedAddress,
        metodoPago,
        tipoEntrega,
        courier: tipoEntrega === 'delivery' ? courier : undefined,
        comprobantePago: metodoPago === 'tarjeta' ? 'PagueloFacil Checkout' : undefined,
      });

      setConfirmedOrder(orderSummary);
      clearCart();
    } catch (err: any) {
      setSubmissionError(err?.message || 'Error al procesar el pedido. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    setIsCheckoutOpen(false);
    setConfirmedOrder(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#09090b] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#c5a059]" />
            <span className="text-xs uppercase tracking-[0.25em] text-[#c5a059] font-medium">
              Pretty-Store · Checkout
            </span>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        {confirmedOrder ? (
          /* ================= ORDER CONFIRMATION & RECEIPT SCREEN ================= */
          <div className="p-6 sm:p-10 overflow-y-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#c5a059] font-medium block mb-1">
                Orden Registrada con Éxito
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif-luxury font-light text-white tracking-wide">
                ¡Gracias por tu compra, {confirmedOrder.nombre}!
              </h2>
              <p className="text-xs text-stone-400 font-light mt-1">
                Tu pedido{' '}
                <strong className="text-white font-mono font-semibold">
                  #{confirmedOrder.orderNumber || confirmedOrder.orderId}
                </strong>{' '}
                ha sido procesado y guardado.
              </p>
            </div>

            {/* AVISO IMPORTANTE DE 48 HORAS CONDICIONAL */}
            <div className="max-w-xl mx-auto p-4 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-200 text-xs flex items-start gap-3 text-left shadow-lg">
              <Clock size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-amber-300 font-semibold block text-xs uppercase tracking-wider">
                  ⚠️ Aviso Importante: Plazo de 48 Horas
                </strong>
                <p className="text-[11px] text-stone-200 font-light leading-relaxed">
                  {confirmedOrder.tipoEntrega === 'retiro'
                    ? 'Dispones de un plazo máximo de 48 horas para retirar tu entrega en la tienda con tu comprobante.'
                    : 'Dispones de un plazo máximo de 48 horas para coordinar tu entrega con tu comprobante de pago.'}
                </p>
              </div>
            </div>

            {/* RECIBO OFICIAL DE COMPRA (DISEÑO LIMPIO EXACTO) */}
            <div className="max-w-xl mx-auto p-6 sm:p-7 rounded-2xl bg-black/80 border border-white/15 text-left space-y-4 shadow-2xl font-sans">
              <div className="border-b border-white/10 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Recibo Oficial de Compra
                  </h3>
                  <p className="text-sm font-mono text-[#c5a059] font-semibold mt-0.5">
                    #{confirmedOrder.orderNumber || confirmedOrder.orderId}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/30 text-[10px] font-mono uppercase">
                  Comprobante
                </span>
              </div>

              {/* Fecha y Datos del Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-b border-white/10 pb-3">
                <div>
                  <span className="text-stone-400 text-[11px] block font-light">Fecha:</span>
                  <span className="text-white font-medium block">
                    {new Date().toLocaleDateString('es-PA', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    a las{' '}
                    {new Date().toLocaleTimeString('es-PA', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 text-[11px] block font-light">Cliente:</span>
                  <span className="text-white font-medium block">{confirmedOrder.nombre}</span>
                  <span className="text-stone-300 font-mono text-[11px] block">{confirmedOrder.telefono}</span>
                </div>
              </div>

              {/* Método de Pago y Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-b border-white/10 pb-3">
                <div>
                  <span className="text-stone-400 text-[11px] block font-light">Método de Pago:</span>
                  <span className="text-[#c5a059] font-semibold block capitalize">
                    {confirmedOrder.metodoPago === 'yappy'
                      ? 'Yappy'
                      : confirmedOrder.metodoPago === 'transferencia'
                      ? 'Transferencia Bancaria'
                      : 'Tarjeta'}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 text-[11px] block font-light">Entrega:</span>
                  <span className="text-white font-medium block">
                    {confirmedOrder.tipoEntrega === 'retiro'
                      ? 'Retiro en el Local'
                      : `Delivery (${confirmedOrder.courier})`}
                  </span>
                </div>
                <div className="sm:col-span-2 pt-1">
                  <span className="text-stone-400 text-[11px] block font-light">Dirección de Entrega:</span>
                  <span className="text-white font-medium block text-xs">{confirmedOrder.direccion}</span>
                </div>
              </div>

              {/* Productos Comprados */}
              <div className="space-y-2 border-b border-white/10 pb-3 text-xs">
                <span className="text-white font-semibold block text-xs">
                  Productos Comprados ({(confirmedOrder.items || items).length}{' '}
                  {(confirmedOrder.items || items).length === 1 ? 'artículo' : 'artículos'})
                </span>
                <div className="space-y-3 pt-1">
                  {(confirmedOrder.items || items).map((it, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-3">
                      <div>
                        <p className="text-white font-medium">{it.product.nombre}</p>
                        <p className="text-stone-400 text-[11px] font-mono mt-0.5">
                          Cant: {it.quantity} × ${it.product.precio.toFixed(2)}
                        </p>
                      </div>
                      <span className="font-mono text-white font-semibold">
                        ${(it.quantity * it.product.precio).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desglose Financiero */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-300">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">${confirmedOrder.subtotal.toFixed(2)}</span>
                </div>
                {Boolean(confirmedOrder.discount && confirmedOrder.discount > 0) && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>{confirmedOrder.promoTitle || 'Promoción 2 Gorras Legendarias ($55)'}</span>
                    <span className="font-mono">-${confirmedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-300">
                  <span>Envío / Entrega</span>
                  <span className="font-mono text-white">
                    {confirmedOrder.shipping > 0
                      ? `$${confirmedOrder.shipping.toFixed(2)}`
                      : 'Gratis ($0.00)'}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm">
                  <span className="font-bold text-white uppercase tracking-wider text-xs">Total:</span>
                  <span className="text-xl font-mono font-bold text-[#c5a059]">
                    ${confirmedOrder.total.toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* ACCIÓN DE PAGO DESPUÉS DE CONFIRMAR PEDIDO (SOLICITADO POR EL USUARIO) */}
            {/* ============================================================== */}

            {/* 1. SI ES YAPPY: NÚMERO Y BOTÓN COPIAR 6402-8245 */}
            {confirmedOrder.metodoPago === 'yappy' && (
              <div className="max-w-xl mx-auto p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#c5a059]/20 via-black to-[#0e0e12] border border-[#c5a059]/60 text-left space-y-3.5 shadow-2xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Smartphone size={20} className="text-[#c5a059]" />
                    <span className="text-white font-bold text-sm">Pagar vía Yappy</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-medium">
                    Pago Inmediato
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-black/85 border border-[#c5a059]/60 space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#c5a059] block">
                    Número Telefónico de Yappy (Solo para Enviar el Pago)
                  </span>

                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-stone-900 border border-white/10">
                    <div>
                      <span className="text-[10px] text-stone-400 block font-light">Envía el dinero al número:</span>
                      <span className="text-white font-mono text-xl sm:text-2xl font-bold tracking-wider text-[#c5a059] block">
                        {YAPPY_PAY_PHONE}
                      </span>
                      <span className="text-[11px] text-stone-300 block font-light mt-0.5">
                        Total exacto a transferir: <strong className="text-white font-mono">${confirmedOrder.total.toFixed(2)} USD</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyYappyNumber(YAPPY_PAY_PHONE)}
                      className="px-4 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-lg shadow-[#c5a059]/20"
                    >
                      {copiedYappy ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copiedYappy ? '¡Copiado!' : `Copiar ${YAPPY_PAY_PHONE}`}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-amber-300 font-light leading-relaxed pt-1">
                    * <strong>Paso a seguir:</strong> Copia el número <strong>{YAPPY_PAY_PHONE}</strong> y realiza el pago desde tu Banca en Línea. Luego pulsa el botón verde a continuación para enviar tu <strong>Recibo Oficial</strong> y la captura del pago a nuestro WhatsApp oficial (<strong>6215-0251</strong>).
                  </p>
                </div>
              </div>
            )}

            {/* 2. SI ES TRANSFERENCIA BANCARIA: CUENTA Y BOTÓN COPIAR CUENTA */}
            {confirmedOrder.metodoPago === 'transferencia' && (
              <div className="max-w-xl mx-auto p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#c5a059]/20 via-black to-[#0e0e12] border border-[#c5a059]/60 text-left space-y-3.5 shadow-2xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Landmark size={20} className="text-[#c5a059]" />
                    <span className="text-white font-bold text-sm">Datos para Transferencia Bancaria</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-medium">
                    Banco General
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-black/85 border border-[#c5a059]/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#c5a059]">
                      Banco General · Panamá
                    </span>
                    <span className="text-[10px] text-stone-300">Cuenta Corriente</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-stone-900 border border-white/10">
                    <div>
                      <span className="text-[10px] text-stone-400 block font-light">Número de Cuenta:</span>
                      <span className="text-white font-mono text-lg sm:text-xl font-bold tracking-wider text-[#c5a059] block">
                        03-01-01-123456-7
                      </span>
                      <span className="text-[11px] text-stone-300 block font-light mt-0.5">
                        A nombre de: <strong>Pretty-Store Inc.</strong> · Total: <strong>${confirmedOrder.total.toFixed(2)} USD</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyBankDetails('03-01-01-123456-7')}
                      className="px-4 py-2.5 rounded-xl bg-[#c5a059]/25 hover:bg-[#c5a059]/35 border border-[#c5a059]/50 text-[#c5a059] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                      {copiedBank ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      <span>{copiedBank ? '¡Copiado!' : 'Copiar Cuenta'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-stone-300 font-light leading-relaxed pt-1">
                    * Transfiere los <strong>${confirmedOrder.total.toFixed(2)} USD</strong> y pulsa el botón verde abajo para enviar tu comprobante a nuestro WhatsApp oficial (<strong>6215-0251</strong>).
                  </p>
                </div>
              </div>
            )}

            {/* 3. SI ES TARJETA: BOTÓN IR A PAGAR EN PAGUELOFACIL */}
            {confirmedOrder.metodoPago === 'tarjeta' && (
              <div className="max-w-xl mx-auto p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#c5a059]/20 via-black to-[#0e0e12] border border-[#c5a059]/60 text-left space-y-3.5 shadow-2xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2 text-white font-medium text-xs">
                    <CreditCard size={18} className="text-[#c5a059]" />
                    <span>Pagar con Tarjeta (PagueloFacil)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">
                    Pasarela Segura
                  </span>
                </div>

                <a
                  href={config.link_pago_tarjeta || 'https://checkout.paguelofacil.com/gorras'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#d4af37] hover:from-[#d4af37] hover:to-[#c5a059] text-black font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-[#c5a059]/25 cursor-pointer text-center"
                >
                  <CreditCard size={18} />
                  <span>Ir a Pagar ${confirmedOrder.total.toFixed(2)} USD en PagueloFacil</span>
                  <ExternalLink size={16} />
                </a>

                <p className="text-[11px] text-stone-400 text-center font-light">
                  Se abrirá la pasarela de PagueloFacil en una pestaña segura para procesar tu tarjeta Visa, Mastercard o Clave.
                </p>
              </div>
            )}

            {/* BOTÓN WHATSAPP OFICIAL AL NÚMERO 6215-0251 */}
            <div className="max-w-xl mx-auto space-y-3 pt-2">
              <a
                href={generateOfficialReceiptWhatsAppUrl(
                  confirmedOrder.orderNumber || '',
                  confirmedOrder.orderId,
                  confirmedOrder.items || items,
                  confirmedOrder.subtotal,
                  confirmedOrder.shipping,
                  confirmedOrder.total,
                  confirmedOrder.metodoPago,
                  confirmedOrder.tipoEntrega || tipoEntrega,
                  confirmedOrder.courier || courier,
                  servientregaModalidad,
                  provincia,
                  direccion,
                  sucursalRetiro,
                  confirmedOrder.discount || 0,
                  confirmedOrder.promoTitle || ''
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-[#25D366]/20 cursor-pointer"
              >
                <MessageSquare size={20} className="fill-black" />
                <span>Enviar Recibo Oficial por WhatsApp (6215-0251)</span>
              </a>
              <p className="text-[11px] text-stone-400 font-light">
                Presiona el botón para abrir WhatsApp en el número oficial <strong>+507 6215-0251</strong> con tu recibo listo para adjuntar comprobante.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinish}
                className="px-8 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Volver a la Tienda
              </button>
            </div>
          </div>
        ) : (
          /* ================= MAIN CHECKOUT FORM ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
            {/* Left Column: Form Steps */}
            <div className="lg:col-span-7 p-5 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/10 space-y-6">
              <div>
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

                {/* ============================================================== */}
                {/* 1. PRIMERO: RETIRO EN SUCURSAL / LOCAL O ENVÍO POR COURIER */}
                {/* ============================================================== */}
                <div id="section-delivery-type" className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.16em] text-white font-medium block flex items-center gap-1.5">
                    <Truck size={13} className="text-[#c5a059]" />
                    <span>1. ¿Cómo deseas recibir tu compra? *</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Retiro en el Local (Tienda Física) */}
                    <button
                      type="button"
                      onClick={() => {
                        setTipoEntrega('retiro');
                        scrollToSection('section-customer-info');
                      }}
                      className={`p-3.5 border text-left cursor-pointer transition-all flex items-center gap-3 rounded-xl ${
                        tipoEntrega === 'retiro'
                          ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-2 ring-[#c5a059] shadow-lg shadow-[#c5a059]/15'
                          : 'border-white/10 bg-stone-900/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <Store size={22} className={tipoEntrega === 'retiro' ? 'text-[#c5a059]' : 'text-stone-400'} />
                      <div>
                        <p className="text-xs font-semibold text-white">Retirar en el Local</p>
                        <p className="text-[10px] text-stone-400 font-light">En tienda física · Gratis</p>
                      </div>
                    </button>

                    {/* Envío por Courier a Nivel Nacional */}
                    <button
                      type="button"
                      onClick={() => {
                        setTipoEntrega('delivery');
                        scrollToSection('section-courier-choice');
                      }}
                      className={`p-3.5 border text-left cursor-pointer transition-all flex items-center gap-3 rounded-xl ${
                        tipoEntrega === 'delivery'
                          ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-2 ring-[#c5a059] shadow-lg shadow-[#c5a059]/15'
                          : 'border-white/10 bg-stone-900/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <Truck size={22} className={tipoEntrega === 'delivery' ? 'text-[#c5a059]' : 'text-stone-400'} />
                      <div>
                        <p className="text-xs font-semibold text-white">Envío por Courier</p>
                        <p className="text-[10px] text-stone-400 font-light">A nivel nacional</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* SI ELIGE RETIRO EN EL LOCAL: MOSTRAR DETALLES */}
                {tipoEntrega === 'retiro' && (
                  <div className="p-4 rounded-xl bg-stone-900/60 border border-[#c5a059]/30 text-xs space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <Store size={16} className="text-[#c5a059]" />
                      <span>Retiro en Tienda Física Pretty-Store</span>
                    </div>
                    <p className="text-[11px] text-stone-300 font-light">
                      Sede oficial La Chorrera, Panamá Oeste (<a href="https://maps.app.goo.gl/PxA3suMXNZxuFF5X7" target="_blank" rel="noreferrer" className="text-[#c5a059] underline">Ver en Google Maps</a>).
                    </p>
                  </div>
                )}

                {/* ============================================================== */}
                {/* SI ELIGE ENVÍO POR COURIER: NUEVO ORDEN SOLICITADO */}
                {/* 2. POR DÓNDE DESEA RECIBIRLO: FERGUSON, UNO EXPRESS O SERVIENTREGA */}
                {/* ============================================================== */}
                {tipoEntrega === 'delivery' && (
                  <div className="space-y-5 p-4 sm:p-5 rounded-2xl bg-stone-900/40 border border-white/10 animate-in fade-in duration-200">
                    <div id="section-courier-choice" className="space-y-2">
                      <label className="text-[11px] uppercase tracking-[0.16em] text-white font-medium block flex items-center gap-1.5">
                        <Truck size={13} className="text-[#c5a059]" />
                        <span>2. ¿Por cuál empresa deseas recibirlo? *</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {/* Ferguson */}
                        <button
                          type="button"
                          onClick={() => {
                            setCourier('Ferguson');
                            const defaultSuc = COURIER_SUCURSALES[provincia]?.ferguson?.[0] || 'Agencia Principal';
                            setSucursalRetiro(defaultSuc);
                            scrollToSection('section-provincias-grid');
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            courier === 'Ferguson'
                              ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-2 ring-[#c5a059] shadow-md shadow-[#c5a059]/15'
                              : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">Ferguson</span>
                            {courier === 'Ferguson' && <span className="w-2 h-2 rounded-full bg-[#c5a059]" />}
                          </div>
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-white/5 text-stone-300 text-[9px]">
                            Retiro en sucursal
                          </span>
                          <span className="text-[10px] text-[#c5a059] block mt-1 font-mono font-medium">
                            $5.00 - $6.50
                          </span>
                        </button>

                        {/* Uno Express */}
                        <button
                          type="button"
                          onClick={() => {
                            setCourier('Uno Express');
                            const defaultSuc = COURIER_SUCURSALES[provincia]?.unoExpress?.[0] || 'Agencia Principal';
                            setSucursalRetiro(defaultSuc);
                            scrollToSection('section-provincias-grid');
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            courier === 'Uno Express'
                              ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-2 ring-[#c5a059] shadow-md shadow-[#c5a059]/15'
                              : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">Uno Express</span>
                            {courier === 'Uno Express' && <span className="w-2 h-2 rounded-full bg-[#c5a059]" />}
                          </div>
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-white/5 text-stone-300 text-[9px]">
                            Retiro en sucursal
                          </span>
                          <span className="text-[10px] text-[#c5a059] block mt-1 font-mono font-medium">
                            $6.50 - $7.50
                          </span>
                        </button>

                        {/* Servi Entrega */}
                        <button
                          type="button"
                          onClick={() => {
                            setCourier('Servientrega');
                            scrollToSection('section-servientrega-mode');
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            courier === 'Servientrega'
                              ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-2 ring-[#c5a059] shadow-md shadow-[#c5a059]/15'
                              : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">Servi Entrega</span>
                            {courier === 'Servientrega' && <span className="w-2 h-2 rounded-full bg-[#c5a059]" />}
                          </div>
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px]">
                            Sucursal o Domicilio
                          </span>
                          <span className="text-[10px] text-[#c5a059] block mt-1 font-mono font-medium">
                            Desde $3.86
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* ============================================================== */}
                    {/* 3. SI APRETA SERVIENTREGA: PRIMERO RETIRO EN SUCURSAL Y AL LADO ENVÍO A LA CASA */}
                    {/* ============================================================== */}
                    {courier === 'Servientrega' && (
                      <div id="section-servientrega-mode" className="p-4 rounded-xl bg-black/70 border border-[#c5a059]/40 space-y-3 shadow-lg animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-1 border-b border-white/[0.08]">
                          <label className="text-xs uppercase tracking-wider text-white font-medium flex items-center gap-1.5">
                            <Truck size={14} className="text-[#c5a059]" />
                            <span>Modalidad con Servi Entrega: *</span>
                          </label>
                          <span className="text-[10px] text-[#c5a059] font-mono font-semibold">
                            {servientregaModalidad === 'sucursal' ? 'Retiro en Sucursal' : 'Envío a la Casa'}
                          </span>
                        </div>

                        {/* AL LADO: RETIRO EN SUCURSAL Y ENVÍO A LA CASA */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Opción 1: Retiro en Sucursal */}
                          <button
                            type="button"
                            onClick={() => {
                              setServientregaModalidad('sucursal');
                              const defaultSuc = COURIER_SUCURSALES[provincia]?.servientrega?.[0] || 'Agencia Principal';
                              setSucursalRetiro(defaultSuc);
                              scrollToSection('section-provincias-grid');
                            }}
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

                          {/* Opción 2: Envío a la Casa */}
                          <button
                            type="button"
                            onClick={() => {
                              setServientregaModalidad('domicilio');
                              scrollToSection('section-provincias-grid');
                            }}
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
                                Entrega a Domicilio ($7.03)
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ============================================================== */}
                    {/* 4. PROVINCIAS DE PANAMÁ CON EL PRECIO DEL ENVÍO DEBAJO DE CADA UNA */}
                    {/* ============================================================== */}
                    <div id="section-provincias-grid" className="space-y-2.5 pt-2 border-t border-white/[0.08]">
                      <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5">
                        <label className="text-[11px] uppercase tracking-[0.16em] text-white font-medium flex items-center gap-1.5">
                          <MapPin size={13} className="text-[#c5a059]" />
                          <span>3. Elige tu Provincia de Entrega *</span>
                        </label>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {provincia}
                        </span>
                      </div>

                      {/* Grid de Provincias con el precio calculado para cada una */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PANAMA_PROVINCES.map((prov) => {
                          const isSelected = provincia === prov.id;
                          const isFar = prov.zone === 'lejos';

                          let priceForThisProv = 5.00;
                          if (courier === 'Ferguson') {
                            priceForThisProv = isFar ? 6.50 : 5.00;
                          } else if (courier === 'Uno Express') {
                            priceForThisProv = isFar ? 7.50 : 6.50;
                          } else if (courier === 'Servientrega') {
                            priceForThisProv = servientregaModalidad === 'sucursal' ? (isFar ? 5.00 : 3.86) : 7.03;
                          }

                          return (
                            <button
                              key={prov.id}
                              type="button"
                              onClick={() => {
                                setProvincia(prov.id);
                                const branches = COURIER_SUCURSALES[prov.id];
                                const defaultBranch =
                                  courier === 'Ferguson'
                                    ? branches?.ferguson?.[0]
                                    : courier === 'Uno Express'
                                    ? branches?.unoExpress?.[0]
                                    : branches?.servientrega?.[0];
                                if (defaultBranch) setSucursalRetiro(defaultBranch);
                                scrollToSection('section-sucursal-choice');
                              }}
                              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between min-h-[68px] ${
                                isSelected
                                  ? 'border-[#c5a059] bg-[#c5a059]/20 text-white ring-2 ring-[#c5a059] shadow-md shadow-[#c5a059]/15'
                                  : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/25 hover:text-stone-200 hover:bg-stone-800/60'
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

                              {/* PRECIO DEL ENVÍO HASTA AHÍ */}
                              <div className="mt-1 pt-1 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                                <span className="text-stone-400 text-[9px]">Tarifa:</span>
                                <span className="text-[#c5a059] font-bold">
                                  ${priceForThisProv.toFixed(2)}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ============================================================== */}
                    {/* 5. LUEGO DE AGARRAR LA PROVINCIA: ABAJO LE APARECE LA SUCURSAL */}
                    {/* ============================================================== */}
                    <div id="section-sucursal-choice" className="space-y-3 pt-2 border-t border-white/[0.08]">
                      {courier === 'Servientrega' && servientregaModalidad === 'domicilio' ? (
                        /* Si es a la casa: ingresar dirección exacta */
                        <div className="space-y-1.5 p-3.5 rounded-xl bg-stone-900/60 border border-white/10">
                          <label className="text-[11px] uppercase tracking-[0.16em] text-white font-medium block flex items-center gap-1.5">
                            <Home size={13} className="text-[#c5a059]" />
                            <span>Dirección exacta para el Envío a tu Casa en {provincia} *</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Barriada, calle, número de casa/apto o punto de referencia"
                            value={direccion}
                            onChange={(e) => setDireccion(e.target.value)}
                            onBlur={() => {
                              if (direccion.trim().length > 3) {
                                scrollToSection('section-customer-info');
                              }
                            }}
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
                        /* Si es Ferguson, Uno Express o Servientrega Sucursal: mostrar sucursales de la provincia */
                        <div className="space-y-3 p-3.5 rounded-xl bg-stone-900/60 border border-white/10">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] uppercase tracking-[0.16em] text-white font-medium block flex items-center gap-1.5">
                              <Store size={13} className="text-[#c5a059]" />
                              <span>Sucursal de {courier} para Retiro en {provincia} *</span>
                            </label>
                            <span className="text-[10px] text-[#c5a059] font-mono font-medium">
                              {provincia}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] text-stone-400 font-light block">
                              Toca una sucursal para seleccionarla rápidamente:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {currentBranchList.map((suc) => {
                                const isSelected = sucursalRetiro === suc;
                                return (
                                  <button
                                    key={suc}
                                    type="button"
                                    onClick={() => {
                                      setSucursalRetiro(suc);
                                      scrollToSection('section-customer-info');
                                    }}
                                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                                      isSelected
                                        ? 'border-[#c5a059] bg-[#c5a059]/25 text-white ring-1 ring-[#c5a059] shadow-sm'
                                        : 'border-white/10 bg-black/50 text-stone-300 hover:border-white/20 hover:text-white'
                                    }`}
                                  >
                                    <Store size={12} className={isSelected ? 'text-[#c5a059]' : 'text-stone-500'} />
                                    <span>{suc}</span>
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059] ml-1" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] text-stone-400 font-light block">
                              O especifica otra agencia:
                            </span>
                            <input
                              type="text"
                              placeholder={`Ej. Sucursal ${courier} ${provincia}...`}
                              value={sucursalRetiro}
                              onChange={(e) => setSucursalRetiro(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059] transition-colors rounded-lg"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* 3. CAMPOS DE CONTACTO (NOMBRE Y TELÉFONO) */}
                {/* ============================================================== */}
                <div id="section-customer-info" className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-white/[0.08]">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-white font-medium flex items-center gap-1.5">
                      <User size={13} className="text-[#c5a059]" />
                      <span>Datos de Contacto del Cliente</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-light">
                      Para coordinar tu entrega
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-[0.16em] text-stone-300 font-light block">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Roberto Cedeño"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className={`w-full px-3.5 py-2.5 bg-stone-900/60 border text-xs text-white placeholder-stone-600 focus:outline-none transition-colors rounded-xl ${
                          formErrors.nombre ? 'border-rose-500' : 'border-white/10 focus:border-[#c5a059]'
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
                        onChange={(e) => {
                          setTelefono(e.target.value);
                          if (e.target.value.replace(/\D/g, '').length >= 8) {
                            scrollToSection('section-payment-method');
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 bg-stone-900/60 border text-xs text-white placeholder-stone-600 focus:outline-none transition-colors rounded-xl ${
                          formErrors.telefono ? 'border-rose-500' : 'border-white/10 focus:border-[#c5a059]'
                        }`}
                      />
                      {formErrors.telefono && (
                        <p className="text-[10px] text-rose-400">{formErrors.telefono}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.16em] text-stone-400 font-light block">
                      Notas Especiales / Observaciones (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Horario de entrega o indicaciones adicionales..."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-900/60 border border-white/10 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059] transition-colors resize-none rounded-xl"
                    />
                  </div>
                </div>

                {/* ============================================================== */}
                {/* 4. MÉTODO DE PAGO (YAPPY, TRANSFERENCIA, TARJETA) */}
                {/* ============================================================== */}
                <div id="section-payment-method" className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] uppercase tracking-[0.16em] text-white font-medium block">
                      Método de Pago *
                    </label>
                    <span className="text-[10px] text-[#c5a059] font-mono">
                      Pagos 100% Digitales
                    </span>
                  </div>

                  {/* Selector de Métodos de Pago */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Yappy */}
                    <button
                      type="button"
                      onClick={() => {
                        setMetodoPago('yappy');
                        scrollToSection('section-confirm-order');
                      }}
                      className={`p-3 border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 rounded-xl ${
                        metodoPago === 'yappy'
                          ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-1 ring-[#c5a059]'
                          : 'border-white/10 bg-stone-900/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <Smartphone size={18} className={metodoPago === 'yappy' ? 'text-[#c5a059]' : 'text-stone-400'} />
                      <span className="text-xs font-semibold">Yappy</span>
                    </button>

                    {/* Transferencia */}
                    <button
                      type="button"
                      onClick={() => {
                        setMetodoPago('transferencia');
                        scrollToSection('section-confirm-order');
                      }}
                      className={`p-3 border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 rounded-xl ${
                        metodoPago === 'transferencia'
                          ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-1 ring-[#c5a059]'
                          : 'border-white/10 bg-stone-900/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <Landmark size={18} className={metodoPago === 'transferencia' ? 'text-[#c5a059]' : 'text-stone-400'} />
                      <span className="text-xs font-semibold">Transferencia</span>
                    </button>

                    {/* Tarjeta */}
                    <button
                      type="button"
                      onClick={() => {
                        setMetodoPago('tarjeta');
                        scrollToSection('section-confirm-order');
                      }}
                      className={`p-3 border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 rounded-xl ${
                        metodoPago === 'tarjeta'
                          ? 'border-[#c5a059] bg-[#c5a059]/15 text-white ring-1 ring-[#c5a059]'
                          : 'border-white/10 bg-stone-900/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <CreditCard size={18} className={metodoPago === 'tarjeta' ? 'text-[#c5a059]' : 'text-stone-400'} />
                      <span className="text-xs font-semibold">Tarjeta</span>
                    </button>
                  </div>

                  {/* DETALLE 1: YAPPY (INDICACIÓN PREVIA A CONFIRMAR) */}
                  {metodoPago === 'yappy' && (
                    <div className="p-4 rounded-xl bg-stone-900/60 border border-[#c5a059]/40 space-y-2 text-xs animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Smartphone size={16} className="text-[#c5a059]" />
                          <span className="text-white font-medium text-xs">Pago vía Yappy</span>
                        </div>
                        <span className="text-[#c5a059] font-mono text-[11px] font-semibold">
                          ${finalTotal.toFixed(2)} USD
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 font-light leading-relaxed">
                        Al presionar <strong className="text-white">"Confirmar Pedido"</strong> abajo, se generará tu <strong>Recibo Oficial de Compra</strong> y en la siguiente pantalla aparecerá el número de Yappy (<strong>6402-8245</strong>) con el botón para copiarlo en 1 clic y el botón de WhatsApp (<strong>6215-0251</strong>) para enviar tu comprobante.
                      </p>
                    </div>
                  )}

                  {/* DETALLE 2: TRANSFERENCIA BANCARIA (INDICACIÓN PREVIA A CONFIRMAR) */}
                  {metodoPago === 'transferencia' && (
                    <div className="p-4 rounded-xl bg-stone-900/60 border border-[#c5a059]/40 space-y-2 text-xs animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Landmark size={16} className="text-[#c5a059]" />
                          <span className="text-white font-medium text-xs">Transferencia Bancaria · Banco General</span>
                        </div>
                        <span className="text-[#c5a059] font-mono text-[11px] font-semibold">
                          ${finalTotal.toFixed(2)} USD
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 font-light leading-relaxed">
                        Al presionar <strong className="text-white">"Confirmar Pedido"</strong> abajo, se generará tu <strong>Recibo Oficial de Compra</strong> y en la siguiente pantalla aparecerá el número de cuenta de Banco General con el botón para copiarlo en 1 clic y el botón de WhatsApp (<strong>6215-0251</strong>) para enviar tu comprobante.
                      </p>
                    </div>
                  )}

                  {/* DETALLE 3: TARJETA (INDICACIÓN PREVIA A CONFIRMAR) */}
                  {metodoPago === 'tarjeta' && (
                    <div className="p-4 rounded-xl bg-stone-900/60 border border-[#c5a059]/40 space-y-2 text-xs animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                        <div className="flex items-center gap-2 text-white font-medium text-xs">
                          <CreditCard size={16} className="text-[#c5a059]" />
                          <span>Pago con Tarjeta (PagueloFacil)</span>
                        </div>
                        <span className="text-[#c5a059] font-mono text-[11px] font-semibold">
                          ${finalTotal.toFixed(2)} USD
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 font-light leading-relaxed">
                        Al presionar <strong className="text-white">"Confirmar Pedido"</strong> abajo, se generará tu <strong>Recibo Oficial de Compra</strong> y te aparecerá el enlace directo a la pasarela segura de PagueloFacil para pagar tus <strong className="text-[#c5a059] font-mono">${finalTotal.toFixed(2)} USD</strong> con Visa, Mastercard o Clave.
                      </p>
                    </div>
                  )}
                </div>

                {/* ============================================================== */}
                {/* AVISO IMPORTANTE DE 48 HORAS CONDICIONAL ANTES DE CONFIRMAR */}
                {/* ============================================================== */}
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 text-left">
                  <Clock size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong className="text-amber-300 font-semibold block text-[11px] uppercase tracking-wider">
                      Plazo de 48 Horas
                    </strong>
                    <p className="text-[11px] text-stone-200 font-light leading-relaxed">
                      {tipoEntrega === 'retiro'
                        ? 'Dispones de un plazo máximo de 48 horas para retirar tu entrega en la tienda con tu comprobante.'
                        : 'Dispones de un plazo máximo de 48 horas para coordinar tu entrega con tu comprobante de pago.'}
                    </p>
                  </div>
                </div>

                {/* Aceptación Legal */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 rounded border-stone-700 bg-stone-900 text-[#c5a059] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-[11px] text-stone-400 leading-relaxed font-light">
                      He leído y acepto los{' '}
                      <span className="text-[#c5a059] underline">Términos y Condiciones</span> y la{' '}
                      <span className="text-[#c5a059] underline">Política de Privacidad</span> de Pretty-Store.
                    </span>
                  </label>
                  {formErrors.terms && (
                    <p className="text-[10px] text-rose-400">{formErrors.terms}</p>
                  )}
                </div>

                {/* BOTÓN CONFIRMAR PEDIDO */}
                <div id="section-confirm-order" className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xl shadow-[#c5a059]/20"
                  >
                    {isSubmitting ? (
                      <span>Generando Recibo Oficial...</span>
                    ) : (
                      <>
                        <span>Confirmar Pedido · ${finalTotal.toFixed(2)} USD</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-stone-400 text-center font-light mt-2">
                    Al confirmar, verás tu <strong>Recibo Oficial de Compra</strong> y podrás enviarlo con 1 clic al WhatsApp oficial <strong>6215-0251</strong>.
                  </p>
                </div>
              </form>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 p-5 sm:p-8 bg-black/40 space-y-5">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#c5a059] font-medium block">
                Resumen de la Orden
              </span>

              {/* Items List */}
              <div className="divide-y divide-white/5 max-h-64 overflow-y-auto pr-1">
                {items.map((it) => (
                  <div key={it.product.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={it.product.imagen_url || '/images/products/gorra-1.webp'}
                        alt={it.product.nombre}
                        className="w-10 h-10 object-cover rounded-lg border border-white/10 shrink-0 bg-stone-900"
                      />
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate text-xs">{it.product.nombre}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10px] text-stone-400 font-mono">
                            {it.quantity} × ${it.product.precio.toFixed(2)}
                          </p>
                          {isLegendaryCap(it.product, it.product?.categoria?.nombre) && (
                            <span className="text-[8px] text-amber-300 font-semibold px-1 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                              Promo 2x $55
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-white text-xs font-semibold shrink-0">
                      ${(it.quantity * it.product.precio).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2 pt-3 border-t border-white/10 text-xs">
                <div className="flex justify-between text-stone-400 font-light">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Tag size={12} className="shrink-0" />
                      <span>{promo.promoTitle}</span>
                    </span>
                    <span className="font-mono font-semibold">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-400 font-light">
                  <span>Envío ({tipoEntrega === 'retiro' ? 'Retiro en Local' : `${courier} · ${provincia}`})</span>
                  <span className="font-mono text-white">
                    {shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : 'Gratis ($0.00)'}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm">
                  <span className="font-bold text-white uppercase tracking-wider text-xs">Total a Pagar:</span>
                  <span className="text-xl font-mono font-bold text-[#c5a059]">
                    ${finalTotal.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Resumen de Modalidad de Entrega */}
              <div className="p-3.5 rounded-xl bg-stone-900/60 border border-white/10 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-stone-300 font-medium">
                  <Truck size={14} className="text-[#c5a059]" />
                  <span>Entrega Seleccionada:</span>
                </div>
                <p className="text-[11px] text-white font-semibold">
                  {tipoEntrega === 'retiro'
                    ? 'Retiro en Tienda Física (La Chorrera)'
                    : `Envío con ${courier} a ${provincia}`}
                </p>
                {tipoEntrega === 'delivery' && (
                  <p className="text-[10px] text-stone-400 font-light">
                    {courier === 'Servientrega' && servientregaModalidad === 'domicilio'
                      ? 'Entrega a domicilio hasta tu casa'
                      : `Sucursal: ${sucursalRetiro || 'Agencia Principal'}`}
                  </p>
                )}
              </div>

              {/* Garantías y Seguridad */}
              <div className="space-y-1.5 pt-2 text-[10px] text-stone-400 font-light">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck size={13} />
                  <span>Atención directa y personalizada por WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock size={13} className="text-[#c5a059]" />
                  <span>Pagos verificados y recibo oficial inmediato</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
