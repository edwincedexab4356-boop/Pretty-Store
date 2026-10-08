import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  ArrowLeft,
  ShoppingCart,
  FileCheck,
  Lock,
  Printer,
  Download,
  ZoomIn,
  FileText,
  Image as ImageIcon,
  Eye,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { MetodoPago, TipoEntrega, CourierOption } from '../../types/database';
import {
  createRealOrder,
  CreatedOrderResult,
  updateOrderPaymentVoucher,
  uploadVoucherToSupabaseStorage,
} from '../../services/checkoutService';
import { getSupabaseClient } from '../../lib/supabase';
import { saveOrderReceipt, updateOrderVoucher, StoredOrderReceipt } from '../../utils/orderReceiptStorage';
import { saveVoucherImageToDb } from '../../utils/voucherDb';
import { compressImageFile } from '../../utils/imageOptimizer';
import { OfficialInvoiceModal } from '../admin/OfficialInvoiceModal';

// NÚMEROS Y CUENTAS OFICIALES SUMINISTRADAS POR EL CLIENTE:
export const YAPPY_PAY_PHONE = '6215-0251';
export const WHATSAPP_ORDERS_PHONE = '50762150251';
export const TITULAR_CUENTAS = 'JESUS ALEJANDRO CARDONA ESCOBAR';
export const BANCO_GENERAL_CUENTA = '0472985946850';
export const TARJETA_PAY_LINK = 'https://checkout.paguelofacil.com/W_F9464GL';

export type PanamaProvince =
  | 'Panamá Capital'
  | 'Panamá Oeste'
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
  { id: 'Panamá Capital', name: 'Panamá Capital', tag: 'Ciudad de Panamá · Chepo' },
  { id: 'Panamá Oeste', name: 'Panamá Oeste', tag: 'La Chorrera · Arraiján' },
  { id: 'Colón', name: 'Colón', tag: 'Costa Atlántica' },
  { id: 'Coclé', name: 'Coclé', tag: 'Penonomé · Aguadulce' },
  { id: 'Herrera', name: 'Herrera', tag: 'Chitré · Pesé' },
  { id: 'Los Santos', name: 'Los Santos', tag: 'Las Tablas · Pedasí' },
  { id: 'Veraguas', name: 'Veraguas', tag: 'Santiago · Soná' },
  { id: 'Chiriquí', name: 'Chiriquí', tag: 'David · Boquete · Bugaba' },
  { id: 'Bocas del Toro', name: 'Bocas del Toro', tag: 'Changuinola · Isla Colón' },
  { id: 'Darién', name: 'Darién', tag: 'Metetí' },
  { id: 'Comarcas', name: 'Comarcas', tag: 'Guna Yala · Ngäbe-Buglé' },
];

export interface ServientregaBranchRate {
  branch: string;
  branchRate: string; // Primer número: Envío a la sucursal
  homeRate: string;   // Segundo número: Envío a la casa (domicilio)
}

export interface SingleCourierBranch {
  branch: string;
  rate: string;
}

// 1. SERVIENTREGA: Dos números (Primer número = Envío a la Sucursal, Segundo número = Envío a la Casa)
export const SERVIENTREGA_SUCURSALES: Record<PanamaProvince, ServientregaBranchRate[]> = {
  'Panamá Capital': [
    { branch: 'Dirección General - Parque Lefevre', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'Vía España - Plaza Concordia', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'El Dorado (Plaza Golden)', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'Paitilla', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'Las Mañanitas', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'Los Andes Mall', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV TSB Cargo San Francisco', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Perugraff - Tortí', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Mr. Mail - El Dorado', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Cargo Box Express Hato Pintado', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Mr. Mail Vía Argentina', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'Chepo (AV Compucel)', branchRate: '$8.00', homeRate: '$8.00' },
    { branch: 'AV Shop Box DB Don Bosco', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Ebuy Panamá', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Costa del Este Tu Carga Express', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Vía Israel Tu Carga Express', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Box to Box Los Ángeles', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Box to Box Versalles', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Box to Box Marbella', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Box to Box Villa Zaita', branchRate: '$3.86', homeRate: '$5.79' },
  ],
  'Panamá Oeste': [
    { branch: 'La Chorrera (Av. de las Américas)', branchRate: '$3.25', homeRate: '$5.61' },
    { branch: 'AV Box to Box Costa Verde', branchRate: '$3.25', homeRate: '$5.61' },
    { branch: 'AV Paquetexpress PTY Coronado', branchRate: '$3.25', homeRate: '$4.61' },
    { branch: 'AV Ptybuy Express Arraiján', branchRate: '$3.25', homeRate: '$4.61' },
  ],
  'Chiriquí': [
    { branch: 'David El Rocío / David Calle 4ta', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Concepción Bugaba Shop Express', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Barú Servicios y Utilería', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Puerto Armuelles - Rapid Services Barú', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Río Sereno - Farmacia Don Andrés', branchRate: '$6.00', homeRate: '$10.60' },
    { branch: 'AV Volcán - Alfa Cell Technologic', branchRate: '$6.00', homeRate: '$10.60' },
    { branch: 'AV Chiriquí - Tolé Monchis Compras', branchRate: '$6.00', homeRate: '$10.60' },
    { branch: 'AV E-Box Express Paso Canoas', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Box to Box Doleguita', branchRate: '$3.86', homeRate: '$5.79' },
  ],
  'Coclé': [
    { branch: 'AV El Valle de Antón - El Valle Express', branchRate: '$3.25', homeRate: '$4.61' },
    { branch: 'Penonomé', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'Aguadulce', branchRate: '$3.86', homeRate: '$5.79' },
  ],
  'Herrera': [
    { branch: 'Chitré (Av. Herrera)', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'Chitré (Plaza Azuero)', branchRate: '$3.86', homeRate: '$5.79' },
  ],
  'Los Santos': [
    { branch: 'AV Guararé - Malala', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'AV Tonosí - Hostal Victoria Malala', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'Las Tablas', branchRate: '$3.86', homeRate: '$5.79' },
  ],
  'Veraguas': [
    { branch: 'Santiago (Av. Central)', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'Santiago (Terminal de Transporte)', branchRate: '$3.86', homeRate: '$5.79' },
  ],
  'Colón': [
    { branch: 'Colón (Calle 13 y Bolívar)', branchRate: '$3.86', homeRate: '$5.79' },
    { branch: 'Cuatro Altos (Plaza Millenium)', branchRate: '$3.86', homeRate: '$5.79' },
  ],
  'Bocas del Toro': [
    { branch: 'Changuinola (Av. 17 de Abril)', branchRate: '$11.35', homeRate: '$15.95' },
    { branch: 'AV Bocas Island Express (Isla Colón)', branchRate: '$11.35', homeRate: '$15.95' },
    { branch: 'AV Chiriquí Grande - Multiservicios Zamarci', branchRate: '$11.35', homeRate: '$15.95' },
    { branch: 'AV Almirante Soluciones y Más', branchRate: '$11.35', homeRate: '$15.95' },
  ],
  'Darién': [
    { branch: 'AV Metetí Darién - Valeria\'s Boutique', branchRate: '$6.00', homeRate: '$10.60' },
  ],
  'Comarcas': [
    { branch: 'Agencia Principal / Más cercana', branchRate: '$6.00', homeRate: '$10.60' },
  ],
};

// 2. FERGUSON: Tarifas oficiales del cuadro comparativo (1 solo número por punto)
export const FERGUSON_SUCURSALES: Record<PanamaProvince, SingleCourierBranch[]> = {
  'Panamá Capital': [
    { branch: 'Vista Hermosa', rate: '$5.00' },
    { branch: 'San Pedro', rate: '$5.00' },
    { branch: '24 de Diciembre', rate: '$5.00' },
    { branch: 'Justo Arosemena', rate: '$5.00' },
    { branch: 'Calle 50', rate: '$5.00' },
    { branch: 'Chepo', rate: '$8.00' },
  ],
  'Panamá Oeste': [
    { branch: 'La Chorrera (Parque Feuillet)', rate: '$5.00' },
    { branch: 'Vista Alegre', rate: '$5.00' },
    { branch: 'Arraiján Cabecera', rate: '$5.00' },
  ],
  'Chiriquí': [
    { branch: 'David – Edificio Garrido', rate: '$5.00' },
    { branch: 'David – Plaza Salamanca', rate: '$5.00' },
    { branch: 'Puerto Armuelles', rate: '$6.00' },
    { branch: 'Concepción – Bugaba', rate: '$6.00' },
    { branch: 'Volcán', rate: '$6.00' },
    { branch: 'Boquete', rate: '$6.00' },
  ],
  'Coclé': [
    { branch: 'Penonomé (Central)', rate: '$5.00' },
    { branch: 'Aguadulce (Vía Interamericana)', rate: '$5.00' },
  ],
  'Herrera': [
    { branch: 'Chitré (Paseo Enrique Geenzier)', rate: '$5.00' },
    { branch: 'Chitré (Terminal)', rate: '$5.00' },
  ],
  'Los Santos': [
    { branch: 'Las Tablas (Parque Porras)', rate: '$6.00' },
    { branch: 'Las Tablas (Terminal)', rate: '$6.00' },
  ],
  'Veraguas': [
    { branch: 'Santiago (Terminal)', rate: '$5.00' },
    { branch: 'Soná', rate: '$5.00' },
  ],
  'Colón': [
    { branch: 'Colón Centro', rate: '$5.50' },
    { branch: 'Colón – Sabanitas', rate: '$5.50' },
  ],
  'Bocas del Toro': [
    { branch: 'Changuinola (Frente al Parque)', rate: '$8.50' },
  ],
  'Darién': [
    { branch: 'Darién – Metetí', rate: '$8.50' },
  ],
  'Comarcas': [
    { branch: 'Agencia Principal / Más cercana', rate: '$8.50' },
  ],
};

// 3. UNO EXPRESS: Tarifas oficiales del cuadro comparativo (1 solo número por punto)
export const UNO_EXPRESS_SUCURSALES: Record<PanamaProvince, SingleCourierBranch[]> = {
  'Panamá Capital': [
    { branch: 'Marbella', rate: '$6.50' },
    { branch: 'Tumba Muerto', rate: '$6.50' },
    { branch: 'Albrook', rate: '$6.50' },
    { branch: 'Costa del Este', rate: '$6.50' },
    { branch: 'Obarrio', rate: '$6.50' },
    { branch: 'Plaza Tocumen', rate: '$6.50' },
    { branch: 'Vía Brasil', rate: '$6.50' },
    { branch: 'San Francisco', rate: '$6.50' },
    { branch: 'Justo Arosemena', rate: '$6.50' },
    { branch: 'Vista Hermosa', rate: '$6.50' },
    { branch: '24 de Diciembre', rate: '$6.50' },
    { branch: 'Río Abajo', rate: '$6.50' },
    { branch: 'Juan Díaz', rate: '$6.50' },
    { branch: 'Villa Lucre', rate: '$6.50' },
    { branch: 'Brisas del Golf', rate: '$6.50' },
    { branch: 'Los Andes', rate: '$6.50' },
    { branch: 'Villa Zaita', rate: '$6.50' },
    { branch: 'El Dorado', rate: '$6.50' },
    { branch: 'Chepo', rate: '$8.00' },
  ],
  'Panamá Oeste': [
    { branch: 'Gorgona', rate: '$6.50' },
    { branch: 'Paseo Arraiján', rate: '$6.50' },
    { branch: 'Vista Alegre', rate: '$6.50' },
    { branch: 'La Chorrera (Plaza Italia)', rate: '$6.50' },
    { branch: 'Westland Mall', rate: '$6.50' },
  ],
  'Coclé': [
    { branch: 'El Valle de Antón', rate: '$7.50' },
    { branch: 'Penonomé (Plaza Boulevard)', rate: '$6.50' },
    { branch: 'Aguadulce (Centro)', rate: '$6.50' },
  ],
  'Veraguas': [
    { branch: 'Santiago (Plaza Boulevard)', rate: '$6.50' },
    { branch: 'Soná', rate: '$6.50' },
  ],
  'Herrera': [
    { branch: 'Chitré (Plaza Moderna)', rate: '$6.50' },
    { branch: 'Chitré (Terminal)', rate: '$6.50' },
  ],
  'Los Santos': [
    { branch: 'Las Tablas (Centro)', rate: '$6.50' },
    { branch: 'Pedasí', rate: '$7.50' },
  ],
  'Chiriquí': [
    { branch: 'David Obaldía', rate: '$6.50' },
    { branch: 'David San Mateo', rate: '$6.50' },
    { branch: 'David Terronal', rate: '$6.50' },
    { branch: 'Bugaba', rate: '$6.50' },
    { branch: 'Volcán', rate: '$7.50' },
    { branch: 'Frontera', rate: '$6.50' },
    { branch: 'Pto Armuelles', rate: '$7.50' },
    { branch: 'Boquete', rate: '$6.50' },
  ],
  'Colón': [
    { branch: 'Colón 4 altos', rate: '$6.50' },
  ],
  'Bocas del Toro': [
    { branch: 'Changuinola (Centro)', rate: '$10.50' },
    { branch: 'Chiriquí Grande', rate: '$10.50' },
    { branch: 'Almirante', rate: '$10.50' },
    { branch: 'Isla Colón', rate: '$10.50' },
  ],
  'Darién': [
    { branch: 'Metetí', rate: '$9.50' },
  ],
  'Comarcas': [
    { branch: 'Agencia Principal / Más cercana', rate: '$9.50' },
  ],
};

/**
 * Extrae el valor numérico en dólares a partir del string de tarifa (ej. "$3.86" -> 3.86, "B/. 6.50" -> 6.50)
 */
export function parseShippingRateToNumber(rateStr: string): number {
  if (!rateStr) return 0;
  const match = rateStr.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const val = parseFloat(match[1]);
    return isNaN(val) ? 0 : val;
  }
  return 0;
}

/**
 * Convierte un Blob o data URL de imagen a formato PNG estándar,
 * requerido estrictamente por la Async Clipboard API de los navegadores (Chrome, Safari, Edge)
 */
async function convertToPngBlob(source: Blob | string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      } catch (err) {
        console.warn('Error al convertir comprobante a PNG en canvas:', err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

type CheckoutStep = 'form' | 'review' | 'payment' | 'receipt';

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

  // Pasos: 'form' -> 'review' (hojita y confirmación) -> 'payment' (números de pago y comprobante) -> 'receipt' (con WhatsApp)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('form');
  const [hasOpenedWhatsApp, setHasOpenedWhatsApp] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  // 1. Modalidad de Entrega
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('delivery');

  // 2. Courier
  const [courier, setCourier] = useState<CourierOption>('Servientrega');
  // En Servientrega: modalidad sucursal (primer precio) vs domicilio (segundo precio)
  const [servientregaModalidad, setServientregaModalidad] = useState<'sucursal' | 'domicilio'>('sucursal');

  // 3. Ubicación
  const [provincia, setProvincia] = useState<PanamaProvince>('Panamá Capital');
  const [sucursalRetiro, setSucursalRetiro] = useState('Dirección General - Parque Lefevre');
  const [direccion, setDireccion] = useState('');

  // 4. Datos del Cliente
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');

  // 5. Método de Pago (Yappy de primero)
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('yappy');
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedYappy, setCopiedYappy] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // 6. Voucher / Captura de Pago
  const [voucherRawFile, setVoucherRawFile] = useState<File | null>(null);
  const [voucherImage, setVoucherImage] = useState<string | null>(null);
  const [voucherFileName, setVoucherFileName] = useState<string | null>(null);
  const [isVoucherAttached, setIsVoucherAttached] = useState(false);
  const voucherInputRef = useRef<HTMLInputElement | null>(null);
  const realSupabaseOrderIdRef = useRef<number | string | null>(null);

  // Pedido Confirmado
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<CreatedOrderResult | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Visualizadores de Factura Oficial y Captura
  const [showFullInvoiceModal, setShowFullInvoiceModal] = useState(false);
  const [isZoomingVoucher, setIsZoomingVoucher] = useState(false);

  // REINICIAR TODO EL ESTADO PARA UN NUEVO PEDIDO
  const resetCheckout = () => {
    setCheckoutStep('form');
    setConfirmedOrder(null);
    setVoucherImage(null);
    setVoucherFileName(null);
    setIsVoucherAttached(false);
    setHasOpenedWhatsApp(false);
    setNombre('');
    setTelefono('');
    setDireccion('');
    setNotas('');
    setFormErrors({});
    setSubmissionError(null);
    setShowFullInvoiceModal(false);
    setIsZoomingVoucher(false);
    if (voucherInputRef.current) voucherInputRef.current.value = '';
  };

  // Si se cierra el modal estando en 'receipt', reiniciar para que el próximo pedido empiece limpio
  useEffect(() => {
    if (!isCheckoutOpen && checkoutStep === 'receipt') {
      resetCheckout();
    }
  }, [isCheckoutOpen, checkoutStep]);

  // Lista de sucursales de Servientrega
  const currentServientregaBranches = useMemo<ServientregaBranchRate[]>(() => {
    return SERVIENTREGA_SUCURSALES[provincia] || [];
  }, [provincia]);

  // Lista de sucursales de Ferguson
  const currentFergusonBranches = useMemo<SingleCourierBranch[]>(() => {
    return FERGUSON_SUCURSALES[provincia] || [];
  }, [provincia]);

  // Lista de sucursales de Uno Express
  const currentUnoExpressBranches = useMemo<SingleCourierBranch[]>(() => {
    return UNO_EXPRESS_SUCURSALES[provincia] || [];
  }, [provincia]);

  // Tarifa activa calculada para Servientrega (sucursal = primer número, casa = segundo número)
  const activeServientregaRate = useMemo(() => {
    const found = currentServientregaBranches.find((b) => b.branch === sucursalRetiro) || currentServientregaBranches[0];
    if (!found) return servientregaModalidad === 'sucursal' ? '$3.25' : '$5.61';
    return servientregaModalidad === 'sucursal' ? found.branchRate : found.homeRate;
  }, [currentServientregaBranches, sucursalRetiro, servientregaModalidad]);

  // Tarifa activa calculada para Ferguson o UnoExpress
  const activeSingleRate = useMemo(() => {
    if (courier === 'Ferguson') {
      const found = currentFergusonBranches.find((b) => b.branch === sucursalRetiro) || currentFergusonBranches[0];
      return found ? found.rate : '$5.00';
    }
    if (courier === 'Uno Express') {
      const found = currentUnoExpressBranches.find((b) => b.branch === sucursalRetiro) || currentUnoExpressBranches[0];
      return found ? found.rate : '$6.50';
    }
    return '$5.00';
  }, [courier, currentFergusonBranches, currentUnoExpressBranches, sucursalRetiro]);

  // Tarifa estimada textual para mostrar según el courier seleccionado
  const displayEstimatedRate = useMemo(() => {
    if (courier === 'Servientrega') return activeServientregaRate;
    return activeSingleRate;
  }, [courier, activeServientregaRate, activeSingleRate]);

  // REQUISITO SOLICITADO: "el precio del envió no se agrega al precio arregla eso"
  // Calculamos el valor numérico del envío seleccionado y LO AGREGAMOS al total
  const numericalShipping = useMemo(() => {
    if (tipoEntrega === 'retiro') return 0;
    return parseShippingRateToNumber(displayEstimatedRate);
  }, [tipoEntrega, displayEstimatedRate]);

  // Total CON ENVÍO SUMADO
  const finalTotal = useMemo(() => {
    const itemsTotal = Math.max(0, subtotal - discount);
    return Number((itemsTotal + numericalShipping).toFixed(2));
  }, [subtotal, discount, numericalShipping]);

  if (!isCheckoutOpen) return null;

  const handleVoucherFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('La imagen no debe superar los 20MB.');
      return;
    }

    setVoucherRawFile(file);
    setVoucherFileName(file.name);
    try {
      // Optimizar y comprimir captura de forma inteligente antes de guardar
      const compressed = await compressImageFile(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.82,
      });
      const dataUrl = compressed.dataUrl;
      setVoucherImage(dataUrl);
      setIsVoucherAttached(true);

      // Si el pedido ya existe, actualizar de inmediato en almacén persistente, IndexedDB y Supabase
      if (confirmedOrder) {
        const orderKey = confirmedOrder.orderId || confirmedOrder.orderNumber;
        saveVoucherImageToDb(orderKey, dataUrl, file.name);
        if (confirmedOrder.orderNumber) {
          saveVoucherImageToDb(confirmedOrder.orderNumber, dataUrl, file.name);
        }
        updateOrderVoucher(
          orderKey,
          dataUrl,
          file.name
        );
      }
    } catch (err) {
      console.warn('Compresión de comprobante:', err);
      const reader = new FileReader();
      reader.onload = () => {
        const fallbackUrl = reader.result as string;
        setVoucherImage(fallbackUrl);
        setIsVoucherAttached(true);
        if (confirmedOrder) {
          const orderKey = confirmedOrder.orderId || confirmedOrder.orderNumber;
          saveVoucherImageToDb(orderKey, fallbackUrl, file.name);
          if (confirmedOrder.orderNumber) {
            saveVoucherImageToDb(confirmedOrder.orderNumber, fallbackUrl, file.name);
          }
          updateOrderVoucher(
            orderKey,
            fallbackUrl,
            file.name
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherRawFile(null);
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

  const copyCardLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Auto-desplazamiento a la siguiente opción/paso al tramitar el pedido
  const scrollToNextOption = (targetId: string) => {
    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 70);
  };

  // PASO 1 -> PASO 2: "Confirmar Pedido"
  // Proceso Ultra Rápido sin esperas: genera número y pasa a la pantalla de inmediato
  // IMPORTANTE: NO elimina el carrito aquí para que el cliente pueda regresar a la tienda si lo desea.
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!nombre.trim()) errors.nombre = 'El nombre completo es requerido';
    if (!telefono.trim()) errors.telefono = 'El teléfono o WhatsApp es requerido';

    if (tipoEntrega === 'delivery') {
      if (courier === 'Servientrega' && servientregaModalidad === 'domicilio') {
        if (!direccion.trim()) {
          errors.direccion = 'Ingresa la dirección para la entrega en tu casa';
        }
      } else {
        if (!sucursalRetiro.trim()) {
          const def =
            courier === 'Servientrega'
              ? currentServientregaBranches[0]?.branch
              : courier === 'Ferguson'
              ? currentFergusonBranches[0]?.branch
              : currentUnoExpressBranches[0]?.branch;
          setSucursalRetiro(def || `Agencia Principal (${provincia})`);
        }
      }
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmissionError(null);
    setIsSubmitting(true);

    const branchClean =
      sucursalRetiro.trim() ||
      (courier === 'Servientrega'
        ? currentServientregaBranches[0]?.branch
        : courier === 'Ferguson'
        ? currentFergusonBranches[0]?.branch
        : currentUnoExpressBranches[0]?.branch) ||
      `Agencia Principal (${provincia})`;

    const resolvedAddress =
      tipoEntrega === 'retiro'
        ? 'Retiro en el Local / Tienda física (Pretty Store)'
        : (courier === 'Servientrega' && servientregaModalidad === 'domicilio')
          ? (direccion.trim() || `Entrega a Domicilio (${provincia})`)
          : `Sucursal de envío (${courier}): ${branchClean} (${provincia})`;

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
      shipping: numericalShipping,
      total: finalTotal,
      itemCount: items.reduce((acc, i) => acc + i.quantity, 0),
      items: [...items],
      notas: notas.trim() || undefined,
    };

    // 1. Mostrar de inmediato la Hojita de Revisión del Pedido antes de proceder al pago
    // ¡EL CARRITO NO SE ELIMINA AQUÍ! Se mantiene para que pueda regresar libremente.
    setConfirmedOrder(instantSummary);
    setCheckoutStep('review');
    setIsSubmitting(false);

    // Guardar borrador del pedido en el almacén local para la sesión
    saveOrderReceipt({
      orderId: instantSummary.orderId,
      orderNumber: instantSummary.orderNumber,
      date: instantSummary.date,
      nombre: instantSummary.nombre,
      telefono: instantSummary.telefono,
      email: instantSummary.email,
      direccion: instantSummary.direccion,
      metodoPago: instantSummary.metodoPago,
      tipoEntrega: instantSummary.tipoEntrega,
      courier: instantSummary.courier,
      subtotal: instantSummary.subtotal,
      discount: instantSummary.discount,
      promoTitle: instantSummary.promoTitle,
      shipping: instantSummary.shipping,
      total: instantSummary.total,
      itemCount: instantSummary.itemCount,
      items: (instantSummary.items || []).map((it) => ({
        product: {
          id: it.product.id,
          nombre: it.product.nombre,
          precio: it.product.precio,
          imagen_url: it.product.imagen_url || undefined,
        },
        quantity: it.quantity,
        subtotal: it.subtotal,
      })),
      notas: instantSummary.notas,
      comprobanteUrl: voucherImage || null,
      comprobanteFileName: voucherFileName || null,
      createdAt: new Date().toISOString(),
    });
  };

  // PASO 3 -> PASO 4: "Confirmar Pedido" después de subir comprobante (OBLIGATORIO)
  const handleFinalOrderConfirmation = async () => {
    if (!voucherImage) {
      alert('Debes ingresar la captura de tu comprobante de pago para continuar.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const orderNum = String(
        confirmedOrder?.orderNumber ||
        `#PED-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      );

      // 1. SUBIR LA CAPTURA AL STORAGE DE SUPABASE ('comprobantes' / 'product-images')
      let publicVoucherUrl = voucherImage;
      try {
        const uploadRes = await uploadVoucherToSupabaseStorage(
          voucherRawFile || voucherImage,
          voucherFileName || 'comprobante.jpg',
          orderNum
        );
        if (uploadRes.url) {
          publicVoucherUrl = uploadRes.url;
        }
      } catch (uploadErr) {
        console.warn('[Storage] Error al subir captura a Supabase Storage, usando dataURL:', uploadErr);
      }

      setVoucherImage(publicVoucherUrl);

      const fallbackAddress =
        tipoEntrega === 'retiro'
          ? 'Retiro en el Local / Tienda física (Pretty Store)'
          : (courier === 'Servientrega' && servientregaModalidad === 'domicilio')
            ? (direccion.trim() || `Entrega a Domicilio (${provincia})`)
            : `Sucursal de envío (${courier || 'Courier'}) (${provincia})`;

      // 2. VINCULAR LA CAPTURA Y REGISTRAR EL PEDIDO EN SUPABASE
      let resolvedDbOrderId = realSupabaseOrderIdRef.current;
      let orderSavedToDb = false;

      // Si existía un ID numérico previo, intentar actualizarlo
      if (resolvedDbOrderId && !String(resolvedDbOrderId).startsWith('PED-') && !String(resolvedDbOrderId).startsWith('temp-')) {
        const updateOk = await updateOrderPaymentVoucher(resolvedDbOrderId, publicVoucherUrl);
        if (updateOk) {
          orderSavedToDb = true;
        }
      }

      // Si no existía o la actualización no se pudo aplicar (por políticas RLS), registrar el pedido en Supabase con su comprobante de pago
      if (!orderSavedToDb) {
        try {
          const realOrder = await createRealOrder({
            items,
            subtotal,
            discount,
            promoTitle: promo.promoTitle,
            shipping: numericalShipping,
            total: finalTotal,
            nombre: nombre.trim(),
            telefono: telefono.trim(),
            direccion: fallbackAddress,
            metodoPago,
            tipoEntrega,
            courier: tipoEntrega === 'delivery' ? courier : undefined,
            comprobantePago: publicVoucherUrl,
            notas: notas.trim() || undefined,
          });
          if (realOrder) {
            resolvedDbOrderId = realOrder.orderId;
            realSupabaseOrderIdRef.current = realOrder.orderId;
            orderSavedToDb = true;
          }
        } catch (dbErr) {
          console.error('[Supabase] Error al crear pedido con comprobante:', dbErr);
        }
      }

      const currentOrderSummary: CreatedOrderResult = {
        orderId: String(resolvedDbOrderId || `PED-${Date.now().toString().slice(-6)}`),
        orderNumber: orderNum,
        date:
          confirmedOrder?.date ||
          new Date().toLocaleDateString('es-PA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
        nombre: confirmedOrder?.nombre || nombre.trim(),
        telefono: confirmedOrder?.telefono || telefono.trim(),
        email: confirmedOrder?.email || `${telefono.replace(/\D/g, '')}@prettystore.com`,
        direccion: confirmedOrder?.direccion || fallbackAddress,
        metodoPago: confirmedOrder?.metodoPago || metodoPago,
        tipoEntrega: confirmedOrder?.tipoEntrega || tipoEntrega,
        courier: confirmedOrder?.courier || (tipoEntrega === 'delivery' ? courier : undefined),
        subtotal: confirmedOrder?.subtotal ?? subtotal,
        discount: confirmedOrder?.discount ?? discount,
        promoTitle: confirmedOrder?.promoTitle || promo.promoTitle,
        shipping: confirmedOrder?.shipping ?? numericalShipping,
        total: confirmedOrder?.total ?? finalTotal,
        itemCount: confirmedOrder?.itemCount ?? items.reduce((acc, i) => acc + i.quantity, 0),
        items: confirmedOrder?.items && confirmedOrder.items.length > 0 ? confirmedOrder.items : items,
        notas: confirmedOrder?.notas || notas.trim() || undefined,
        comprobantePago: publicVoucherUrl,
      };

      // 3. Guardar recibo completo con la captura del comprobante en el almacén persistente
      const receiptToSave: StoredOrderReceipt = {
        orderId: currentOrderSummary.orderId,
        orderNumber: currentOrderSummary.orderNumber,
        date: currentOrderSummary.date,
        nombre: currentOrderSummary.nombre,
        telefono: currentOrderSummary.telefono,
        email: currentOrderSummary.email,
        direccion: currentOrderSummary.direccion,
        metodoPago: currentOrderSummary.metodoPago,
        tipoEntrega: currentOrderSummary.tipoEntrega,
        courier: currentOrderSummary.courier,
        subtotal: currentOrderSummary.subtotal,
        discount: currentOrderSummary.discount,
        promoTitle: currentOrderSummary.promoTitle,
        shipping: currentOrderSummary.shipping,
        total: currentOrderSummary.total,
        itemCount: currentOrderSummary.itemCount,
        items: (currentOrderSummary.items || items).map((it) => ({
          product: {
            id: it.product.id,
            nombre: it.product.nombre,
            precio: it.product.precio,
            imagen_url: it.product.imagen_url || undefined,
          },
          quantity: it.quantity,
          subtotal: it.subtotal,
        })),
        notas: currentOrderSummary.notas,
        comprobanteUrl: publicVoucherUrl,
        comprobanteFileName: voucherFileName || 'comprobante_pago.jpg',
        createdAt: new Date().toISOString(),
      };

      saveOrderReceipt(receiptToSave);
      saveVoucherImageToDb(String(receiptToSave.orderId), publicVoucherUrl, voucherFileName || 'comprobante_pago.jpg');
      saveVoucherImageToDb(String(receiptToSave.orderNumber), publicVoucherUrl, voucherFileName || 'comprobante_pago.jpg');
      updateOrderVoucher(String(receiptToSave.orderId), publicVoucherUrl, voucherFileName || 'comprobante_pago.jpg');
      updateOrderVoucher(String(receiptToSave.orderNumber), publicVoucherUrl, voucherFileName || 'comprobante_pago.jpg');

      setConfirmedOrder(currentOrderSummary);
      setCheckoutStep('receipt');
    } catch (err) {
      console.error('Error confirming order:', err);
      setCheckoutStep('receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generador del mensaje oficial de WhatsApp:
  // 1° Comprobante de pago arriba
  // 2° Detalle del pedido completo debajo
  const generateWhatsAppMessageText = () => {
    const orderNum = confirmedOrder?.orderNumber || '#PEDIDO';
    const paymentLabel =
      metodoPago === 'yappy'
        ? 'Yappy (6215-0251)'
        : metodoPago === 'transferencia'
        ? 'Transferencia Bancaria (Banco General)'
        : 'Tarjeta de Débito o Crédito';

    let entregaLabel = '';
    if (tipoEntrega === 'retiro') {
      entregaLabel = 'Retiro en el Local / Tienda física';
    } else {
      entregaLabel = `Envío express (${courier}) en ${provincia}`;
      if (courier === 'Servientrega' && servientregaModalidad === 'domicilio') {
        entregaLabel += ` - A Domicilio: ${direccion}`;
      } else {
        entregaLabel += ` - Sucursal: ${sucursalRetiro}`;
      }
    }

    const itemsText = (confirmedOrder?.items || items)
      .map((it) => `  • ${it.product.nombre} (Cant: ${it.quantity} × $${it.product.precio.toFixed(2)})`)
      .join('\n');

    const shippingLine =
      confirmedOrder?.shipping && confirmedOrder.shipping > 0
        ? `*Envío (${confirmedOrder.courier || courier}):* $${confirmedOrder.shipping.toFixed(2)} USD`
        : '*Envío:* Gratis (Retiro en tienda)';

    const totalToPay = (confirmedOrder?.total || finalTotal).toFixed(2);
    const effectiveVoucherUrl = confirmedOrder?.comprobantePago || voucherImage || '';
    const hasVoucherUrl = Boolean(effectiveVoucherUrl && effectiveVoucherUrl.startsWith('http'));

    // 1° FOTO DEL COMPROBANTE ARRIBA (para que WhatsApp muestre la tarjeta/vista previa con la foto arriba)
    // 2° DETALLE DE LO QUE PIDIÓ EL CLIENTE ABAJO
    let message = '';
    if (hasVoucherUrl) {
      message += `📸 *FOTO DEL COMPROBANTE DE PAGO:*\n${effectiveVoucherUrl}\n\n`;
    }

    message += `🛍️ *PEDIDO OFICIAL (${orderNum}) - PRETTY STORE*

🧾 *DATOS DEL PAGO:*
• *Estado:* Pago realizado y verificado por el cliente
• *Método:* ${paymentLabel}
• *Monto Cancelado:* $${totalToPay} USD
${voucherFileName ? `• *Archivo:* ${voucherFileName}\n` : ''}
📋 *LO QUE PEDÍ (DETALLE DEL PEDIDO):*
*Cliente:* ${nombre.trim()}
*Teléfono:* ${telefono.trim()}
*Modalidad:* ${entregaLabel}

*Productos Solicitados:*
${itemsText}

*Subtotal:* $${(confirmedOrder?.subtotal || subtotal).toFixed(2)} USD
${(confirmedOrder?.discount || discount) > 0 ? `*Descuento Promocional:* -$${(confirmedOrder?.discount || discount).toFixed(2)} USD\n` : ''}${shippingLine}
*Total Oficial Pagado:* $${totalToPay} USD

_Enviado desde Pretty Store Oficial_`;

    return message;
  };

  // URL directa de WhatsApp oficial para abrir directamente en la app
  const generateWhatsAppUrl = () => {
    const msg = generateWhatsAppMessageText();
    return `https://api.whatsapp.com/send?phone=${WHATSAPP_ORDERS_PHONE}&text=${encodeURIComponent(msg)}`;
  };

  // Redirección inmediata a WhatsApp (sin menú de compartir y sin usar el portapapeles)
  const handleSendToWhatsApp = () => {
    setIsSendingWhatsApp(true);
    setHasOpenedWhatsApp(true);

    const rawUrl = generateWhatsAppUrl();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // En dispositivos móviles se redirige directamente a la app de WhatsApp de una vez
      window.location.href = rawUrl;
    } else {
      // En computadoras se abre la ventana directa de WhatsApp Web
      window.open(rawUrl, '_blank', 'noopener,noreferrer');
    }

    setTimeout(() => {
      setIsSendingWhatsApp(false);
    }, 1500);
  };

  const handleReturnToStore = () => {
    if (checkoutStep === 'receipt') {
      clearCart();
      resetCheckout();
      setIsCheckoutOpen(false);
      return;
    }
    setIsCheckoutOpen(false);
  };

  // CERRAR PEDIDO (Finaliza el pedido, vacía el carrito y reinicia para el siguiente)
  const handleCloseOrder = () => {
    clearCart();
    resetCheckout();
    setIsCheckoutOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#09090b] border border-white/10 rounded-2xl w-full max-w-full sm:max-w-2xl lg:max-w-3xl max-h-[94dvh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative overscroll-contain">
        {/* Header Bar */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] shadow-sm shadow-[#fbbf24]/50" />
            <span className="text-xs uppercase tracking-[0.2em] text-[#fbbf24] font-bold truncate">
              {checkoutStep === 'form' && 'Pretty Store · Datos del Pedido'}
              {checkoutStep === 'review' && 'Pretty Store · Revisión del Pedido'}
              {checkoutStep === 'payment' && 'Pretty Store · Pago y Comprobante'}
              {checkoutStep === 'receipt' && 'Pretty Store · Recibo Oficial'}
            </span>
          </div>
          <button
            onClick={handleReturnToStore}
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar sin borrar carrito"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PASO 1: FORMULARIO BÁSICO (ENTREGA, CLIENTE, COURIER CON TARIFAS, PAGO) */}
        {/* ========================================================================= */}
        {checkoutStep === 'form' && (
          <div className="overflow-y-auto overscroll-contain touch-scroll p-4 sm:p-6 lg:p-7 space-y-6 pb-8 sm:pb-6">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoEntrega('retiro');
                      scrollToNextOption('checkout-cliente-section');
                    }}
                    className={`p-3.5 border text-left cursor-pointer transition-all flex items-center gap-3 rounded-xl min-h-[56px] active:scale-[0.98] ${
                      tipoEntrega === 'retiro'
                        ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-2 ring-[#fbbf24]'
                        : 'border-white/10 bg-stone-900/40 text-stone-400 hover:border-white/20'
                    }`}
                  >
                    <Store size={22} className={tipoEntrega === 'retiro' ? 'text-[#fbbf24]' : 'text-stone-400'} />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white">Retirar en el Local</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTipoEntrega('delivery');
                      scrollToNextOption('checkout-courier-section');
                    }}
                    className={`p-3.5 border text-left cursor-pointer transition-all flex items-center gap-3 rounded-xl min-h-[56px] active:scale-[0.98] ${
                      tipoEntrega === 'delivery'
                        ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-2 ring-[#fbbf24]'
                        : 'border-white/10 bg-stone-900/40 text-stone-400 hover:border-white/20'
                    }`}
                  >
                    <Truck size={22} className={tipoEntrega === 'delivery' ? 'text-[#fbbf24]' : 'text-stone-400'} />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white">Envío express</p>
                      <p className="text-[10px] sm:text-xs text-stone-400">Servientrega / Ferguson / UnoExpress</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Si es Envío express: Selección de Courier, Provincia y Sucursal con Tarifas */}
              {tipoEntrega === 'delivery' && (
                <div id="checkout-courier-section" className="p-4 rounded-xl bg-stone-900/60 border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="text-xs uppercase tracking-wider text-stone-200 font-bold block">
                      Selecciona tu Envío *
                    </label>
                    <span className="text-[10px] text-[#fbbf24] font-medium">
                      * El envío se suma automáticamente al total
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* #1 Servientrega: Tiene 2 precios (sucursal y casa) */}
                    <button
                      type="button"
                      onClick={() => {
                        setCourier('Servientrega');
                        const def = SERVIENTREGA_SUCURSALES[provincia]?.[0]?.branch || 'La Chorrera (Av. de las Américas)';
                        setSucursalRetiro(def);
                        scrollToNextOption('checkout-servientrega-mode');
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
                        courier === 'Servientrega'
                          ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-2 ring-[#fbbf24]'
                          : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs sm:text-sm text-white">1. Servientrega</span>
                        {courier === 'Servientrega' && <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />}
                      </div>
                      <span className="text-[11px] text-emerald-400 font-mono block mt-1 font-semibold">
                        Desde $3.25 (Sucursal / Casa)
                      </span>
                    </button>

                    {/* #2 Ferguson: 1 solo precio según sucursal */}
                    <button
                      type="button"
                      onClick={() => {
                        setCourier('Ferguson');
                        const def = FERGUSON_SUCURSALES[provincia]?.[0]?.branch || 'La Chorrera (Parque Feuillet)';
                        setSucursalRetiro(def);
                        scrollToNextOption('checkout-provincia-section');
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
                        courier === 'Ferguson'
                          ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-2 ring-[#fbbf24]'
                          : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs sm:text-sm text-white">2. Ferguson</span>
                        {courier === 'Ferguson' && <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />}
                      </div>
                      <span className="text-[11px] text-[#fbbf24] font-mono block mt-1 font-semibold">
                        Desde $5.00 aprox.
                      </span>
                    </button>

                    {/* #3 UnoExpress: 1 solo precio según sucursal */}
                    <button
                      type="button"
                      onClick={() => {
                        setCourier('Uno Express');
                        const def = UNO_EXPRESS_SUCURSALES[provincia]?.[0]?.branch || 'La Chorrera (Plaza Italia)';
                        setSucursalRetiro(def);
                        scrollToNextOption('checkout-provincia-section');
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
                        courier === 'Uno Express'
                          ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-2 ring-[#fbbf24]'
                          : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs sm:text-sm text-white">3. UnoExpress</span>
                        {courier === 'Uno Express' && <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />}
                      </div>
                      <span className="text-[11px] text-[#fbbf24] font-mono block mt-1 font-semibold">
                        Desde $6.50 aprox.
                      </span>
                    </button>
                  </div>

                  {/* Modalidad Servientrega: Explicación de los 2 Números (1er número a la sucursal, 2do número a la casa) */}
                  {courier === 'Servientrega' && (
                    <div id="checkout-servientrega-mode" className="space-y-2 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-stone-200 font-semibold">
                          Modalidad Servientrega:
                        </label>
                        <span className="text-[10px] text-[#fbbf24] font-mono">
                          1° Sucursal vs 2° A Casa
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setServientregaModalidad('sucursal');
                            scrollToNextOption('checkout-provincia-section');
                          }}
                          className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex flex-col items-center justify-center gap-1 active:scale-[0.98] ${
                            servientregaModalidad === 'sucursal'
                              ? 'border-[#fbbf24] bg-[#fbbf24]/20 text-white ring-1 ring-[#fbbf24]'
                              : 'border-white/10 bg-stone-900 text-stone-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Store size={15} className="text-[#fbbf24]" />
                            <span className="font-bold">Envío a la Sucursal</span>
                          </div>
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">
                            1° Tarifa (desde $3.25 / $3.86)
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setServientregaModalidad('domicilio');
                            scrollToNextOption('checkout-provincia-section');
                          }}
                          className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex flex-col items-center justify-center gap-1 active:scale-[0.98] ${
                            servientregaModalidad === 'domicilio'
                              ? 'border-[#fbbf24] bg-[#fbbf24]/20 text-white ring-1 ring-[#fbbf24]'
                              : 'border-white/10 bg-stone-900 text-stone-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Home size={15} className="text-[#fbbf24]" />
                            <span className="font-bold">Envío a la Casa</span>
                          </div>
                          <span className="text-[11px] font-mono text-amber-300 font-bold">
                            2° Tarifa (desde $5.61 / $5.79)
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Selector de Provincias */}
                  <div id="checkout-provincia-section" className="space-y-2">
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
                              if (courier === 'Servientrega') {
                                const list = SERVIENTREGA_SUCURSALES[p.id];
                                if (list && list[0]) setSucursalRetiro(list[0].branch);
                              } else if (courier === 'Ferguson') {
                                const list = FERGUSON_SUCURSALES[p.id];
                                if (list && list[0]) setSucursalRetiro(list[0].branch);
                              } else {
                                const list = UNO_EXPRESS_SUCURSALES[p.id];
                                if (list && list[0]) setSucursalRetiro(list[0].branch);
                              }
                              if (courier === 'Servientrega' && servientregaModalidad === 'domicilio') {
                                scrollToNextOption('checkout-domicilio-address');
                              } else {
                                scrollToNextOption('checkout-sucursales-list');
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all active:scale-[0.98] ${
                              isSelected
                                ? 'border-[#fbbf24] bg-[#fbbf24]/20 text-white font-bold'
                                : 'border-white/10 bg-black/40 text-stone-400 hover:text-white'
                            }`}
                          >
                            <span>{p.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sucursales con tarifas correspondientes */}
                  {courier === 'Servientrega' && servientregaModalidad === 'domicilio' ? (
                    <div id="checkout-domicilio-address" className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-stone-300 font-medium block">
                          Dirección exacta de entrega a domicilio: *
                        </label>
                        <span className="text-xs text-amber-300 font-mono font-bold">
                          Envío Casa: {activeServientregaRate}
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="Barriada, calle, número de casa/apto en Panamá..."
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        className="w-full px-3.5 py-3 bg-black/60 border border-white/10 rounded-xl text-sm sm:text-xs text-white focus:outline-none focus:border-[#fbbf24]"
                      />
                      <p className="text-[10px] text-stone-400 font-light">
                        Tarifa de entrega a domicilio sumada al pedido: <strong>{activeServientregaRate}</strong> (depende del producto).
                      </p>
                    </div>
                  ) : courier === 'Servientrega' ? (
                    <div id="checkout-sucursales-list" className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-stone-300 font-medium">
                          Sucursal de Servientrega en {provincia}:
                        </label>
                        <span className="text-xs text-emerald-400 font-mono font-bold">
                          Envío Sucursal: {activeServientregaRate}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto overscroll-contain pr-1">
                        {currentServientregaBranches.map((b) => {
                          const isSel = sucursalRetiro === b.branch;
                          return (
                            <button
                              key={b.branch}
                              type="button"
                              onClick={() => {
                                setSucursalRetiro(b.branch);
                                scrollToNextOption('checkout-cliente-section');
                              }}
                              className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 cursor-pointer active:scale-[0.98] ${
                                isSel
                                  ? 'border-[#fbbf24] bg-[#fbbf24]/20 text-white ring-1 ring-[#fbbf24]'
                                  : 'border-white/10 bg-black/50 text-stone-300 hover:border-white/25'
                              }`}
                            >
                              <span className="font-medium truncate">{b.branch}</span>
                              <div className="text-right shrink-0">
                                <span className="text-[11px] font-mono text-emerald-400 font-bold block">
                                  {b.branchRate}
                                </span>
                                <span className="text-[9px] text-stone-400 block">
                                  Casa: {b.homeRate}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : courier === 'Ferguson' ? (
                    <div id="checkout-sucursales-list" className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-stone-300 font-medium">
                          Sucursal de Ferguson en {provincia}:
                        </label>
                        <span className="text-xs text-[#fbbf24] font-mono font-bold">
                          Envío Sucursal: {activeSingleRate}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto overscroll-contain pr-1">
                        {currentFergusonBranches.map((b) => {
                          const isSel = sucursalRetiro === b.branch;
                          return (
                            <button
                              key={b.branch}
                              type="button"
                              onClick={() => {
                                setSucursalRetiro(b.branch);
                                scrollToNextOption('checkout-cliente-section');
                              }}
                              className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 cursor-pointer active:scale-[0.98] ${
                                isSel
                                  ? 'border-[#fbbf24] bg-[#fbbf24]/20 text-white ring-1 ring-[#fbbf24]'
                                  : 'border-white/10 bg-black/50 text-stone-300 hover:border-white/25'
                              }`}
                            >
                              <span className="font-medium truncate">{b.branch}</span>
                              <span className="text-xs font-mono text-[#fbbf24] shrink-0 font-bold">
                                {b.rate}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div id="checkout-sucursales-list" className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-stone-300 font-medium">
                          Sucursal de UnoExpress en {provincia}:
                        </label>
                        <span className="text-xs text-[#fbbf24] font-mono font-bold">
                          Envío Sucursal: {activeSingleRate}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto overscroll-contain pr-1">
                        {currentUnoExpressBranches.map((b) => {
                          const isSel = sucursalRetiro === b.branch;
                          return (
                            <button
                              key={b.branch}
                              type="button"
                              onClick={() => {
                                setSucursalRetiro(b.branch);
                                scrollToNextOption('checkout-cliente-section');
                              }}
                              className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 cursor-pointer active:scale-[0.98] ${
                                isSel
                                  ? 'border-[#fbbf24] bg-[#fbbf24]/20 text-white ring-1 ring-[#fbbf24]'
                                  : 'border-white/10 bg-black/50 text-stone-300 hover:border-white/25'
                              }`}
                            >
                              <span className="font-medium truncate">{b.branch}</span>
                              <span className="text-xs font-mono text-[#fbbf24] shrink-0 font-bold">
                                {b.rate}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* AVISO CLARO: MONTO ESTIMADO DE ENVÍO */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                    <span className="text-amber-400 shrink-0 text-sm">⚠️</span>
                    <p className="text-[11px] leading-relaxed">
                      <strong>Aviso de Envío:</strong> Los ${numericalShipping > 0 ? numericalShipping.toFixed(2) : '3.86'} USD corresponden a un monto estimado de envío y se suman al total al pagar. El costo final lo determina la empresa transportadora. Si existe alguna diferencia, te notificaremos por WhatsApp el monto pendiente antes de realizar el envío.
                    </p>
                  </div>
                </div>
              )}

              {/* 2. Datos del Cliente */}
              <div id="checkout-cliente-section" className="space-y-3">
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
                      className={`w-full px-3.5 py-3 bg-stone-900/60 border text-sm sm:text-xs text-white placeholder-stone-600 focus:outline-none rounded-xl ${
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
                      className={`w-full px-3.5 py-3 bg-stone-900/60 border text-sm sm:text-xs text-white placeholder-stone-600 focus:outline-none rounded-xl ${
                        formErrors.telefono ? 'border-rose-500' : 'border-white/10 focus:border-[#fbbf24]'
                      }`}
                    />
                    {formErrors.telefono && <p className="text-[10px] text-rose-400">{formErrors.telefono}</p>}
                  </div>
                </div>
              </div>

              {/* 3. Selección del Método de Pago deseado (SOLO TARJETA DE DÉBITO O CRÉDITO - SIN PAGUELOFACIL) */}
              <div id="checkout-pago-section" className="space-y-3">
                <label className="text-xs uppercase tracking-[0.16em] text-white font-bold block">
                  3. Selecciona tu Método de Pago *
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMetodoPago('yappy');
                      scrollToNextOption('checkout-resumen-section');
                    }}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all active:scale-[0.98] ${
                      metodoPago === 'yappy'
                        ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-1 ring-[#fbbf24]'
                        : 'border-white/10 bg-black/40 text-stone-400 hover:text-white'
                    }`}
                  >
                    <Smartphone size={20} className="mx-auto text-[#fbbf24]" />
                    <span className="text-xs sm:text-sm font-bold block mt-1">Yappy</span>
                    <span className="text-[9px] text-stone-400 font-mono">6215-0251</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMetodoPago('transferencia');
                      scrollToNextOption('checkout-resumen-section');
                    }}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all active:scale-[0.98] ${
                      metodoPago === 'transferencia'
                        ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-1 ring-[#fbbf24]'
                        : 'border-white/10 bg-black/40 text-stone-400 hover:text-white'
                    }`}
                  >
                    <Landmark size={20} className="mx-auto text-[#fbbf24]" />
                    <span className="text-xs sm:text-sm font-bold block mt-1">Banco General</span>
                    <span className="text-[9px] text-stone-400 font-mono">ACH</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMetodoPago('tarjeta');
                      scrollToNextOption('checkout-resumen-section');
                    }}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all active:scale-[0.98] ${
                      metodoPago === 'tarjeta'
                        ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-1 ring-[#fbbf24]'
                        : 'border-white/10 bg-black/40 text-stone-400 hover:text-white'
                    }`}
                  >
                    <CreditCard size={20} className="mx-auto text-[#fbbf24]" />
                    <span className="text-xs sm:text-sm font-bold block mt-1 leading-tight">Tarjeta</span>
                    <span className="text-[9px] text-stone-300 font-medium">Débito o Crédito</span>
                  </button>
                </div>
              </div>

              {/* Resumen de compra: subtotal, descuento, ENVÍO SUMADO y total */}
              <div id="checkout-resumen-section" className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal productos:</span>
                  <span className="font-mono text-white">${subtotal.toFixed(2)} USD</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>{promo.promoTitle || 'Descuento Promocional'}:</span>
                    <span className="font-mono">-${discount.toFixed(2)} USD</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-300">
                  <span>
                    {tipoEntrega === 'retiro'
                      ? 'Retiro en el local:'
                      : `Costo estimado de envío (${courier}${courier === 'Servientrega' ? (servientregaModalidad === 'domicilio' ? ' a Casa' : ' a Sucursal') : ''}):`}
                  </span>
                  <span className="font-mono text-[#fbbf24] font-bold">
                    {tipoEntrega === 'retiro'
                      ? 'Gratis ($0.00)'
                      : `+$${numericalShipping.toFixed(2)} USD`}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                  <span className="text-white">Total a Pagar (con envío):</span>
                  <span className="text-xl sm:text-2xl font-mono text-[#fbbf24]">
                    ${finalTotal.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Botón para continuar a la revisión del pedido */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#f59e0b] hover:to-[#fbbf24] text-black font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xl shadow-[#fbbf24]/20 active:scale-[0.99] min-h-[48px]"
                >
                  <span>Continuar</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: HOJITA / PAPEL DE REVISIÓN OFICIAL DEL PEDIDO ANTES DE IR A PAGAR */}
        {/* ========================================================================= */}
        {checkoutStep === 'review' && confirmedOrder && (
          <div className="overflow-y-auto overscroll-contain touch-scroll p-4 sm:p-6 lg:p-7 space-y-6 pb-8 sm:pb-6">
            {/* Contenedor tipo Papel / Hojita de Factura Elegante */}
            <div className="bg-[#121216] border border-[#fbbf24]/30 rounded-2xl p-5 sm:p-7 space-y-6 shadow-2xl relative text-left">
              {/* Encabezado de la Hojita */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
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
                    <h2 className="text-lg sm:text-xl font-serif-luxury font-black text-white tracking-wider">
                      PRETTY STORE
                    </h2>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-[#fbbf24] font-semibold">
                      Almacén y accesorio urbano · Panamá
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 block font-semibold">
                    REVISIÓN DEL PEDIDO
                  </span>
                  <span className="font-mono font-bold text-[#fbbf24] text-base sm:text-lg block">
                    #{confirmedOrder.orderNumber}
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">
                    {confirmedOrder.date}
                  </span>
                </div>
              </div>

              {/* Datos del Cliente y Logística de Entrega */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#fbbf24] font-bold block">
                    Datos del Cliente
                  </span>
                  <p className="text-white font-medium text-sm">{confirmedOrder.nombre}</p>
                  <p className="text-stone-300 font-mono">WhatsApp: {confirmedOrder.telefono}</p>
                  <p className="text-stone-400 text-[11px]">
                    Método de pago:{' '}
                    <strong className="text-white uppercase font-mono">
                      {confirmedOrder.metodoPago === 'yappy'
                        ? 'Yappy (6215-0251)'
                        : confirmedOrder.metodoPago === 'transferencia'
                        ? 'Banco General (ACH)'
                        : 'Tarjeta Débito o Crédito'}
                    </strong>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#fbbf24] font-bold block flex items-center gap-1.5">
                    <Truck size={13} className="text-[#fbbf24]" />
                    <span>Entrega y Destino</span>
                  </span>
                  <p className="text-white font-medium">
                    {confirmedOrder.tipoEntrega === 'retiro'
                      ? 'Retiro en Tienda Física (Costa del Este)'
                      : `Envío Express vía ${confirmedOrder.courier || courier}`}
                  </p>
                  <p className="text-stone-300 text-[11px] leading-relaxed">
                    {confirmedOrder.direccion}
                  </p>
                  {confirmedOrder.notas && (
                    <p className="text-[#fbbf24] text-[11px] font-mono pt-1 border-t border-white/5">
                      Nota: {confirmedOrder.notas}
                    </p>
                  )}
                </div>
              </div>

              {/* Lista de Productos con Imagen */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                  <span className="font-bold text-[#fbbf24] uppercase tracking-wider">
                    Productos Seleccionados ({(confirmedOrder.items || items).reduce((acc, i) => acc + i.quantity, 0)} unidades)
                  </span>
                  <span className="text-stone-400 font-mono text-[11px]">Detalle</span>
                </div>

                <div className="space-y-2.5">
                  {(confirmedOrder.items && confirmedOrder.items.length > 0 ? confirmedOrder.items : items).map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={it.product.imagen_url || '/images/products/gorra-1.webp'}
                          alt={it.product.nombre}
                          className="w-12 h-12 rounded-xl object-cover bg-stone-900 border border-white/15 shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.endsWith('/images/products/gorra-1.webp')) {
                              target.src = '/images/products/gorra-1.webp';
                            }
                          }}
                        />
                        <div className="min-w-0">
                          <h4 className="font-semibold text-white text-xs sm:text-sm truncate">
                            {it.product.nombre}
                          </h4>
                          <p className="text-[11px] text-stone-400 mt-0.5">
                            Cant: <strong className="text-stone-200 font-mono">{it.quantity}x</strong> a ${it.product.precio.toFixed(2)} USD c/u
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-sm text-[#fbbf24] shrink-0">
                        ${(it.subtotal || it.quantity * it.product.precio).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desglose Financiero */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal productos:</span>
                  <span className="font-mono text-white">${(confirmedOrder.subtotal || subtotal).toFixed(2)} USD</span>
                </div>
                {(confirmedOrder.discount || discount) > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>{confirmedOrder.promoTitle || promo.promoTitle || 'Descuento Promocional'}:</span>
                    <span className="font-mono">-${(confirmedOrder.discount || discount).toFixed(2)} USD</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-300">
                  <span>
                    {confirmedOrder.tipoEntrega === 'retiro'
                      ? 'Retiro en tienda física:'
                      : `Costo estimado de envío (${confirmedOrder.courier || courier}):`}
                  </span>
                  <span className="font-mono text-[#fbbf24] font-bold">
                    {confirmedOrder.tipoEntrega === 'retiro' || (confirmedOrder.shipping === 0)
                      ? 'Gratis ($0.00)'
                      : `+$${(confirmedOrder.shipping || numericalShipping).toFixed(2)} USD`}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                  <span className="text-white">Total a Pagar (con envío):</span>
                  <span className="text-xl sm:text-2xl font-mono text-[#fbbf24]">
                    ${(confirmedOrder.total || finalTotal).toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Aviso amigable */}
              <p className="text-[11px] text-stone-400 text-center font-light">
                Verifica que tus datos y artículos sean correctos. Al pulsar <strong className="text-white">"Ir a pagar"</strong> podrás ver los números de cuenta oficiales y adjuntar tu comprobante de pago.
              </p>

              {/* Botones de Acción */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('form')}
                  className="px-4 sm:px-5 py-3.5 rounded-xl border border-white/20 text-stone-300 hover:text-white hover:bg-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[48px]"
                >
                  <ArrowLeft size={16} />
                  <span>Modificar datos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutStep('payment')}
                  className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#f59e0b] hover:to-[#fbbf24] text-black font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-[#fbbf24]/20 active:scale-[0.99] min-h-[48px]"
                >
                  <span>Ir a pagar</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 3: DE PRIMERO EL NÚMERO DE PAGO (YAPPY, TARJETA O BANCO)              */}
        {/*         Y DESPUÉS MONTA EL COMPROBANTE Y CONFIRMAR COMPROBANTE             */}
        {/* ========================================================================= */}
        {checkoutStep === 'payment' && confirmedOrder && (
          <div className="overflow-y-auto overscroll-contain touch-scroll p-4 sm:p-6 lg:p-7 space-y-5 pb-8 sm:pb-6">
            {/* Recordatorio de pedido y monto */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-stone-900/80 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Pedido</span>
                <span className="font-mono font-bold text-[#fbbf24] text-base sm:text-lg">#{confirmedOrder.orderNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Total a Cancelar (con envío)</span>
                <span className="font-mono font-bold text-white text-base sm:text-lg">${confirmedOrder.total.toFixed(2)} USD</span>
              </div>
            </div>

            {/* 1. DE PRIMERO: NÚMERO DE YAPPY, TRANSFERENCIA O LINK DE TARJETA SEGÚN EL MÉTODO ELEGIDO */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#121216] border border-white/15 space-y-4 shadow-xl text-left">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
                    <span>Datos para realizar el pago</span>
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {metodoPago === 'yappy' && 'Realiza tu pago vía Yappy con el siguiente número:'}
                    {metodoPago === 'tarjeta' && 'Realiza tu pago en el enlace oficial con Tarjeta de Débito o Crédito:'}
                    {metodoPago === 'transferencia' && 'Realiza tu transferencia bancaria a la siguiente cuenta:'}
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
                    <span className="text-[11px] text-[#fbbf24] font-medium block pt-0.5">
                      Monto a enviar: <strong>${confirmedOrder.total.toFixed(2)} USD</strong> (incluye envío)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyYappyNumber(YAPPY_PAY_PHONE)}
                    className="px-5 py-3 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-lg shadow-[#fbbf24]/30 min-h-[46px] active:scale-[0.98]"
                  >
                    {copiedYappy ? <Check size={18} /> : <Copy size={18} />}
                    <span>{copiedYappy ? '¡Copiado!' : 'Copiar Número'}</span>
                  </button>
                </div>
              )}

              {/* Si agarró Tarjeta: aparece el link oficial (SOLO TARJETA DE DÉBITO O CRÉDITO - SIN PAGUELOFACIL) */}
              {metodoPago === 'tarjeta' && (
                <div className="p-4 rounded-xl bg-black/90 border border-[#fbbf24]/40 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-stone-400 uppercase tracking-wider block font-semibold">
                      Link de Pago Seguro (Tarjeta de Débito o Crédito - Visa, Mastercard, Clave):
                    </span>
                    <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 font-mono text-xs text-stone-300 break-all select-all">
                      {TARJETA_PAY_LINK}
                    </div>
                    <span className="text-[11px] text-[#fbbf24] font-medium block pt-0.5">
                      Monto a pagar con tarjeta: <strong>${confirmedOrder.total.toFixed(2)} USD</strong> (incluye envío)
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <a
                      href={TARJETA_PAY_LINK}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#f59e0b] hover:to-[#fbbf24] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#fbbf24]/20 cursor-pointer min-h-[46px] active:scale-[0.98]"
                    >
                      <CreditCard size={18} />
                      <span>Ir al Link de Pago con Tarjeta</span>
                      <ExternalLink size={16} />
                    </a>
                    <button
                      type="button"
                      onClick={() => copyCardLink(TARJETA_PAY_LINK)}
                      className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[46px] active:scale-[0.98]"
                    >
                      <Copy size={16} />
                      <span>{copiedLink ? '¡Link Copiado!' : 'Copiar Link'}</span>
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
                    <span className="text-[11px] text-[#fbbf24] font-medium block pt-0.5">
                      Monto a transferir: <strong>${confirmedOrder.total.toFixed(2)} USD</strong> (incluye envío)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyBankDetails(BANCO_GENERAL_CUENTA)}
                    className="px-5 py-3 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-lg shadow-[#fbbf24]/30 min-h-[46px] active:scale-[0.98]"
                  >
                    {copiedBank ? <Check size={18} /> : <Copy size={18} />}
                    <span>{copiedBank ? '¡Copiado!' : 'Copiar Cuenta'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. DESPUÉS: "INGRESE LA CAPTURA DE SU COMPROBANTE" */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#121216] border border-white/15 space-y-3 text-left shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <label className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <UploadCloud size={18} className="text-[#fbbf24]" />
                  <span>Ingrese la captura de su comprobante *</span>
                </label>
                {isVoucherAttached ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold">
                    ✓ Comprobante Cargado
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-semibold">
                    Requerido para continuar
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-300 font-light">
                Adjunta la foto o captura de pantalla de tu pago (desde tu galería, fotos o archivos del dispositivo):
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
                      <p className="text-[11px] text-emerald-400 font-mono mt-0.5 font-semibold">
                        ✓ Captura lista para enviar
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label
                      htmlFor="payment-voucher-input"
                      className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Cambiar
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                      aria-label="Eliminar comprobante"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="payment-voucher-input"
                  className="p-5 rounded-xl border-2 border-dashed border-white/20 hover:border-[#fbbf24] bg-black/50 hover:bg-[#fbbf24]/5 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group active:scale-[0.99]"
                >
                  <UploadCloud size={30} className="text-[#fbbf24] group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-white block">
                      Toca aquí para seleccionar la captura del comprobante
                    </span>
                    <span className="text-[10px] sm:text-xs text-stone-400 block mt-0.5">
                      Adjunta la foto o captura del pago realizado
                    </span>
                  </div>
                </label>
              )}
            </div>

            {/* 3. LUEGO: "CONFIRMAR PEDIDO" (BLOQUEADO HASTA QUE MONTE EL COMPROBANTE) */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                disabled={!voucherImage || isSubmitting}
                onClick={handleFinalOrderConfirmation}
                className={`w-full py-4 px-6 rounded-xl font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl min-h-[48px] ${
                  !voucherImage
                    ? 'bg-stone-800 text-stone-500 border border-white/10 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#f59e0b] hover:to-[#fbbf24] text-black cursor-pointer shadow-[#fbbf24]/30 active:scale-[0.99]'
                }`}
              >
                {!voucherImage ? (
                  <>
                    <AlertCircle size={18} className="text-amber-400 shrink-0" />
                    <span>Adjunta la captura del comprobante para confirmar pedido</span>
                  </>
                ) : isSubmitting ? (
                  <span>Registrando pedido y generando recibo...</span>
                ) : (
                  <>
                    <span>Confirmar Pedido y Ver Recibo Oficial</span>
                    <CheckCircle2 size={20} />
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('form')}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 text-stone-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                >
                  <ArrowLeft size={14} />
                  <span>Modificar Datos</span>
                </button>

                <button
                  type="button"
                  onClick={handleReturnToStore}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 text-stone-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                >
                  <span>Regresar a la Tienda</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 4: RECIBO OFICIAL DE COMPRA, CAPTURA Y ENVÍO POR WHATSAPP */}
        {/* ========================================================================= */}
        {checkoutStep === 'receipt' && confirmedOrder && (
          <div className="overflow-y-auto overscroll-contain touch-scroll p-4 sm:p-6 lg:p-7 space-y-5 text-center pb-8 sm:pb-6">
            {/* Encabezado del Recibo */}
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono uppercase font-bold inline-flex items-center gap-1 mb-1">
                <CheckCircle2 size={12} />
                <span>Pedido Confirmado & Comprobante Guardado</span>
              </span>
              <h2 className="text-2xl sm:text-4xl font-mono font-extrabold text-[#fbbf24]">
                #{confirmedOrder.orderNumber}
              </h2>
              <p className="text-xs text-stone-300 font-light max-w-md mx-auto">
                Tu orden ha sido registrada en el sistema de Pretty Store con su factura oficial y comprobante adjunto.
              </p>
            </div>

            {/* Barra de Acciones Rápidas */}
            <div className="max-w-xl mx-auto flex items-center justify-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowFullInvoiceModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-[#fbbf24]/20 cursor-pointer active:scale-95"
              >
                <Printer size={15} />
                <span>Imprimir / Ver Factura Oficial (PDF)</span>
              </button>

              {voucherImage && (
                <button
                  type="button"
                  onClick={() => setIsZoomingVoucher(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/15"
                >
                  <ZoomIn size={14} />
                  <span>Ver Captura en Grande</span>
                </button>
              )}
            </div>

            {/* Recibo Oficial Estructurado */}
            <div className="max-w-xl mx-auto p-4 sm:p-6 rounded-2xl bg-black/90 border border-white/15 text-left space-y-4 text-xs font-sans shadow-2xl">
              {/* Header Recibo */}
              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-black border border-white/20 shrink-0">
                    <img src="/images/logo/logotipo.jpeg" alt="Pretty Store" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-serif-luxury">
                      PRETTY STORE · RECIBO OFICIAL
                    </h3>
                    <p className="text-[11px] text-[#fbbf24] font-mono">
                      #{confirmedOrder.orderNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 text-[10px] block font-mono">
                    {confirmedOrder.date || new Date().toLocaleDateString('es-PA')}
                  </span>
                  <span className="text-emerald-400 text-[10px] font-semibold">
                    Estado: Pendiente
                  </span>
                </div>
              </div>

              {/* Datos Cliente y Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-white/10 pb-3 text-xs">
                <div>
                  <span className="text-stone-400 text-[10px] uppercase tracking-wider block mb-0.5">Cliente:</span>
                  <span className="text-white font-medium block">{nombre}</span>
                  <span className="text-stone-300 font-mono text-[11px]">{telefono}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase tracking-wider block mb-0.5">Método de Pago:</span>
                  <span className="text-[#fbbf24] font-bold block capitalize">
                    {metodoPago === 'yappy'
                      ? 'Yappy (6215-0251)'
                      : metodoPago === 'transferencia'
                      ? 'Banco General (ACH 0472985946850)'
                      : 'Tarjeta de Débito o Crédito'}
                  </span>
                </div>
                <div className="col-span-1 sm:col-span-2 pt-1">
                  <span className="text-stone-400 text-[10px] uppercase tracking-wider block mb-0.5">Modalidad de Entrega:</span>
                  <span className="text-stone-200 font-medium block">
                    {tipoEntrega === 'retiro'
                      ? 'Retiro en el Local / Tienda física'
                      : `Envío express (${courier}) en ${provincia} - ${
                          courier === 'Servientrega' && servientregaModalidad === 'domicilio'
                            ? direccion
                            : sucursalRetiro
                        }`}
                  </span>
                </div>
              </div>

              {/* Productos */}
              <div className="space-y-2 border-b border-white/10 pb-3">
                <span className="text-stone-300 font-semibold block text-xs uppercase tracking-wider">
                  Detalle de Productos Comprados:
                </span>
                <div className="space-y-2">
                  {(confirmedOrder.items || items).map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {it.product.imagen_url && (
                          <img
                            src={it.product.imagen_url}
                            alt={it.product.nombre}
                            className="w-8 h-8 rounded object-cover border border-white/10 shrink-0"
                          />
                        )}
                        <span className="text-white truncate">
                          {it.product.nombre} <span className="text-stone-400 font-mono">({it.quantity}x)</span>
                        </span>
                      </div>
                      <span className="font-mono text-white font-bold shrink-0">
                        ${(it.quantity * it.product.precio).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desglose de Precios */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-300">
                  <span>Subtotal productos:</span>
                  <span className="font-mono text-white">${confirmedOrder.subtotal.toFixed(2)} USD</span>
                </div>
                {confirmedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Descuento Promo:</span>
                    <span className="font-mono">-${confirmedOrder.discount.toFixed(2)} USD</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-300">
                  <span>Envío express ({confirmedOrder.courier || courier || 'Retiro'}):</span>
                  <span className="font-mono text-[#fbbf24] font-bold">
                    {confirmedOrder.shipping > 0
                      ? `+$${confirmedOrder.shipping.toFixed(2)} USD`
                      : 'Gratis ($0.00)'}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                  <span className="text-white uppercase tracking-wider text-xs">Total de la Orden:</span>
                  <span className="text-xl font-mono text-[#fbbf24]">
                    ${confirmedOrder.total.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Captura del Comprobante Guardada */}
              {voucherImage && (
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck size={14} className="text-emerald-400" />
                      <span>Captura del Comprobante Guardada:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsZoomingVoucher(true)}
                      className="text-[10px] text-[#fbbf24] hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <ZoomIn size={12} />
                      <span>Ver en grande</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <div
                      onClick={() => setIsZoomingVoucher(true)}
                      className="relative group cursor-pointer w-14 h-14 rounded-lg overflow-hidden border border-white/20 hover:border-[#fbbf24] shrink-0 bg-stone-900"
                    >
                      <img
                        src={voucherImage}
                        alt="Comprobante"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <ZoomIn size={14} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span className="text-emerald-400 text-xs font-semibold block truncate">
                        ✓ Comprobante verificado y montado
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono truncate block">
                        {voucherFileName || 'comprobante_pago.jpg'}
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        Almacenado con el pedido #{confirmedOrder.orderNumber}
                      </span>
                    </div>
                    <a
                      href={voucherImage}
                      download={voucherFileName || `comprobante_${confirmedOrder.orderNumber}.jpg`}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white cursor-pointer"
                      title="Descargar comprobante"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* BOTÓN OFICIAL DE WHATSAPP: ENVIAR FOTO DIRECTA Y RECIBO */}
            <div className="max-w-xl mx-auto space-y-3 pt-1">
              <button
                type="button"
                onClick={handleSendToWhatsApp}
                disabled={isSendingWhatsApp}
                className="w-full py-4 px-6 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-[#25D366]/30 cursor-pointer active:scale-[0.99] min-h-[50px]"
              >
                <MessageSquare size={22} className="fill-black shrink-0" />
                <span>
                  {isSendingWhatsApp
                    ? 'Preparando envío a WhatsApp...'
                    : 'Enviar Foto y Pedido a WhatsApp'}
                </span>
              </button>

              {/* Botón secundario para descargar comprobante */}
              {voucherImage && (
                <div className="flex justify-center">
                  <a
                    href={voucherImage}
                    download={voucherFileName || `comprobante_${confirmedOrder.orderNumber}.jpg`}
                    className="py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
                  >
                    <Download size={14} className="text-stone-400 shrink-0" />
                    <span>Descargar Foto del Comprobante</span>
                  </a>
                </div>
              )}
              {/* Indicación clara de envío directo a WhatsApp */}
              <div className="p-3.5 rounded-xl bg-stone-900 border border-white/10 text-stone-300 text-xs text-left space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
                  <FileCheck size={15} className="shrink-0" />
                  <span>Redirección directa a WhatsApp oficial</span>
                </div>
                <div className="text-[11px] text-stone-400 leading-relaxed font-light space-y-1">
                  <p>
                    • Al presionar el botón se te redirige de inmediato a WhatsApp con la <strong>foto del comprobante arriba y el detalle de tu pedido abajo</strong>, listo para enviar directamente al asesor de Pretty Store.
                  </p>
                </div>
              </div>
            </div>

            {/* Aviso de 48 Horas */}
            <div className="max-w-xl mx-auto p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-200 text-xs flex items-center gap-2.5 text-left">
              <Clock size={16} className="text-amber-400 shrink-0" />
              <span className="text-[11px] text-stone-200 font-light">
                Dispones de un plazo de <strong>48 horas</strong> para coordinar tu entrega o retiro con tu comprobante.
              </span>
            </div>

            {/* Acciones finales */}
            <div className="pt-2 max-w-xl mx-auto space-y-2">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseOrder}
                  className="w-full sm:flex-1 py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all min-h-[46px] shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-[0.98]"
                  title="Finalizar y cerrar pedido"
                >
                  <CheckCircle2 size={16} />
                  <span>Finalizar y Cerrar Pedido</span>
                </button>

                <button
                  type="button"
                  onClick={handleReturnToStore}
                  className="w-full sm:flex-1 py-3.5 px-5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all min-h-[46px] cursor-pointer active:scale-[0.98]"
                  title="Regresar al catálogo"
                >
                  <span>Seguir Comprando en la Tienda</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Pantalla Completa para Zoom del Comprobante */}
      {isZoomingVoucher && voucherImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsZoomingVoucher(false)}
              className="absolute -top-10 right-0 p-2 text-stone-400 hover:text-white cursor-pointer"
            >
              <X size={24} />
            </button>
            <img
              src={voucherImage}
              alt="Comprobante en grande"
              className="max-h-[80vh] max-w-full object-contain rounded-xl border border-white/20 shadow-2xl"
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={voucherImage}
                download={voucherFileName || 'comprobante_pago.jpg'}
                className="px-4 py-2 rounded-xl bg-[#fbbf24] text-black font-bold text-xs flex items-center gap-2 hover:bg-[#f59e0b] cursor-pointer"
              >
                <Download size={14} />
                <span>Descargar Imagen</span>
              </a>
              <button
                type="button"
                onClick={() => setIsZoomingVoucher(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs hover:bg-white/20 cursor-pointer"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Completo de Factura Oficial Imprimible */}
      {showFullInvoiceModal && confirmedOrder && (
        <OfficialInvoiceModal
          order={confirmedOrder as any}
          voucherImage={voucherImage}
          onClose={() => setShowFullInvoiceModal(false)}
        />
      )}
    </div>
  );
};
