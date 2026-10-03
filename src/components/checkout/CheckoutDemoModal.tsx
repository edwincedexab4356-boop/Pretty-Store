import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  CreditCard,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Truck,
  Store,
  Home,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Landmark,
  Copy,
  Check,
  Clock,
  UploadCloud,
  Trash2,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { MetodoPago, TipoEntrega, CourierOption } from '../../types/database';
import { createRealOrder, CreatedOrderResult } from '../../services/checkoutService';
import { getSupabaseClient } from '../../lib/supabase';

// NÚMEROS Y CUENTAS OFICIALES SUMINISTRADAS POR EL CLIENTE:
export const YAPPY_PAY_PHONE = '6215-0251';
export const WHATSAPP_ORDERS_PHONE = '50762150251';
export const TITULAR_CUENTAS = 'JESUS ALEJANDRO CARDONA ESCOBAR';
export const BANCO_GENERAL_CUENTA = '0472985946850';
export const PAGUELOFACIL_LINK = 'https://checkout.paguelofacil.com/W_F9464GL';

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
  tag: string;
}[] = [
  { id: 'Panamá Oeste', name: 'Panamá Oeste', tag: 'La Chorrera · Arraiján' },
  { id: 'Panamá Capital', name: 'Panamá Capital', tag: 'Ciudad de Panamá' },
  { id: 'Colón', name: 'Colón', tag: 'Costa Atlántica' },
  { id: 'Coclé', name: 'Coclé', tag: 'Penonomé · Aguadulce' },
  { id: 'Herrera', name: 'Herrera', tag: 'Chitré · Pesé' },
  { id: 'Los Santos', name: 'Los Santos', tag: 'Las Tablas · Pedasí' },
  { id: 'Veraguas', name: 'Veraguas', tag: 'Santiago · Soná' },
  { id: 'Chiriquí', name: 'Chiriquí', tag: 'David · Boquete · Bugaba' },
  { id: 'Bocas del Toro', name: 'Bocas del Toro', tag: 'Changuinola · Isla Colón' },
  { id: 'Darién', name: 'Darién', tag: 'Metetí · Chepo' },
  { id: 'Comarcas', name: 'Comarcas', tag: 'Guna Yala · Ngäbe-Buglé' },
];

export interface BranchWithRate {
  branch: string;
  approxRate: string;
}

// 1. SERVIENTREGA (#1) - Tarifas aproximadas oficiales
export const SERVIENTREGA_SUCURSALES: Record<PanamaProvince, BranchWithRate[]> = {
  'Panamá Oeste': [
    { branch: 'AV Box to Box Costa Verde', approxRate: '$3.25 - $5.61' },
    { branch: 'AV Paquetexpress PTY Coronado', approxRate: '$3.25 - $4.61' },
    { branch: 'AV Ptybuy Express Arraiján', approxRate: '$3.25 - $4.61' },
    { branch: 'La Chorrera (Av. de las Américas)', approxRate: '$3.25 - $5.61' },
  ],
  'Panamá Capital': [
    { branch: 'Dirección General - Parque Lefevre', approxRate: '$3.86 - $5.79' },
    { branch: 'Vía España - Plaza Concordia', approxRate: '$3.86 - $5.79' },
    { branch: 'El Dorado (Plaza Golden)', approxRate: '$3.86 - $5.79' },
    { branch: 'Paitilla', approxRate: '$3.86 - $5.79' },
    { branch: 'Las Mañanitas', approxRate: '$3.86 - $5.79' },
    { branch: 'Los Andes Mall', approxRate: '$3.86 - $5.79' },
    { branch: 'AV TSB Cargo San Francisco', approxRate: '$3.86 - $5.79' },
    { branch: 'AV Cargo Box Express Hato Pintado', approxRate: '$3.86 - $5.79' },
    { branch: 'AV Mr. Mail Vía Argentina', approxRate: '$3.86 - $5.79' },
    { branch: 'AV Shop Box DB Don Bosco', approxRate: '$3.86 - $5.79' },
    { branch: 'AV Costa del Este Tu Carga Express', approxRate: '$3.86 - $5.79' },
    { branch: 'AV Vía Israel Tu Carga Express', approxRate: '$3.86 - $5.79' },
    { branch: 'AV Box to Box Marbella', approxRate: '$3.86 - $5.79' },
    { branch: 'AV Box to Box Villa Zaita', approxRate: '$3.86 - $5.79' },
  ],
  'Chiriquí': [
    { branch: 'David El Rocío / David Calle 4ta', approxRate: '$5.79' },
    { branch: 'AV Concepción Bugaba Shop Express', approxRate: '$3.86 - $5.79' },
    { branch: 'AV Barú Servicios y Utilería', approxRate: '$3.86 - $5.79' },
    { branch: 'AV Puerto Armuelles - Rapid Services', approxRate: '$3.86 - $5.79' },
    { branch: 'AV Río Sereno - Farmacia Don Andrés', approxRate: '$6.00 - $10.60' },
    { branch: 'AV Volcán - Alfa Cell Technologic', approxRate: '$6.00 - $10.60' },
    { branch: 'AV Chiriquí - Tolé Monchis', approxRate: '$6.00 - $10.60' },
    { branch: 'AV E-Box Express Paso Canoas', approxRate: '$3.86 - $5.79' },
    { branch: 'AV Box to Box Doleguita', approxRate: '$3.86 - $5.79' },
  ],
  'Coclé': [
    { branch: 'AV El Valle de Antón - El Valle Express', approxRate: '$3.25 - $4.61' },
    { branch: 'Penonomé', approxRate: '$3.86 - $5.79' },
    { branch: 'Aguadulce', approxRate: '$3.86 - $5.79' },
  ],
  'Herrera': [
    { branch: 'Chitré (Av. Herrera)', approxRate: '$3.86 - $5.79' },
    { branch: 'Chitré (Plaza Azuero)', approxRate: '$3.86 - $5.79' },
  ],
  'Los Santos': [
    { branch: 'AV Guararé - Malala', approxRate: '$3.86 - $5.79' },
    { branch: 'AV Tonosí - Hostal Victoria', approxRate: '$3.86 - $5.79' },
    { branch: 'Las Tablas', approxRate: '$3.86 - $5.79' },
  ],
  'Veraguas': [
    { branch: 'Santiago (Av. Central)', approxRate: '$3.86 - $5.79' },
    { branch: 'Santiago (Terminal de Transporte)', approxRate: '$3.86 - $5.79' },
  ],
  'Colón': [
    { branch: 'Colón (Calle 13 y Bolívar)', approxRate: '$3.86 - $5.79' },
    { branch: 'Cuatro Altos (Plaza Millenium)', approxRate: '$3.86 - $5.79' },
  ],
  'Bocas del Toro': [
    { branch: 'Changuinola (Av. 17 de Abril)', approxRate: '$11.35 - $15.95' },
    { branch: 'AV Bocas Island Express (Isla Colón)', approxRate: '$11.35 - $15.95' },
    { branch: 'AV Chiriquí Grande - Multiservicios', approxRate: '$11.35 - $15.95' },
    { branch: 'AV Almirante Soluciones y Más', approxRate: '$11.35 - $15.95' },
  ],
  'Darién': [
    { branch: 'AV Metetí Darién - Valeria\'s Boutique', approxRate: '$6.00 - $10.60' },
  ],
  'Comarcas': [
    { branch: 'Agencia Principal / Más cercana', approxRate: '$6.00 - $10.60' },
  ],
};

// 2. FERGUSON (#2) - Tarifas aproximadas oficiales
export const FERGUSON_SUCURSALES: Record<PanamaProvince, BranchWithRate[]> = {
  'Chiriquí': [
    { branch: 'David – Edificio Garrido', approxRate: '$5.00' },
    { branch: 'David – Plaza Salamanca', approxRate: '$5.00' },
    { branch: 'Puerto Armuelles', approxRate: '$6.00' },
    { branch: 'Concepción – Bugaba', approxRate: '$6.00' },
    { branch: 'Volcán', approxRate: '$6.00' },
    { branch: 'Boquete', approxRate: '$6.00' },
  ],
  'Panamá Capital': [
    { branch: 'Vista Hermosa', approxRate: '$5.00' },
    { branch: 'San Pedro', approxRate: '$5.00' },
    { branch: '24 de Diciembre', approxRate: '$5.00' },
    { branch: 'Justo Arosemena', approxRate: '$5.00' },
    { branch: 'Calle 50', approxRate: '$5.00' },
  ],
  'Panamá Oeste': [
    { branch: 'La Chorrera (Parque Feuillet)', approxRate: '$5.00' },
    { branch: 'Vista Alegre', approxRate: '$5.00' },
    { branch: 'Arraiján Cabecera', approxRate: '$5.00' },
  ],
  'Coclé': [
    { branch: 'Penonomé (Central)', approxRate: '$5.00' },
    { branch: 'Aguadulce (Vía Interamericana)', approxRate: '$5.00' },
  ],
  'Herrera': [
    { branch: 'Chitré (Paseo Enrique Geenzier)', approxRate: '$5.00' },
    { branch: 'Chitré (Terminal)', approxRate: '$5.00' },
  ],
  'Los Santos': [
    { branch: 'Las Tablas (Parque Porras)', approxRate: '$6.00' },
    { branch: 'Las Tablas (Terminal)', approxRate: '$6.00' },
  ],
  'Veraguas': [
    { branch: 'Santiago (Terminal)', approxRate: '$5.00' },
    { branch: 'Soná', approxRate: '$5.00' },
  ],
  'Colón': [
    { branch: 'Colón Centro', approxRate: '$5.50' },
    { branch: 'Colón – Sabanitas', approxRate: '$5.50' },
  ],
  'Bocas del Toro': [
    { branch: 'Changuinola (Frente al Parque)', approxRate: '$8.50' },
  ],
  'Darién': [
    { branch: 'Darién – Metetí', approxRate: '$8.50' },
    { branch: 'Chepo – paso por la vía', approxRate: '$8.50' },
  ],
  'Comarcas': [
    { branch: 'Agencia Principal / Más cercana', approxRate: '$8.50' },
  ],
};

// 3. UNO EXPRESS (#3) - Tarifas aproximadas oficiales
export const UNO_EXPRESS_SUCURSALES: Record<PanamaProvince, BranchWithRate[]> = {
  'Panamá Capital': [
    { branch: 'Marbella', approxRate: '$6.50' },
    { branch: 'Tumba Muerto', approxRate: '$6.50' },
    { branch: 'Albrook', approxRate: '$6.50' },
    { branch: 'Costa del Este', approxRate: '$6.50' },
    { branch: 'Obarrio', approxRate: '$6.50' },
    { branch: 'Plaza Tocumen', approxRate: '$6.50' },
    { branch: 'Vía Brasil', approxRate: '$6.50' },
    { branch: 'San Francisco', approxRate: '$6.50' },
    { branch: 'Justo Arosemena', approxRate: '$6.50' },
    { branch: 'Vista Hermosa', approxRate: '$6.50' },
    { branch: '24 de Diciembre', approxRate: '$6.50' },
    { branch: 'Río Abajo', approxRate: '$6.50' },
    { branch: 'Juan Díaz', approxRate: '$6.50' },
    { branch: 'Villa Lucre', approxRate: '$6.50' },
    { branch: 'Brisas del Golf', approxRate: '$6.50' },
    { branch: 'Los Andes', approxRate: '$6.50' },
    { branch: 'Villa Zaita', approxRate: '$6.50' },
    { branch: 'El Dorado', approxRate: '$6.50' },
  ],
  'Panamá Oeste': [
    { branch: 'Gorgona', approxRate: '$6.50' },
    { branch: 'Paseo Arraiján', approxRate: '$6.50' },
    { branch: 'Vista Alegre', approxRate: '$6.50' },
    { branch: 'La Chorrera (Plaza Italia)', approxRate: '$6.50' },
    { branch: 'Westland Mall', approxRate: '$6.50' },
  ],
  'Coclé': [
    { branch: 'El Valle de Antón', approxRate: '$7.50' },
    { branch: 'Penonomé (Plaza Boulevard)', approxRate: '$6.50' },
    { branch: 'Aguadulce (Centro)', approxRate: '$6.50' },
  ],
  'Veraguas': [
    { branch: 'Santiago (Plaza Boulevard)', approxRate: '$6.50' },
    { branch: 'Soná', approxRate: '$6.50' },
  ],
  'Herrera': [
    { branch: 'Chitré (Plaza Moderna)', approxRate: '$6.50' },
    { branch: 'Chitré (Terminal)', approxRate: '$6.50' },
  ],
  'Los Santos': [
    { branch: 'Las Tablas (Centro)', approxRate: '$6.50' },
    { branch: 'Pedasí', approxRate: '$7.50' },
  ],
  'Chiriquí': [
    { branch: 'David Obaldía', approxRate: '$6.50' },
    { branch: 'David San Mateo', approxRate: '$6.50' },
    { branch: 'David Terronal', approxRate: '$6.50' },
    { branch: 'Bugaba', approxRate: '$6.50' },
    { branch: 'Volcán', approxRate: '$7.50' },
  ],
  'Colón': [
    { branch: 'Colón (Plaza Millenium)', approxRate: '$6.50' },
    { branch: 'Sabanitas', approxRate: '$6.50' },
  ],
  'Bocas del Toro': [
    { branch: 'Changuinola (Centro)', approxRate: '$10.50' },
    { branch: 'Isla Colón', approxRate: '$10.50' },
  ],
  'Darién': [
    { branch: 'Metetí', approxRate: '$9.50' },
    { branch: 'Chepo', approxRate: '$9.50' },
  ],
  'Comarcas': [
    { branch: 'Agencia Principal / Más cercana', approxRate: '$9.50' },
  ],
};

type CheckoutStep = 'form' | 'payment' | 'receipt';

export const CheckoutDemoModal: React.FC = () => {
  const {
    items,
    subtotal,
    discount,
    promo,
    clearCart,
    isCheckoutOpen,
    setIsCheckoutOpen,
  } = useCart();

  // Pasos: 'form' -> 'payment' (con número de pedido) -> 'receipt' (con WhatsApp)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('form');

  // 1. Modalidad de Entrega
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('delivery');

  // 2. Courier
  const [courier, setCourier] = useState<CourierOption>('Servientrega');
  const [servientregaModalidad, setServientregaModalidad] = useState<'sucursal' | 'domicilio'>('sucursal');

  // 3. Ubicación
  const [provincia, setProvincia] = useState<PanamaProvince>('Panamá Oeste');
  const [sucursalRetiro, setSucursalRetiro] = useState('La Chorrera (Av. de las Américas)');
  const [direccion, setDireccion] = useState('');

  // 4. Datos del Cliente
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');

  // 5. Método de Pago (Yappy de primero)
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('yappy');
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedYappy, setCopiedYappy] = useState(false);

  // 6. Voucher / Captura de Pago
  const [voucherImage, setVoucherImage] = useState<string | null>(null);
  const [voucherFileName, setVoucherFileName] = useState<string | null>(null);
  const [isVoucherAttached, setIsVoucherAttached] = useState(false);
  const voucherInputRef = useRef<HTMLInputElement | null>(null);

  // Pedido Confirmado
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<CreatedOrderResult | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Total sin sumar envío en la web (el envío es aproximado a pagar o coordinar)
  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  // Lista de sucursales según courier y provincia
  const currentBranchOptions = useMemo<BranchWithRate[]>(() => {
    if (courier === 'Servientrega') return SERVIENTREGA_SUCURSALES[provincia] || [];
    if (courier === 'Ferguson') return FERGUSON_SUCURSALES[provincia] || [];
    if (courier === 'Uno Express') return UNO_EXPRESS_SUCURSALES[provincia] || [];
    return [];
  }, [courier, provincia]);

  // Tarifa aproximada actual según la sucursal seleccionada
  const selectedBranchRate = useMemo(() => {
    const found = currentBranchOptions.find((b) => b.branch === sucursalRetiro);
    return found ? found.approxRate : (currentBranchOptions[0]?.approxRate || '$5.00 aprox.');
  }, [currentBranchOptions, sucursalRetiro]);

  if (!isCheckoutOpen) return null;

  const handleVoucherFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      alert('La imagen no debe superar los 12MB.');
      return;
    }

    setVoucherFileName(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setVoucherImage(dataUrl);
      setIsVoucherAttached(true);

      // Si el pedido ya existe en Supabase, registrar actualización
      if (confirmedOrder?.orderId) {
        try {
          const supabase = getSupabaseClient();
          await supabase
            .from('pedidos')
            .update({ comprobante_pago: `Captura adjuntada (${file.name})` } as any)
            .eq('id', confirmedOrder.orderId);
        } catch (err) {
          console.warn('Sync voucher status:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveVoucher = () => {
    setVoucherImage(null);
    setVoucherFileName(null);
    setIsVoucherAttached(false);
    if (voucherInputRef.current) voucherInputRef.current.value = '';
  };

  const copyBankDetails = (accountNum: string) => {
    navigator.clipboard.writeText(accountNum);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const copyYappyNumber = (phone: string) => {
    const cleanNumber = phone.replace(/\D/g, '');
    navigator.clipboard.writeText(cleanNumber || phone);
    setCopiedYappy(true);
    setTimeout(() => setCopiedYappy(false), 2500);
  };

  // PASO 1 -> PASO 2: "Confirmar Pedido"
  // Proceso Ultra Rápido sin esperas: genera número y pasa a la pantalla de inmediato
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!nombre.trim()) errors.nombre = 'El nombre completo es requerido';
    if (!telefono.trim()) errors.telefono = 'El teléfono o WhatsApp es requerido';

    if (tipoEntrega === 'delivery') {
      if (courier === 'Servientrega' && servientregaModalidad === 'domicilio') {
        if (!direccion.trim()) {
          errors.direccion = 'Ingresa la dirección para la entrega';
        }
      } else {
        if (!sucursalRetiro.trim()) {
          const def = currentBranchOptions[0]?.branch || `Agencia Principal (${provincia})`;
          setSucursalRetiro(def);
        }
      }
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmissionError(null);
    setIsSubmitting(true);

    const branchClean = sucursalRetiro.trim() || currentBranchOptions[0]?.branch || `Agencia Principal (${provincia})`;
    const resolvedAddress =
      tipoEntrega === 'retiro'
        ? 'Retiro en el Local / Tienda física (Pretty-Store)'
        : (courier === 'Servientrega' && servientregaModalidad === 'domicilio')
          ? (direccion.trim() || `Entrega a Domicilio (${provincia})`)
          : `Sucursal ${courier}: ${branchClean} (${provincia})`;

    // Generar número de pedido legible de inmediato
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const instantOrderNumber = `PED-${randomSuffix}`;

    const instantSummary: CreatedOrderResult = {
      orderId: instantOrderNumber,
      orderNumber: instantOrderNumber,
      date: new Date().toLocaleDateString('es-PA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      nombre: nombre.trim(),
      email: `${telefono.replace(/\D/g, '')}@prettystore.com`,
      telefono: telefono.trim(),
      direccion: resolvedAddress,
      metodoPago,
      tipoEntrega,
      courier: tipoEntrega === 'delivery' ? courier : undefined,
      subtotal,
      discount,
      promoTitle: promo.promoTitle,
      shipping: 0,
      total: finalTotal,
      itemCount: items.reduce((acc, i) => acc + i.quantity, 0),
      items: [...items],
      notas: notas.trim() || undefined,
    };

    // 1. Mostrar de inmediato la vista del Número de Pedido y Continuar con el Pedido (CERO ESPERA)
    setConfirmedOrder(instantSummary);
    clearCart();
    setCheckoutStep('payment');
    setIsSubmitting(false);

    // 2. Guardar en Supabase en segundo plano sin bloquear al cliente
    createRealOrder({
      items,
      subtotal,
      discount,
      promoTitle: promo.promoTitle,
      shipping: 0,
      total: finalTotal,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      direccion: resolvedAddress,
      metodoPago,
      tipoEntrega,
      courier: tipoEntrega === 'delivery' ? courier : undefined,
      notas: notas.trim() || undefined,
    }).then((realOrder) => {
      if (realOrder) {
        setConfirmedOrder((prev) => (prev ? { ...prev, orderId: realOrder.orderId } : realOrder));
      }
    }).catch((err) => {
      console.warn('Persistencia de pedido en segundo plano:', err);
    });
  };

  // PASO 2 -> PASO 3: "Confirmar Pedido" después de subir comprobante
  const handleFinalOrderConfirmation = async () => {
    if (confirmedOrder?.orderId && voucherFileName) {
      try {
        const supabase = getSupabaseClient();
        await supabase
          .from('pedidos')
          .update({ comprobante_pago: `Captura adjuntada: ${voucherFileName}` } as any)
          .eq('id', confirmedOrder.orderId);
      } catch (e) {
        console.warn('Sync voucher status:', e);
      }
    }
    // Pasar a la pantalla del Recibo Oficial y Envío por WhatsApp
    setCheckoutStep('receipt');
  };

  // Generador del Recibo Oficial para WhatsApp
  const generateWhatsAppUrl = () => {
    const orderNum = confirmedOrder?.orderNumber || '#PEDIDO';
    const paymentLabel =
      metodoPago === 'yappy'
        ? 'Yappy (6215-0251)'
        : metodoPago === 'transferencia'
        ? 'Transferencia Bancaria (Banco General)'
        : 'Tarjeta (PagueloFacil)';

    let entregaLabel = '';
    if (tipoEntrega === 'retiro') {
      entregaLabel = 'Retiro en el Local (Sede La Chorrera)';
    } else {
      entregaLabel = `Envío express (${courier}) en ${provincia}`;
      if (courier === 'Servientrega' && servientregaModalidad === 'domicilio') {
        entregaLabel += ` - A Domicilio: ${direccion}`;
      } else {
        entregaLabel += ` - Sucursal: ${sucursalRetiro}`;
      }
    }

    const itemsText = (confirmedOrder?.items || items)
      .map((it) => `• ${it.product.nombre} (Cant: ${it.quantity} × $${it.product.precio.toFixed(2)})`)
      .join('\n');

    const voucherStatus = isVoucherAttached
      ? `✓ Captura de comprobante cargada en la web (${voucherFileName || 'captura'}).`
      : `Adjunto mi captura de comprobante a continuación en este chat.`;

    const msg = `*Recibo Oficial de Compra*
*#${orderNum}*

*Cliente:* ${nombre.trim()}
*Teléfono:* ${telefono.trim()}
*Método de Pago:* ${paymentLabel}
*Entrega:* ${entregaLabel}

*Productos:*
${itemsText}

*Subtotal:* $${(confirmedOrder?.subtotal || subtotal).toFixed(2)} USD
${(confirmedOrder?.discount || discount) > 0 ? `*Descuento Promo:* -$${(confirmedOrder?.discount || discount).toFixed(2)} USD\n` : ''}*Total a Pagar:* $${finalTotal.toFixed(2)} USD
*Envío:* A coordinar por WhatsApp según agencia y destino.

*Comprobante:*
${voucherStatus}`;

    return `https://wa.me/${WHATSAPP_ORDERS_PHONE}?text=${encodeURIComponent(msg)}`;
  };

  const handleFinish = () => {
    setIsCheckoutOpen(false);
    setConfirmedOrder(null);
    setCheckoutStep('form');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#09090b] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] shadow-sm shadow-[#fbbf24]/50" />
            <span className="text-xs uppercase tracking-[0.25em] text-[#fbbf24] font-bold">
              {checkoutStep === 'form' && 'Pretty-Store · Datos del Pedido'}
              {checkoutStep === 'payment' && 'Pretty-Store · Confirmación y Pago'}
              {checkoutStep === 'receipt' && 'Pretty-Store · Recibo Oficial'}
            </span>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PASO 1: FORMULARIO BÁSICO (ENTREGA, CLIENTE, COURIER CON TARIFAS, PAGO) */}
        {/* ========================================================================= */}
        {checkoutStep === 'form' && (
          <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
            <form onSubmit={handleProceedToPayment} className="space-y-6">
              {submissionError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 text-rose-400 mt-0.5" />
                  <span>{submissionError}</span>
                </div>
              )}

              {/* 1. Modalidad de Entrega */}
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-[0.16em] text-white font-bold flex items-center gap-2">
                  <Truck size={15} className="text-[#fbbf24]" />
                  <span>1. ¿Cómo deseas recibir tu compra? *</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoEntrega('retiro')}
                    className={`p-3.5 border text-left cursor-pointer transition-all flex items-center gap-2.5 rounded-xl ${
                      tipoEntrega === 'retiro'
                        ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-2 ring-[#fbbf24]'
                        : 'border-white/10 bg-stone-900/40 text-stone-400 hover:border-white/20'
                    }`}
                  >
                    <Store size={20} className={tipoEntrega === 'retiro' ? 'text-[#fbbf24]' : 'text-stone-400'} />
                    <div>
                      <p className="text-xs font-bold text-white">Retirar en el Local</p>
                      <p className="text-[10px] text-stone-400">Sede La Chorrera · Gratis</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoEntrega('delivery')}
                    className={`p-3.5 border text-left cursor-pointer transition-all flex items-center gap-2.5 rounded-xl ${
                      tipoEntrega === 'delivery'
                        ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-2 ring-[#fbbf24]'
                        : 'border-white/10 bg-stone-900/40 text-stone-400 hover:border-white/20'
                    }`}
                  >
                    <Truck size={20} className={tipoEntrega === 'delivery' ? 'text-[#fbbf24]' : 'text-stone-400'} />
                    <div>
                      <p className="text-xs font-bold text-white">Envío express</p>
                      <p className="text-[10px] text-stone-400">Servientrega / Ferguson / UnoExpress</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Si es Envío express: Selección de Courier, Provincia y Sucursal con Tarifas */}
              {tipoEntrega === 'delivery' && (
                <div className="p-4 rounded-xl bg-stone-900/60 border border-white/10 space-y-4">
                  <label className="text-xs uppercase tracking-wider text-stone-200 font-bold block">
                    Selecciona tu Courier de Preferencia *
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* #1 Servientrega */}
                    <button
                      type="button"
                      onClick={() => {
                        setCourier('Servientrega');
                        const def = SERVIENTREGA_SUCURSALES[provincia]?.[0]?.branch || 'Agencia Principal';
                        setSucursalRetiro(def);
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        courier === 'Servientrega'
                          ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-2 ring-[#fbbf24]'
                          : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-white">1. Servientrega</span>
                        {courier === 'Servientrega' && <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono block mt-1">
                        Desde $3.25 aprox.
                      </span>
                    </button>

                    {/* #2 Ferguson */}
                    <button
                      type="button"
                      onClick={() => {
                        setCourier('Ferguson');
                        const def = FERGUSON_SUCURSALES[provincia]?.[0]?.branch || 'Agencia Principal';
                        setSucursalRetiro(def);
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        courier === 'Ferguson'
                          ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-2 ring-[#fbbf24]'
                          : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-white">2. Ferguson</span>
                        {courier === 'Ferguson' && <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />}
                      </div>
                      <span className="text-[10px] text-[#fbbf24] font-mono block mt-1">
                        $5.00 - $8.50 aprox.
                      </span>
                    </button>

                    {/* #3 UnoExpress */}
                    <button
                      type="button"
                      onClick={() => {
                        setCourier('Uno Express');
                        const def = UNO_EXPRESS_SUCURSALES[provincia]?.[0]?.branch || 'Agencia Principal';
                        setSucursalRetiro(def);
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        courier === 'Uno Express'
                          ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-2 ring-[#fbbf24]'
                          : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-white">3. UnoExpress</span>
                        {courier === 'Uno Express' && <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />}
                      </div>
                      <span className="text-[10px] text-[#fbbf24] font-mono block mt-1">
                        $6.50 - $10.50 aprox.
                      </span>
                    </button>
                  </div>

                  {/* Modalidad Servientrega: Sucursal o Domicilio */}
                  {courier === 'Servientrega' && (
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setServientregaModalidad('sucursal')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                          servientregaModalidad === 'sucursal'
                            ? 'border-[#fbbf24] bg-[#fbbf24]/20 text-white'
                            : 'border-white/10 bg-stone-900 text-stone-400'
                        }`}
                      >
                        <Store size={14} />
                        <span>Retiro en Sucursal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setServientregaModalidad('domicilio')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                          servientregaModalidad === 'domicilio'
                            ? 'border-[#fbbf24] bg-[#fbbf24]/20 text-white'
                            : 'border-white/10 bg-stone-900 text-stone-400'
                        }`}
                      >
                        <Home size={14} />
                        <span>Envío a la Casa</span>
                      </button>
                    </div>
                  )}

                  {/* Provincias */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-stone-300 font-medium block">
                      Provincia de destino:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PANAMA_PROVINCES.map((p) => {
                        const isSelected = provincia === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setProvincia(p.id);
                              const list =
                                courier === 'Servientrega'
                                  ? SERVIENTREGA_SUCURSALES[p.id]
                                  : courier === 'Ferguson'
                                  ? FERGUSON_SUCURSALES[p.id]
                                  : UNO_EXPRESS_SUCURSALES[p.id];
                              if (list && list[0]) setSucursalRetiro(list[0].branch);
                            }}
                            className={`p-2 rounded-xl border text-left text-xs font-medium transition-all ${
                              isSelected
                                ? 'border-[#fbbf24] bg-[#fbbf24]/20 text-white'
                                : 'border-white/10 bg-black/40 text-stone-400 hover:text-white'
                            }`}
                          >
                            <span>{p.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sucursales con tarifas aproximadas exactas */}
                  {courier === 'Servientrega' && servientregaModalidad === 'domicilio' ? (
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-stone-300 font-medium block">
                        Dirección exacta de entrega a domicilio: *
                      </label>
                      <input
                        type="text"
                        placeholder="Barriada, calle, número de casa/apto en Panamá..."
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#fbbf24]"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-stone-300 font-medium">
                          Sucursal de {courier} en {provincia}:
                        </label>
                        <span className="text-[10px] text-[#fbbf24] font-mono">
                          Tarifa estimada: {selectedBranchRate}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                        {currentBranchOptions.map((b) => {
                          const isSel = sucursalRetiro === b.branch;
                          return (
                            <button
                              key={b.branch}
                              type="button"
                              onClick={() => setSucursalRetiro(b.branch)}
                              className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                isSel
                                  ? 'border-[#fbbf24] bg-[#fbbf24]/20 text-white ring-1 ring-[#fbbf24]'
                                  : 'border-white/10 bg-black/50 text-stone-300 hover:border-white/25'
                              }`}
                            >
                              <span className="font-medium truncate">{b.branch}</span>
                              <span className="text-[10px] font-mono text-[#fbbf24] shrink-0 font-bold">
                                {b.approxRate}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* AVISO SOLICITADO: DECIR QUE SOLO ES UN APROXIMADO */}
                      <p className="text-[10px] text-amber-300/90 font-light pt-1 leading-relaxed">
                        ⚠️ <strong>Aviso de Envío:</strong> Los precios mostrados (ej. {selectedBranchRate}) <strong>son solo un aproximado</strong> según la tabla de {courier}. El costo exacto final lo cobra la agencia o se confirma al despachar según destino.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Datos del Cliente */}
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-[0.16em] text-white font-bold block">
                  2. Datos de Contacto del Cliente *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] text-stone-300 font-light block">Nombre Completo *</label>
                    <input
                      type="text"
                      placeholder="Ej. Roberto Cedeño"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className={`w-full px-3.5 py-2.5 bg-stone-900/60 border text-xs text-white placeholder-stone-600 focus:outline-none rounded-xl ${
                        formErrors.nombre ? 'border-rose-500' : 'border-white/10 focus:border-[#fbbf24]'
                      }`}
                    />
                    {formErrors.nombre && <p className="text-[10px] text-rose-400">{formErrors.nombre}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-stone-300 font-light block">Teléfono / WhatsApp *</label>
                    <input
                      type="tel"
                      placeholder="+507 6000-0000"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className={`w-full px-3.5 py-2.5 bg-stone-900/60 border text-xs text-white placeholder-stone-600 focus:outline-none rounded-xl ${
                        formErrors.telefono ? 'border-rose-500' : 'border-white/10 focus:border-[#fbbf24]'
                      }`}
                    />
                    {formErrors.telefono && <p className="text-[10px] text-rose-400">{formErrors.telefono}</p>}
                  </div>
                </div>
              </div>

              {/* 3. Selección del Método de Pago deseado */}
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-[0.16em] text-white font-bold block">
                  3. Selecciona tu Método de Pago *
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMetodoPago('yappy')}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      metodoPago === 'yappy'
                        ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-1 ring-[#fbbf24]'
                        : 'border-white/10 bg-black/40 text-stone-400 hover:text-white'
                    }`}
                  >
                    <Smartphone size={18} className="mx-auto text-[#fbbf24]" />
                    <span className="text-xs font-bold block mt-1">Yappy</span>
                    <span className="text-[9px] text-stone-400 font-mono">6215-0251</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago('transferencia')}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      metodoPago === 'transferencia'
                        ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-1 ring-[#fbbf24]'
                        : 'border-white/10 bg-black/40 text-stone-400 hover:text-white'
                    }`}
                  >
                    <Landmark size={18} className="mx-auto text-[#fbbf24]" />
                    <span className="text-xs font-bold block mt-1">Banco General</span>
                    <span className="text-[9px] text-stone-400 font-mono">ACH</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago('tarjeta')}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      metodoPago === 'tarjeta'
                        ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-1 ring-[#fbbf24]'
                        : 'border-white/10 bg-black/40 text-stone-400 hover:text-white'
                    }`}
                  >
                    <CreditCard size={18} className="mx-auto text-[#fbbf24]" />
                    <span className="text-xs font-bold block mt-1">Tarjeta</span>
                    <span className="text-[9px] text-stone-400 font-mono">PagueloFacil</span>
                  </button>
                </div>
              </div>

              {/* Resumen básico de compra: subtotal, descuento, total */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">${subtotal.toFixed(2)} USD</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>{promo.promoTitle || 'Descuento Promocional'}</span>
                    <span className="font-mono">-${discount.toFixed(2)} USD</span>
                  </div>
                )}
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                  <span className="text-white">Total a Pagar:</span>
                  <span className="text-2xl font-mono text-[#fbbf24]">
                    ${finalTotal.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Botón para avanzar a la pantalla de Pago con Número de Pedido */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#f59e0b] hover:to-[#fbbf24] text-black font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xl shadow-[#fbbf24]/20 active:scale-[0.99]"
              >
                <span>Confirmar Pedido</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: NÚMERO DE PEDIDO PRIMERO + CONTINUAR CON EL PEDIDO + PAGO + CAPTURA */}
        {/* REQUISITO EXACTO DEL USUARIO:
            "la persona ala hora que le de confirmar pedido le aparezca primero el numero de pedido
             y luego le aparezca un apartado donde diga algo tipo continuar con el pedido y dependiendo
             si agarro yappy tarjeta o transferencia le aparece el link el numero o el numero de transferencia
             y luego abajo le aparezca ingrese la captura de su comprobante y luego de le confirmar pedido"
        */}
        {/* ========================================================================= */}
        {checkoutStep === 'payment' && confirmedOrder && (
          <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
            {/* 1. NÚMERO DE PEDIDO PRIMERO */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#fbbf24]/20 via-black to-black border-2 border-[#fbbf24] text-center space-y-1.5 shadow-2xl">
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#fbbf24] font-black block">
                ✓ Número de Pedido
              </span>
              <h2 className="text-3xl sm:text-5xl font-mono font-black text-[#fbbf24] tracking-wider drop-shadow-[0_2px_12px_rgba(251,191,36,0.5)]">
                #{confirmedOrder.orderNumber}
              </h2>
              <p className="text-xs text-stone-300 font-medium pt-1">
                Total a pagar: <strong className="text-white font-mono text-sm sm:text-base">${confirmedOrder.total.toFixed(2)} USD</strong>
              </p>
            </div>

            {/* 2. APARTADO "Continuar con el pedido" */}
            <div className="p-5 rounded-2xl bg-[#121216] border border-white/15 space-y-4 shadow-xl text-left">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
                    <span>Continuar con el pedido</span>
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {metodoPago === 'yappy' && 'Realiza tu pago vía Yappy con el siguiente número'}
                    {metodoPago === 'tarjeta' && 'Realiza tu pago con tarjeta en el siguiente link oficial'}
                    {metodoPago === 'transferencia' && 'Realiza tu transferencia bancaria a la siguiente cuenta'}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#fbbf24]/15 border border-[#fbbf24]/40 text-[#fbbf24] text-xs font-mono font-bold">
                  ${confirmedOrder.total.toFixed(2)} USD
                </span>
              </div>

              {/* Si agarró Yappy: aparece el número */}
              {metodoPago === 'yappy' && (
                <div className="p-4 rounded-xl bg-black/90 border border-[#fbbf24]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-semibold">
                      Número de Yappy para transferir:
                    </span>
                    <span className="text-2xl sm:text-3xl font-mono font-black text-[#fbbf24] block tracking-wide">
                      {YAPPY_PAY_PHONE}
                    </span>
                    <span className="text-xs text-stone-300 block">
                      A nombre de: <strong className="text-white">{TITULAR_CUENTAS}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyYappyNumber(YAPPY_PAY_PHONE)}
                    className="px-5 py-3 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-lg shadow-[#fbbf24]/30"
                  >
                    {copiedYappy ? <Check size={18} /> : <Copy size={18} />}
                    <span>{copiedYappy ? '¡Copiado!' : 'Copiar Número'}</span>
                  </button>
                </div>
              )}

              {/* Si agarró Tarjeta: aparece el link de pago */}
              {metodoPago === 'tarjeta' && (
                <div className="p-4 rounded-xl bg-black/90 border border-[#fbbf24]/40 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-semibold">
                      Link de Pago Seguro con Tarjeta (Visa, Mastercard, Clave):
                    </span>
                    <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 font-mono text-xs text-stone-300 break-all select-all">
                      {PAGUELOFACIL_LINK}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <a
                      href={PAGUELOFACIL_LINK}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#f59e0b] hover:to-[#fbbf24] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#fbbf24]/20 cursor-pointer"
                    >
                      <CreditCard size={18} />
                      <span>Ir al Link de Pago con Tarjeta</span>
                      <ExternalLink size={16} />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(PAGUELOFACIL_LINK);
                        setCopiedBank(true);
                        setTimeout(() => setCopiedBank(false), 2500);
                      }}
                      className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy size={16} />
                      <span>{copiedBank ? '¡Link Copiado!' : 'Copiar Link'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Si agarró Transferencia: aparece el número de cuenta de transferencia */}
              {metodoPago === 'transferencia' && (
                <div className="p-4 rounded-xl bg-black/90 border border-[#fbbf24]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-semibold">
                      Banco General · Cuenta Corriente:
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-[#fbbf24] block tracking-wide">
                      {BANCO_GENERAL_CUENTA}
                    </span>
                    <span className="text-xs text-stone-300 block">
                      A nombre de: <strong className="text-white">{TITULAR_CUENTAS}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyBankDetails(BANCO_GENERAL_CUENTA)}
                    className="px-5 py-3 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-lg shadow-[#fbbf24]/30"
                  >
                    {copiedBank ? <Check size={18} /> : <Copy size={18} />}
                    <span>{copiedBank ? '¡Copiado!' : 'Copiar Cuenta'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. LUEGO ABAJO: "INGRESE LA CAPTURA DE SU COMPROBANTE" */}
            <div className="p-5 rounded-2xl bg-[#121216] border border-white/15 space-y-3 text-left shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <label className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <UploadCloud size={18} className="text-[#fbbf24]" />
                  <span>Ingrese la captura de su comprobante</span>
                </label>
                {isVoucherAttached && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold">
                    ✓ Captura Lista
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-300 font-light">
                Adjunta la foto o captura de pantalla de tu pago (desde tu galería, fotos o archivos):
              </p>

              <input
                ref={voucherInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleVoucherFileChange}
                className="hidden"
                id="payment-voucher-input"
              />

              {voucherImage ? (
                <div className="p-3.5 rounded-xl bg-black/80 border border-emerald-500/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={voucherImage}
                      alt="Comprobante"
                      className="w-16 h-16 object-cover rounded-lg border border-white/20 shrink-0 bg-stone-800"
                    />
                    <div className="min-w-0">
                      <p className="text-white font-medium text-xs truncate">
                        {voucherFileName || 'comprobante_pago.png'}
                      </p>
                      <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                        ✓ Captura adjuntada con éxito
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label
                      htmlFor="payment-voucher-input"
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Cambiar
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="payment-voucher-input"
                  className="p-5 rounded-xl border-2 border-dashed border-white/20 hover:border-[#fbbf24] bg-black/50 hover:bg-[#fbbf24]/5 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group"
                >
                  <UploadCloud size={28} className="text-[#fbbf24] group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Toca aquí para seleccionar la captura del comprobante
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">
                      Sube una captura de tu comprobante de Yappy, PagueloFacil o Banco
                    </span>
                  </div>
                </label>
              )}
            </div>

            {/* 4. Y LUEGO DÉLE CONFIRMAR PEDIDO */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinalOrderConfirmation}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#f59e0b] hover:to-[#fbbf24] text-black font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-[#fbbf24]/30 active:scale-[0.99]"
              >
                <span>Confirmar Pedido</span>
                <CheckCircle2 size={20} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 3: Y DESPUÉS LE SALE EL RECIBO Y QUE ENVÍE LA CAPTURA Y RECIBO POR WASAP */}
        {/* ========================================================================= */}
        {checkoutStep === 'receipt' && confirmedOrder && (
          <div className="overflow-y-auto p-5 sm:p-7 space-y-6 text-center">
            {/* Encabezado del Recibo */}
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono uppercase font-bold inline-block mb-1">
                ✓ Pedido Confirmado
              </span>
              <h2 className="text-2xl sm:text-4xl font-mono font-extrabold text-[#fbbf24]">
                #{confirmedOrder.orderNumber}
              </h2>
              <p className="text-xs text-stone-400 font-light">
                Recibo Oficial listo para enviar
              </p>
            </div>

            {/* Recibo Oficial Estructurado */}
            <div className="max-w-xl mx-auto p-5 rounded-2xl bg-black/90 border border-white/15 text-left space-y-4 text-xs font-sans shadow-2xl">
              <div className="border-b border-white/10 pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                    Recibo Oficial de Compra
                  </h3>
                  <p className="text-[11px] text-[#fbbf24] font-mono mt-0.5">
                    #{confirmedOrder.orderNumber}
                  </p>
                </div>
                <span className="text-stone-400 text-[10px]">
                  {new Date().toLocaleDateString('es-PA')}
                </span>
              </div>

              {/* Datos Cliente y Entrega */}
              <div className="grid grid-cols-2 gap-3 border-b border-white/10 pb-3">
                <div>
                  <span className="text-stone-400 text-[10px] block">Cliente:</span>
                  <span className="text-white font-medium block">{nombre}</span>
                  <span className="text-stone-300 font-mono text-[10px]">{telefono}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] block">Método de Pago:</span>
                  <span className="text-[#fbbf24] font-bold block capitalize">
                    {metodoPago === 'yappy' ? 'Yappy (6215-0251)' : metodoPago === 'transferencia' ? 'Banco General (ACH)' : 'Tarjeta (PagueloFacil)'}
                  </span>
                </div>
                <div className="col-span-2 pt-1">
                  <span className="text-stone-400 text-[10px] block">Modalidad de Entrega:</span>
                  <span className="text-white font-medium block">
                    {tipoEntrega === 'retiro'
                      ? 'Retiro en Tienda (Sede La Chorrera)'
                      : `Envío express (${courier}) en ${provincia} - ${courier === 'Servientrega' && servientregaModalidad === 'domicilio' ? direccion : sucursalRetiro}`}
                  </span>
                </div>
              </div>

              {/* Productos */}
              <div className="space-y-2 border-b border-white/10 pb-3">
                <span className="text-stone-300 font-semibold block text-xs">
                  Detalle de Productos:
                </span>
                <div className="space-y-1.5">
                  {(confirmedOrder.items || items).map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-white truncate">
                        {it.product.nombre} <span className="text-stone-400 font-mono">({it.quantity}x)</span>
                      </span>
                      <span className="font-mono text-white font-bold">
                        ${(it.quantity * it.product.precio).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desglose */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-300">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">${confirmedOrder.subtotal.toFixed(2)}</span>
                </div>
                {confirmedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Descuento Promo</span>
                    <span className="font-mono">-${confirmedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-300">
                  <span>Envío express</span>
                  <span className="font-mono text-[#fbbf24]">A coordinar por WhatsApp</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                  <span className="text-white uppercase tracking-wider text-xs">Total:</span>
                  <span className="text-xl font-mono text-[#fbbf24]">
                    ${confirmedOrder.total.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Comprobante adjuntado */}
              {voucherImage && (
                <div className="pt-2 border-t border-white/10 flex items-center gap-3">
                  <img
                    src={voucherImage}
                    alt="Comprobante"
                    className="w-12 h-12 object-cover rounded-lg border border-white/20 bg-stone-800"
                  />
                  <div>
                    <span className="text-emerald-400 text-xs font-semibold block">
                      ✓ Captura de comprobante montada
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {voucherFileName || 'captura_adjuntada.png'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* BOTÓN OFICIAL DE WHATSAPP: "ENVIAR LA CAPTURA Y EL RECIBO POR WASAP DE UNA VEZ" */}
            <div className="max-w-xl mx-auto space-y-3 pt-1">
              <a
                href={generateWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-[#25D366]/30 cursor-pointer active:scale-[0.99]"
              >
                <MessageSquare size={22} className="fill-black" />
                <span>Enviar Captura y Recibo por WhatsApp</span>
              </a>
              <p className="text-[11px] text-stone-400 font-light">
                Presiona el botón para abrir WhatsApp en el <strong>+507 6215-0251</strong> con tu recibo listo para enviar junto a tu captura.
              </p>
            </div>

            {/* Aviso de 48 Horas */}
            <div className="max-w-xl mx-auto p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-200 text-xs flex items-center gap-2.5 text-left">
              <Clock size={18} className="text-amber-400 shrink-0" />
              <span className="text-[11px] text-stone-200 font-light">
                Dispones de un plazo de <strong>48 horas</strong> para coordinar tu entrega o retiro con tu comprobante.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinish}
                className="px-8 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Finalizar y Volver a la Tienda
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
