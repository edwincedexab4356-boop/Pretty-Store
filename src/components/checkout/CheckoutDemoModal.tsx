import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  Upload,
  ArrowRight,
  ArrowLeft,
  Truck,
  Store,
  Clock,
  Printer,
  Maximize2,
  Download,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  MessageCircle,
  Camera,
  Phone,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStoreConfig } from '../../context/StoreConfigContext';
import {
  PROVINCIAS,
  SERVIENTREGA_RATES,
  FERGUSON_RATES,
  UNOEXPRESS_RATES,
  parseShippingRate,
} from '../../data/shippingRates';
import { compressImageFile } from '../../utils/imageOptimizer';
import { createRealOrder } from '../../services/checkoutService';
import { getPrimaryProductImage } from '../../utils/productImages';
import { OfficialInvoiceModal } from '../admin/OfficialInvoiceModal';
import { Pedido } from '../../types/database';

interface CheckoutModalProps {
  onClose: () => void;
}

type CheckoutStep = 'form' | 'review' | 'payment' | 'receipt';
type DeliveryType = 'retiro' | 'delivery';
type CourierType = 'Servientrega' | 'Ferguson' | 'Uno Express';
type ServientregaMode = 'sucursal' | 'domicilio';
type PaymentMethodType = 'yappy' | 'transferencia' | 'tarjeta';

interface OrderDraft {
  orderId: string;
  orderNumber: string;
  date: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  metodoPago: PaymentMethodType;
  tipoEntrega: DeliveryType;
  courier?: CourierType;
  provincia: string;
  sucursalOdomicilio: string;
  subtotal: number;
  discount: number;
  promoTitle?: string;
  shipping: number;
  total: number;
  comprobantePago?: string | null;
  comprobanteFileName?: string | null;
}

export const CheckoutDemoModal: React.FC<CheckoutModalProps> = ({ onClose }) => {
  const { items, subtotal, discount, promo, total, clearCart } = useCart();
  const { config } = useStoreConfig();

  // Steps: 'form' -> 'review' -> 'payment' -> 'receipt'
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('form');

  // Step 1: Form state
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [courier, setCourier] = useState<CourierType>('Uno Express');
  const [servientregaMode, setServientregaMode] = useState<ServientregaMode>('sucursal');
  const [selectedProvince, setSelectedProvince] = useState<string>('Panamá Capital');
  const [selectedBranch, setSelectedBranch] = useState<string>('Marbella');
  const [homeAddress, setHomeAddress] = useState<string>('');

  // Customer contact
  const [nombre, setNombre] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('yappy');

  // Form errors
  const [formErrors, setFormErrors] = useState<{ nombre?: string; telefono?: string; direccion?: string }>({});

  // Step 3: Voucher upload state
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherDataUrl, setVoucherDataUrl] = useState<string | null>(null);
  const [voucherFileName, setVoucherFileName] = useState<string | null>(null);
  const [isProcessingVoucher, setIsProcessingVoucher] = useState(false);
  const [copiedYappy, setCopiedYappy] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedCardLink, setCopiedCardLink] = useState(false);
  const [uploadedVoucherPublicUrl, setUploadedVoucherPublicUrl] = useState<string | null>(null);
  const [copiedVoucherImage, setCopiedVoucherImage] = useState(false);
  const voucherInputRef = useRef<HTMLInputElement | null>(null);

  // Confirmed Order
  const [orderDraft, setOrderDraft] = useState<OrderDraft | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Modal viewers
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isVoucherViewerOpen, setIsVoucherViewerOpen] = useState(false);

  // Dynamic courier branch options
  const servientregaBranches = useMemo(
    () => SERVIENTREGA_RATES[selectedProvince] || [],
    [selectedProvince]
  );
  const fergusonBranches = useMemo(
    () => FERGUSON_RATES[selectedProvince] || [],
    [selectedProvince]
  );
  const unoexpressBranches = useMemo(
    () => UNOEXPRESS_RATES[selectedProvince] || [],
    [selectedProvince]
  );

  // Auto-select first branch when province or courier changes if current branch not found
  const servientregaRateStr = useMemo(() => {
    const match = servientregaBranches.find((b) => b.branch === selectedBranch) || servientregaBranches[0];
    if (!match) return servientregaMode === 'sucursal' ? '$3.25' : '$5.61';
    return servientregaMode === 'sucursal' ? match.branchRate : match.homeRate;
  }, [servientregaBranches, selectedBranch, servientregaMode]);

  const otherCourierRateStr = useMemo(() => {
    if (courier === 'Ferguson') {
      const match = fergusonBranches.find((b) => b.branch === selectedBranch) || fergusonBranches[0];
      return match ? match.rate : '$5.00';
    }
    const match = unoexpressBranches.find((b) => b.branch === selectedBranch) || unoexpressBranches[0];
    return match ? match.rate : '$6.50';
  }, [courier, fergusonBranches, unoexpressBranches, selectedBranch]);

  const effectiveRateStr = useMemo(
    () => (courier === 'Servientrega' ? servientregaRateStr : otherCourierRateStr),
    [courier, servientregaRateStr, otherCourierRateStr]
  );

  const shippingCost = useMemo(() => {
    if (deliveryType === 'retiro') return 0;
    return parseShippingRate(effectiveRateStr);
  }, [deliveryType, effectiveRateStr]);

  const currentTotal = useMemo(() => {
    const discounted = Math.max(0, subtotal - discount);
    return Number((discounted + shippingCost).toFixed(2));
  }, [subtotal, discount, shippingCost]);

  // Handler for Province Selection
  const handleSelectProvince = (provId: string) => {
    setSelectedProvince(provId);
    if (courier === 'Servientrega') {
      const branches = SERVIENTREGA_RATES[provId];
      if (branches && branches[0]) setSelectedBranch(branches[0].branch);
    } else if (courier === 'Ferguson') {
      const branches = FERGUSON_RATES[provId];
      if (branches && branches[0]) setSelectedBranch(branches[0].branch);
    } else {
      const branches = UNOEXPRESS_RATES[provId];
      if (branches && branches[0]) setSelectedBranch(branches[0].branch);
    }
  };

  // Handler for Courier Selection
  const handleSelectCourier = (newCourier: CourierType) => {
    setCourier(newCourier);
    if (newCourier === 'Servientrega') {
      const branches = SERVIENTREGA_RATES[selectedProvince];
      if (branches && branches[0]) setSelectedBranch(branches[0].branch);
    } else if (newCourier === 'Ferguson') {
      const branches = FERGUSON_RATES[selectedProvince];
      if (branches && branches[0]) setSelectedBranch(branches[0].branch);
    } else {
      const branches = UNOEXPRESS_RATES[selectedProvince];
      if (branches && branches[0]) setSelectedBranch(branches[0].branch);
    }
  };

  // Step 1 -> Step 2 validation
  const handleContinueToReview = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { nombre?: string; telefono?: string; direccion?: string } = {};

    if (!nombre.trim()) errors.nombre = 'El nombre completo es requerido';
    if (!telefono.trim()) errors.telefono = 'El teléfono o WhatsApp es requerido';

    if (deliveryType === 'delivery') {
      if (courier === 'Servientrega' && servientregaMode === 'domicilio') {
        if (!homeAddress.trim()) errors.direccion = 'Ingresa la dirección para la entrega en tu casa';
      }
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // Build delivery string
    let resolvedBranch = selectedBranch;
    if (courier === 'Servientrega') {
      resolvedBranch = selectedBranch || servientregaBranches[0]?.branch || 'Agencia Principal';
    } else if (courier === 'Ferguson') {
      resolvedBranch = selectedBranch || fergusonBranches[0]?.branch || 'Agencia Principal';
    } else {
      resolvedBranch = selectedBranch || unoexpressBranches[0]?.branch || 'Agencia Principal';
    }

    let deliveryDestination = '';
    if (deliveryType === 'retiro') {
      deliveryDestination = 'Retiro en el Local / Tienda física (Pretty Store)';
    } else if (courier === 'Servientrega' && servientregaMode === 'domicilio') {
      deliveryDestination = `${homeAddress.trim()} (${selectedProvince})`;
    } else {
      deliveryDestination = `Sucursal de envío (${courier}): ${resolvedBranch} (${selectedProvince})`;
    }

    const orderNum = `PED-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowStr = new Date().toLocaleDateString('es-PA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    setOrderDraft({
      orderId: orderNum,
      orderNumber: orderNum,
      date: nowStr,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      email: `${telefono.replace(/\D/g, '')}@prettystore.com`,
      direccion: deliveryDestination,
      metodoPago: paymentMethod,
      tipoEntrega: deliveryType,
      courier: deliveryType === 'delivery' ? courier : undefined,
      provincia: selectedProvince,
      sucursalOdomicilio:
        courier === 'Servientrega' && servientregaMode === 'domicilio' ? homeAddress.trim() : resolvedBranch,
      subtotal,
      discount,
      promoTitle: promo.promoTitle || undefined,
      shipping: shippingCost,
      total: currentTotal,
      comprobantePago: voucherDataUrl,
      comprobanteFileName: voucherFileName,
    });

    setCurrentStep('review');
  };

  // Step 2 -> Step 3
  const handleProceedToPayment = () => {
    setCurrentStep('payment');
  };

  // Handle Voucher Upload in Step 3
  const handleVoucherSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('La imagen no debe superar los 25MB.');
      return;
    }

    setIsProcessingVoucher(true);
    let finalBase64 = '';
    try {
      finalBase64 = await compressImageFile(file, 1200, 0.82);
      setVoucherFile(file);
      setVoucherDataUrl(finalBase64);
      setVoucherFileName(file.name);
    } catch (err) {
      finalBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
      setVoucherFile(file);
      setVoucherDataUrl(finalBase64);
      setVoucherFileName(file.name);
    } finally {
      setIsProcessingVoucher(false);
    }

    // Auto upload to server to get immediate absolute link for WhatsApp and all devices
    if (finalBase64 && typeof window !== 'undefined') {
      try {
        const clientOrigin = window.location.origin;
        const uploadRes = await fetch('/api/upload-voucher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: finalBase64,
            orderNumber: orderDraft?.orderNumber || `PAGO_${Date.now()}`,
            clientOrigin,
          }),
        });
        if (uploadRes.ok) {
          const resData = await uploadRes.json();
          if (resData.url) {
            setUploadedVoucherPublicUrl(resData.url);
          }
        }
      } catch (e) {
        console.warn('Pre-upload voucher warning:', e);
      }
    }
  };

  // Helper to copy voucher image to clipboard for easy WhatsApp pasting
  const handleCopyVoucherImage = async () => {
    if (!voucherDataUrl) return;
    try {
      const res = await fetch(voucherDataUrl);
      const blob = await res.blob();
      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ [blob.type || 'image/png']: blob }),
        ]);
        setCopiedVoucherImage(true);
        setTimeout(() => setCopiedVoucherImage(false), 2500);
      } else {
        const link = uploadedVoucherPublicUrl || voucherDataUrl;
        await navigator.clipboard.writeText(link);
        setCopiedVoucherImage(true);
        setTimeout(() => setCopiedVoucherImage(false), 2500);
      }
    } catch {
      const link = uploadedVoucherPublicUrl || voucherDataUrl;
      if (link) await navigator.clipboard.writeText(link);
      setCopiedVoucherImage(true);
      setTimeout(() => setCopiedVoucherImage(false), 2500);
    }
  };

  // Step 3 -> Step 4: Finalize and save order
  const handleConfirmOrderAndSave = async () => {
    if (!voucherDataUrl) {
      alert('Debes adjuntar la captura del comprobante de pago para confirmar el pedido.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const activeDraft = orderDraft!;
      const result = await createRealOrder({
        nombre: activeDraft.nombre,
        telefono: activeDraft.telefono,
        email: activeDraft.email,
        direccion: activeDraft.direccion,
        tipoEntrega: activeDraft.tipoEntrega,
        courier: activeDraft.courier,
        metodoPago: activeDraft.metodoPago,
        items,
        subtotal: activeDraft.subtotal,
        discount: activeDraft.discount,
        promoTitle: activeDraft.promoTitle,
        shipping: activeDraft.shipping,
        total: activeDraft.total,
        voucherImage: voucherDataUrl,
        voucherFileName: voucherFileName || 'comprobante_pago.jpg',
        voucherRawFile: voucherFile,
      });

      const effectiveVoucher = result.publicVoucherUrl || uploadedVoucherPublicUrl || voucherDataUrl;

      setOrderDraft({
        ...activeDraft,
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        comprobantePago: effectiveVoucher,
      });

      clearCart();
      setCurrentStep('receipt');
    } catch (err: any) {
      console.error('Error saving order:', err);
      setCurrentStep('receipt');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Copy helpers
  const handleCopyYappy = () => {
    navigator.clipboard.writeText('6215-0251');
    setCopiedYappy(true);
    setTimeout(() => setCopiedYappy(false), 2000);
  };

  const CARD_PAYMENT_URL = 'https://checkout.paguelofacil.com/W_F9464GL';

  const handleCopyBank = () => {
    navigator.clipboard.writeText('04-72-98-594685-0');
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleCopyCardLink = () => {
    navigator.clipboard.writeText(CARD_PAYMENT_URL);
    setCopiedCardLink(true);
    setTimeout(() => setCopiedCardLink(false), 2000);
  };

  // WhatsApp Link Builder
  const getWhatsAppLink = () => {
    if (!orderDraft) return '';
    const phone = '50762150251';
    const orderNum = orderDraft.orderNumber || '#PEDIDO';
    const paymentStr =
      orderDraft.metodoPago === 'yappy'
        ? 'Yappy (6215-0251)'
        : orderDraft.metodoPago === 'transferencia'
        ? 'Transferencia Bancaria (Banco General)'
        : 'Tarjeta de Débito o Crédito';

    const itemsSummary = items
      .map((it) => {
        const optText = it.selectedOption?.nombre ? ` [Opción: ${it.selectedOption.nombre}]` : (it.selectedSize ? ` [Talla: ${it.selectedSize}]` : '');
        const unitPrice = typeof it.selectedOption?.precio === 'number' ? it.selectedOption.precio : it.product.precio;
        return `  • ${it.product.nombre}${optText} (Cant: ${it.quantity}x a $${unitPrice.toFixed(2)})`;
      })
      .join('\n');

    let voucherSection = '';
    const voucherCandidate = orderDraft.comprobantePago || uploadedVoucherPublicUrl || voucherDataUrl || '';
    let fullVoucherLink = '';
    if (voucherCandidate.startsWith('http://') || voucherCandidate.startsWith('https://')) {
      fullVoucherLink = voucherCandidate;
    } else if (voucherCandidate.startsWith('/')) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      fullVoucherLink = `${origin}${voucherCandidate}`;
    }

    if (fullVoucherLink) {
      voucherSection = `📸 *FOTO / LINK DEL COMPROBANTE DE PAGO:*\n${fullVoucherLink}\n\n`;
    } else if (voucherCandidate) {
      voucherSection = `📸 *COMPROBANTE DE PAGO ADJUNTO:*\n*(Adjunto la captura del comprobante directamente a este chat)* 👆\n\n`;
    }

    const message = `${voucherSection}🛍️ *PEDIDO OFICIAL (${orderNum}) - PRETTY STORE*
🧾 *DATOS DEL PAGO:*
• *Estado:* Pago realizado y verificado por el cliente
• *Método:* ${paymentStr}
• *Monto Cancelado:* $${orderDraft.total.toFixed(2)} USD

📋 *LO QUE PEDÍ (DETALLE DEL PEDIDO):*
*Cliente:* ${orderDraft.nombre}
*Teléfono:* ${orderDraft.telefono}
*Modalidad:* ${orderDraft.direccion}
*Productos Solicitados:*
${itemsSummary}

*Subtotal:* $${orderDraft.subtotal.toFixed(2)} USD
${orderDraft.discount > 0 ? `*Descuento Promocional:* -$${orderDraft.discount.toFixed(2)} USD\n` : ''}*Envío:* ${orderDraft.shipping > 0 ? `$${orderDraft.shipping.toFixed(2)} USD (${orderDraft.courier})` : 'Retiro en sucursal'}
*Total Oficial Pagado:* $${orderDraft.total.toFixed(2)} USD

_Enviado desde Pretty Store Oficial_`;

    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
  };

  const handleOpenWhatsApp = async () => {
    if (!orderDraft) return;

    let effectivePublicUrl = uploadedVoucherPublicUrl || '';
    if (!effectivePublicUrl && voucherDataUrl) {
      try {
        const clientOrigin = typeof window !== 'undefined' ? window.location.origin : '';
        const uploadRes = await fetch('/api/upload-voucher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: voucherDataUrl,
            orderNumber: orderDraft.orderNumber || `PAGO_${Date.now()}`,
            clientOrigin,
          }),
        });
        if (uploadRes.ok) {
          const resData = await uploadRes.json();
          if (resData.url) {
            effectivePublicUrl = resData.url;
            setUploadedVoucherPublicUrl(resData.url);
          }
        }
      } catch (err) {
        console.warn('On-demand voucher upload warning:', err);
      }
    }

    const phone = '50762150251';
    const orderNum = orderDraft.orderNumber || '#PEDIDO';
    const paymentStr =
      orderDraft.metodoPago === 'yappy'
        ? 'Yappy (6215-0251)'
        : orderDraft.metodoPago === 'transferencia'
        ? 'Transferencia Bancaria (Banco General)'
        : 'Tarjeta de Débito o Crédito';

    const itemsSummary = items
      .map((it) => {
        const optText = it.selectedOption?.nombre ? ` [Opción: ${it.selectedOption.nombre}]` : (it.selectedSize ? ` [Talla: ${it.selectedSize}]` : '');
        const unitPrice = typeof it.selectedOption?.precio === 'number' ? it.selectedOption.precio : it.product.precio;
        return `  • ${it.product.nombre}${optText} (Cant: ${it.quantity}x a $${unitPrice.toFixed(2)})`;
      })
      .join('\n');

    let fullVoucherLink = '';
    const voucherCandidate = effectivePublicUrl || orderDraft.comprobantePago || voucherDataUrl || '';
    if (voucherCandidate.startsWith('http://') || voucherCandidate.startsWith('https://')) {
      fullVoucherLink = voucherCandidate;
    } else if (voucherCandidate.startsWith('/')) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      fullVoucherLink = `${origin}${voucherCandidate}`;
    }

    const voucherHeader = fullVoucherLink ? `📸 *FOTO DEL COMPROBANTE DE PAGO:*\n${fullVoucherLink}\n\n` : '';

    const message = `${voucherHeader}🛍️ *PEDIDO OFICIAL (${orderNum}) - PRETTY STORE*
🧾 *DATOS DEL PAGO:*
• *Estado:* Pago realizado y verificado por el cliente
• *Método:* ${paymentStr}
• *Monto Cancelado:* $${orderDraft.total.toFixed(2)} USD

📋 *LO QUE PEDÍ (DETALLE DEL PEDIDO):*
*Cliente:* ${orderDraft.nombre}
*Teléfono:* ${orderDraft.telefono}
*Modalidad:* ${orderDraft.direccion}
*Productos Solicitados:*
${itemsSummary}

*Subtotal:* $${orderDraft.subtotal.toFixed(2)} USD
${orderDraft.discount > 0 ? `*Descuento Promocional:* -$${orderDraft.discount.toFixed(2)} USD\n` : ''}*Envío:* ${orderDraft.shipping > 0 ? `$${orderDraft.shipping.toFixed(2)} USD (${orderDraft.courier})` : 'Retiro en sucursal'}
*Total Oficial Pagado:* $${orderDraft.total.toFixed(2)} USD

_Enviado desde Pretty Store Oficial_`;

    // 1. Intentar enviar imagen + texto juntos en un solo mensaje mediante Web Share API
    try {
      let fileToShare = voucherFile;
      if (!fileToShare && voucherCandidate && voucherCandidate.startsWith('data:')) {
        const res = await fetch(voucherCandidate);
        const blob = await res.blob();
        fileToShare = new File([blob], voucherFileName || `comprobante_${orderDraft.orderNumber}.jpg`, {
          type: blob.type || 'image/jpeg',
        });
      }

      if (fileToShare && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
        await navigator.share({
          files: [fileToShare],
          text: message,
          title: `Pedido ${orderDraft.orderNumber} - Pretty Store`,
        });
        return;
      }
    } catch (shareErr: any) {
      if (shareErr.name === 'AbortError') {
        return;
      }
      console.warn('Native share not supported or cancelled:', shareErr);
    }

    // 2. Copiar imagen al portapapeles automáticamente en caso de estar en desktop
    try {
      if (voucherDataUrl && navigator.clipboard && (window as any).ClipboardItem) {
        const res = await fetch(voucherDataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ [blob.type || 'image/jpeg']: blob }),
        ]);
        setCopiedVoucherImage(true);
      }
    } catch {
      // ignore
    }

    // 3. Fallback a WhatsApp link con enlace directo de la imagen incluido
    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = waUrl;
    } else {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Build simulated Pedido object for OfficialInvoiceModal
  const invoiceOrderObj = useMemo<Pedido | null>(() => {
    if (!orderDraft) return null;
    return {
      id: orderDraft.orderId,
      numero_orden: orderDraft.orderNumber,
      total: orderDraft.total,
      subtotal: orderDraft.subtotal,
      descuento: orderDraft.discount,
      envio: orderDraft.shipping,
      metodo_pago: orderDraft.metodoPago as any,
      tipo_entrega: orderDraft.tipoEntrega as any,
      courier: orderDraft.courier,
      estado: 'confirmado',
      comprobante_pago: orderDraft.comprobantePago || voucherDataUrl,
      created_at: new Date().toISOString(),
      cliente: {
        id: orderDraft.orderId,
        nombre: orderDraft.nombre,
        telefono: orderDraft.telefono,
        direccion: orderDraft.direccion,
        email: orderDraft.email,
      },
      items: items.map((it) => ({
        producto_id: it.product.id,
        cantidad: it.quantity,
        precio_unitario: it.product.precio,
        subtotal: it.subtotal,
        producto: it.product,
        selectedSize: it.selectedSize,
      })),
    };
  }, [orderDraft, items, voucherDataUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#09090b] border border-white/10 rounded-2xl w-full max-w-full sm:max-w-2xl lg:max-w-3xl max-h-[94dvh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative overscroll-contain animate-scaleUp">
        {/* ==================== MODAL HEADER ==================== */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] shadow-sm shadow-[#fbbf24]/50 animate-pulse" />
            <h2 className="text-xs sm:text-sm font-extrabold text-[#fbbf24] uppercase tracking-wider font-mono">
              {currentStep === 'form' && 'PRETTY STORE · DATOS DEL PEDIDO'}
              {currentStep === 'review' && 'PRETTY STORE · REVISIÓN DEL PEDIDO'}
              {currentStep === 'payment' && 'PRETTY STORE · PAGO Y COMPROBANTE'}
              {currentStep === 'receipt' && 'PRETTY STORE · RECIBO OFICIAL'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-all duration-300 hover:rotate-90 active:scale-90 cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X size={18} />
          </button>
        </div>

        {/* ========================================================
            STEP 1: FORM (DATOS DEL PEDIDO) - IMAGES 1, 2, 3
           ======================================================== */}
        {currentStep === 'form' && (
          <form
            onSubmit={handleContinueToReview}
            className="overflow-y-auto overscroll-contain touch-scroll p-4 sm:p-6 lg:p-7 space-y-6 text-left"
          >
            {/* 1. MÉTODO DE ENTREGA Y ENVÍO (A TODO PANAMÁ) */}
            <div className="space-y-3.5">
              <label className="text-xs uppercase tracking-[0.16em] text-white font-bold flex items-center gap-1.5">
                <Truck size={15} className="text-[#fbbf24]" />
                <span>1. Modalidad de Entrega (Retiro o Envío a Panamá) *</span>
              </label>

              <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4">
                {/* 2 OPCIONES PRINCIPALES ANTES DEL MÉTODO DE ENVÍO */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
                    SELECCIONA CÓMO DESEAS RECIBIR TU PEDIDO: *
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Opción 1: Retiro en Sucursal */}
                    <button
                      type="button"
                      onClick={() => setDeliveryType('retiro')}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        deliveryType === 'retiro'
                          ? 'border-[#fbbf24] bg-[#fbbf24]/20 ring-2 ring-[#fbbf24] shadow-lg shadow-[#fbbf24]/10'
                          : 'border-white/10 bg-stone-900/60 hover:border-white/25 hover:bg-stone-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            deliveryType === 'retiro' ? 'bg-[#fbbf24] text-black font-bold' : 'bg-white/10 text-stone-300'
                          }`}
                        >
                          <Store size={20} />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs sm:text-sm text-white block">
                            1. Retiro en Sucursal
                          </span>
                          <span className="text-[11px] text-stone-400 block mt-0.5">
                            Tienda física Pretty Store (Panamá)
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-medium text-stone-400 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                          En Tienda
                        </span>
                      </div>
                    </button>

                    {/* Opción 2: Envío */}
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        deliveryType === 'delivery'
                          ? 'border-[#fbbf24] bg-[#fbbf24]/20 ring-2 ring-[#fbbf24] shadow-lg shadow-[#fbbf24]/10'
                          : 'border-white/10 bg-stone-900/60 hover:border-white/25 hover:bg-stone-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            deliveryType === 'delivery' ? 'bg-[#fbbf24] text-black font-bold' : 'bg-white/10 text-stone-300'
                          }`}
                        >
                          <Truck size={20} />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs sm:text-sm text-white block">
                            2. Envío a Domicilio / Sucursal
                          </span>
                          <span className="text-[11px] text-stone-400 block mt-0.5">
                            Servientrega, Ferguson o Uno Express
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-mono font-bold text-[#fbbf24]">
                          Desde $3.25
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Si elige Retiro en Sucursal */}
                {deliveryType === 'retiro' && (
                  <div className="p-4 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 text-[#fbbf24]">
                      <Store size={17} />
                      <strong className="text-xs uppercase tracking-wider">
                        Información de Retiro en Tienda Física:
                      </strong>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed font-light">
                      • <strong>Lugar de retiro:</strong> Boutique Pretty Store Oficial, Ciudad de Panamá.
                      <br />
                      • <strong>Horario de retiro:</strong> Lunes a Sábado de 10:00 a.m. a 7:00 p.m.
                      <br />
                      • Una vez confirmado tu pedido, te escribiremos por WhatsApp cuando tu paquete esté listo para retirar con tu comprobante.
                    </p>
                  </div>
                )}

                {/* Si elige Envío: se despliega la selección de Courier, Provincia y Sucursal/Casa */}
                {deliveryType === 'delivery' && (
                  <div className="space-y-4 pt-1 border-t border-white/10 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                        SELECCIONA TU EMPRESA DE ENVÍO *
                      </span>
                      <span className="text-[10px] text-stone-400 italic">
                        * El costo de envío se suma automáticamente al total
                      </span>
                    </div>

                    {/* 3 Couriers in a row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Servientrega */}
                      <button
                        type="button"
                        onClick={() => handleSelectCourier('Servientrega')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          courier === 'Servientrega'
                            ? 'border-[#fbbf24] bg-[#fbbf24]/20 ring-1 ring-[#fbbf24]'
                            : 'border-white/10 bg-stone-900/60 hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-white">1. Servientrega</span>
                          {courier === 'Servientrega' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
                          )}
                        </div>
                        <span className="text-[11px] text-emerald-400 font-mono block mt-1 font-semibold">
                          Desde $3.25 (Sucursal / Casa)
                        </span>
                      </button>

                      {/* Ferguson */}
                      <button
                        type="button"
                        onClick={() => handleSelectCourier('Ferguson')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          courier === 'Ferguson'
                            ? 'border-[#fbbf24] bg-[#fbbf24]/20 ring-1 ring-[#fbbf24]'
                            : 'border-white/10 bg-stone-900/60 hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-white">2. Ferguson</span>
                          {courier === 'Ferguson' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
                          )}
                        </div>
                        <span className="text-[11px] text-[#fbbf24] font-mono block mt-1 font-semibold">
                          Desde $5.00 aprox.
                        </span>
                      </button>

                      {/* UnoExpress */}
                      <button
                        type="button"
                        onClick={() => handleSelectCourier('Uno Express')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          courier === 'Uno Express'
                            ? 'border-[#fbbf24] bg-[#fbbf24]/20 ring-1 ring-[#fbbf24]'
                            : 'border-white/10 bg-stone-900/60 hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-white">3. UnoExpress</span>
                          {courier === 'Uno Express' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
                          )}
                        </div>
                        <span className="text-[11px] text-[#fbbf24] font-mono block mt-1 font-semibold">
                          Desde $6.50 aprox.
                        </span>
                      </button>
                    </div>

                    {/* If Servientrega: Sucursal vs Casa choice */}
                    {courier === 'Servientrega' && (
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setServientregaMode('sucursal')}
                          className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                            servientregaMode === 'sucursal'
                              ? 'border-[#fbbf24] bg-[#fbbf24]/20 text-white ring-1 ring-[#fbbf24]'
                              : 'border-white/10 bg-stone-900 text-stone-400 hover:text-white'
                          }`}
                        >
                          <span className="font-bold">Envío a la Sucursal</span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            1° Tarifa (desde $3.25 / $3.86)
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setServientregaMode('domicilio')}
                          className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                            servientregaMode === 'domicilio'
                              ? 'border-[#fbbf24] bg-[#fbbf24]/20 text-white ring-1 ring-[#fbbf24]'
                              : 'border-white/10 bg-stone-900 text-stone-400 hover:text-white'
                          }`}
                        >
                          <span className="font-bold">Envío a la Casa</span>
                          <span className="text-[10px] font-mono text-amber-300 font-bold">
                            2° Tarifa (desde $5.61 / $5.79)
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Provincia de destino: */}
                    <div className="space-y-2 pt-1">
                      <label className="text-[11px] text-stone-300 font-medium block">
                        Provincia de destino:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PROVINCIAS.map((prov) => {
                          const isSelected = selectedProvince === prov.id;
                          return (
                            <button
                              key={prov.id}
                              type="button"
                              onClick={() => handleSelectProvince(prov.id)}
                              className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all active:scale-[0.98] cursor-pointer ${
                                isSelected
                                  ? 'border-[#fbbf24] bg-[#fbbf24]/20 text-white font-bold ring-1 ring-[#fbbf24]'
                                  : 'border-white/10 bg-black/40 text-stone-400 hover:text-white hover:border-white/20'
                              }`}
                            >
                              <span>{prov.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sucursales List OR Exact Address */}
                    {courier === 'Servientrega' && servientregaMode === 'domicilio' ? (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-stone-300 font-medium block">
                            Dirección exacta de entrega a domicilio: *
                          </label>
                          <span className="text-xs text-amber-300 font-mono font-bold">
                            Envío Casa: {servientregaRateStr}
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="Barriada, calle, número de casa/apto en Panamá..."
                          value={homeAddress}
                          onChange={(e) => setHomeAddress(e.target.value)}
                          className="w-full px-3.5 py-3 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#fbbf24]"
                        />
                        {formErrors.direccion && (
                          <p className="text-[11px] text-rose-400 font-mono">{formErrors.direccion}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-stone-300 font-medium">
                            Sucursal de {courier} en {selectedProvince}:
                          </label>
                          <span className="text-xs text-[#fbbf24] font-mono font-bold">
                            Envío Sucursal: {effectiveRateStr}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto overscroll-contain pr-1">
                          {courier === 'Servientrega' &&
                            servientregaBranches.map((b) => {
                              const isSelected = selectedBranch === b.branch;
                              return (
                                <button
                                  key={b.branch}
                                  type="button"
                                  onClick={() => setSelectedBranch(b.branch)}
                                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 cursor-pointer active:scale-[0.98] ${
                                    isSelected
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

                          {courier === 'Ferguson' &&
                            fergusonBranches.map((b) => {
                              const isSelected = selectedBranch === b.branch;
                              return (
                                <button
                                  key={b.branch}
                                  type="button"
                                  onClick={() => setSelectedBranch(b.branch)}
                                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 cursor-pointer active:scale-[0.98] ${
                                    isSelected
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

                          {courier === 'Uno Express' &&
                            unoexpressBranches.map((b) => {
                              const isSelected = selectedBranch === b.branch;
                              return (
                                <button
                                  key={b.branch}
                                  type="button"
                                  onClick={() => setSelectedBranch(b.branch)}
                                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 cursor-pointer active:scale-[0.98] ${
                                    isSelected
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

                    {/* Warning banner */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                      <span className="text-amber-400 shrink-0 text-sm">⚠️</span>
                      <p className="text-[11px] leading-relaxed">
                        <strong>Aviso de Envío:</strong> Los ${shippingCost.toFixed(2)} USD corresponden a un
                        monto estimado de envío y se suman al total al pagar. El costo final lo determina la empresa
                        transportadora. Si existe alguna diferencia, te notificaremos por WhatsApp el monto
                        pendiente antes de realizar el envío.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. DATOS DE CONTACTO DEL CLIENTE * */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-[0.16em] text-white font-bold block">
                2. Datos de Contacto del Cliente *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] text-stone-300 font-light block">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Roberto Cedeño"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3.5 py-3 bg-stone-900/60 border border-white/10 rounded-xl text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#fbbf24]"
                  />
                  {formErrors.nombre && (
                    <p className="text-[11px] text-rose-400 font-mono">{formErrors.nombre}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-stone-300 font-light block">Teléfono / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+507 6000-0000"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3.5 py-3 bg-stone-900/60 border border-white/10 rounded-xl text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#fbbf24]"
                  />
                  {formErrors.telefono && (
                    <p className="text-[11px] text-rose-400 font-mono">{formErrors.telefono}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. SELECCIONA TU MÉTODO DE PAGO * */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-[0.16em] text-white font-bold block">
                3. Selecciona tu Método de Pago *
              </label>

              <div className="grid grid-cols-3 gap-3">
                {/* Yappy */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('yappy')}
                  className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'yappy'
                      ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-1 ring-[#fbbf24]'
                      : 'border-white/10 bg-black/40 text-stone-400 hover:text-white'
                  }`}
                >
                  <span className="text-xl">📱</span>
                  <span className="font-extrabold text-xs sm:text-sm text-white block">Yappy</span>
                  <span className="text-[10px] text-stone-400 font-mono block">6215-0251</span>
                </button>

                {/* Banco General */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transferencia')}
                  className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'transferencia'
                      ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-1 ring-[#fbbf24]'
                      : 'border-white/10 bg-black/40 text-stone-400 hover:text-white'
                  }`}
                >
                  <span className="text-xl">🏦</span>
                  <span className="font-extrabold text-xs sm:text-sm text-white block">Banco General</span>
                  <span className="text-[10px] text-stone-400 font-mono block">ACH</span>
                </button>

                {/* Tarjeta */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('tarjeta')}
                  className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'tarjeta'
                      ? 'border-[#fbbf24] bg-[#fbbf24]/15 text-white ring-1 ring-[#fbbf24]'
                      : 'border-white/10 bg-black/40 text-stone-400 hover:text-white'
                  }`}
                >
                  <span className="text-xl">💳</span>
                  <span className="font-extrabold text-xs sm:text-sm text-white block">Tarjeta</span>
                  <span className="text-[10px] text-stone-400 font-mono block">Débito o Crédito</span>
                </button>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2 text-xs">
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
                <span>Costo estimado de envío ({courier}):</span>
                <span className="font-mono text-[#fbbf24] font-bold">
                  +${shippingCost.toFixed(2)} USD
                </span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                <span className="text-white">Total a Pagar (con envío):</span>
                <span className="text-xl sm:text-2xl font-mono text-[#fbbf24]">
                  ${currentTotal.toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 px-6 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-extrabold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-xl shadow-[#fbbf24]/20 hover:shadow-2xl hover:shadow-[#fbbf24]/30 hover:scale-[1.01] active:scale-[0.98]"
              >
                <span>CONTINUAR</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            STEP 2: REVIEW (REVISIÓN DEL PEDIDO) - IMAGES 4, 5
           ======================================================== */}
        {currentStep === 'review' && orderDraft && (
          <div className="overflow-y-auto overscroll-contain touch-scroll p-4 sm:p-6 lg:p-7 space-y-5 text-left">
            <div className="p-5 sm:p-6 rounded-2xl bg-black/80 border border-white/10 space-y-5 shadow-xl">
              {/* Review Header Banner */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-black border border-white/20 shrink-0">
                    <img
                      src="/images/logo/logotipo.jpeg"
                      alt="Pretty Store"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/logo/logotipo.jpeg';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-serif-luxury font-bold text-white text-sm sm:text-base">
                      PRETTY STORE
                    </h3>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-light">
                      ALMACÉN Y ACCESORIO URBANO · PANAMÁ
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-mono">
                    REVISIÓN DEL PEDIDO
                  </span>
                  <span className="font-mono font-bold text-[#fbbf24] text-xs sm:text-sm block">
                    #{orderDraft.orderNumber}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono block">{orderDraft.date}</span>
                </div>
              </div>

              {/* Two Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Client info */}
                <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#fbbf24] font-bold block">
                    DATOS DEL CLIENTE
                  </span>
                  <strong className="text-white text-sm block font-semibold">{orderDraft.nombre}</strong>
                  <span className="text-stone-300 font-mono text-xs block">
                    WhatsApp: {orderDraft.telefono}
                  </span>
                  <span className="text-stone-400 text-[11px] block mt-0.5">
                    Método de pago:{' '}
                    <strong className="text-white uppercase font-mono">
                      {orderDraft.metodoPago === 'yappy'
                        ? 'YAPPY (6215-0251)'
                        : orderDraft.metodoPago === 'transferencia'
                        ? 'BANCO GENERAL (ACH)'
                        : 'TARJETA DÉBITO O CRÉDITO'}
                    </strong>
                  </span>
                </div>

                {/* Delivery and destination info */}
                <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#fbbf24] font-bold flex items-center gap-1.5">
                    <Truck size={13} className="text-[#fbbf24]" />
                    <span>ENTREGA Y DESTINO</span>
                  </span>
                  <strong className="text-white text-sm block font-semibold">
                    Envío Express vía {orderDraft.courier || 'Courier'}
                  </strong>
                  <span className="text-stone-300 text-[11px] leading-relaxed block">
                    Sucursal de envío ({orderDraft.courier}): {orderDraft.sucursalOdomicilio} ({orderDraft.provincia})
                  </span>
                </div>
              </div>

              {/* Selected Products List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                  <span className="font-bold text-[#fbbf24] uppercase tracking-wider">
                    PRODUCTOS SELECCIONADOS ({items.reduce((acc, it) => acc + it.quantity, 0)} UNIDADES)
                  </span>
                  <span className="text-stone-400 font-mono text-[11px]">Detalle</span>
                </div>

                <div className="space-y-2.5">
                  {items.map((it, idx) => {
                    const unitPrice = typeof it.selectedOption?.precio === 'number' ? it.selectedOption.precio : it.product.precio;
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={getPrimaryProductImage(it.product, '/images/logo/logotipo.jpeg')}
                            alt={it.product.nombre}
                            className="w-12 h-12 rounded-xl object-cover bg-stone-900 border border-white/15 shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/images/logo/logotipo.jpeg';
                            }}
                          />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-white text-xs sm:text-sm truncate">
                              {it.product.nombre}
                            </h4>
                            <p className="text-[11px] text-stone-400 mt-0.5">
                              Cant: <strong className="text-stone-200 font-mono">{it.quantity}x</strong> a $
                              {unitPrice.toFixed(2)} USD c/u
                              {it.selectedOption && ` • Opción: ${it.selectedOption.nombre}`}
                              {it.selectedSize && ` • Talla: ${it.selectedSize}`}
                            </p>
                          </div>
                        </div>

                        <span className="font-mono font-bold text-sm text-[#fbbf24] shrink-0">
                          ${(it.subtotal || it.quantity * unitPrice).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals Summary */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal productos:</span>
                  <span className="font-mono text-white">${orderDraft.subtotal.toFixed(2)} USD</span>
                </div>
                {orderDraft.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>{orderDraft.promoTitle || 'Descuento Promocional'}:</span>
                    <span className="font-mono">-${orderDraft.discount.toFixed(2)} USD</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-300">
                  <span>Costo estimado de envío ({orderDraft.courier}):</span>
                  <span className="font-mono text-[#fbbf24] font-bold">
                    +${orderDraft.shipping.toFixed(2)} USD
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                  <span className="text-white">Total a Pagar (con envío):</span>
                  <span className="text-xl sm:text-2xl font-mono text-[#fbbf24]">
                    ${orderDraft.total.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Disclaimer text */}
              <p className="text-[11px] text-stone-400 text-center font-light leading-relaxed">
                Verifica que tus datos y artículos sean correctos. Al pulsar{' '}
                <strong className="text-white">"Ir a pagar"</strong> podrás ver los números de cuenta
                oficiales y adjuntar tu comprobante de pago.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('form')}
                  className="px-4 sm:px-5 py-3.5 rounded-xl border border-white/20 text-stone-300 hover:text-white hover:bg-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer min-h-[48px] active:scale-95"
                >
                  <ArrowLeft size={16} />
                  <span>Modificar datos</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#f59e0b] hover:to-[#fbbf24] text-black font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-xl shadow-[#fbbf24]/20 hover:shadow-2xl hover:shadow-[#fbbf24]/30 hover:scale-[1.01] active:scale-[0.98] min-h-[48px]"
                >
                  <span>IR A PAGAR</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 3: PAYMENT & VOUCHER (PAGO Y COMPROBANTE) - ACCESIBLE Y CLARO
           ======================================================== */}
        {currentStep === 'payment' && orderDraft && (
          <div className="overflow-y-auto overscroll-contain touch-scroll p-4 sm:p-6 lg:p-7 space-y-6 text-left pb-8">
            {/* Top Bar with Pedido and Total a Cancelar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-stone-950 via-[#141418] to-stone-950 border border-[#fbbf24]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1">
                <span className="text-[11px] text-stone-300 uppercase tracking-wider block font-bold">
                  NÚMERO DE PEDIDO
                </span>
                <span className="font-mono font-black text-[#fbbf24] text-xl sm:text-2xl block">
                  #{orderDraft.orderNumber}
                </span>
              </div>
              <div className="sm:text-right bg-black/60 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-white/10 space-y-0.5">
                <span className="text-[11px] text-stone-300 uppercase tracking-wider block font-bold">
                  TOTAL A CANCELAR (CON ENVÍO)
                </span>
                <span className="font-mono font-black text-[#fbbf24] text-2xl sm:text-3xl block">
                  ${orderDraft.total.toFixed(2)} USD
                </span>
                <span className="text-[10px] text-stone-400 block font-light">
                  Monto final exacto · Sin cargos adicionales
                </span>
              </div>
            </div>

            {/* Senior Guide Banner */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#fbbf24] text-black font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                💡
              </div>
              <div className="text-xs text-stone-200 space-y-1">
                <strong className="text-[#fbbf24] text-sm block font-bold">
                  Guía sencilla para completar tu compra:
                </strong>
                <p className="text-stone-300 leading-relaxed text-xs">
                  Sigue los <strong>2 pasos numerados abajo</strong>: primero envía el pago y luego sube la foto de tu comprobante. ¡Es rápido y seguro!
                </p>
              </div>
            </div>

            {/* PASO 1: DATOS PARA REALIZAR EL PAGO */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border-2 border-white/15 space-y-4 shadow-xl">
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <span className="w-8 h-8 rounded-full bg-[#fbbf24] text-black font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                  1
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    PASO 1: Envía tu pago por {orderDraft.metodoPago === 'yappy' ? 'Yappy' : orderDraft.metodoPago === 'transferencia' ? 'Banco General' : 'Tarjeta'}
                  </h3>
                  <p className="text-xs text-stone-300">
                    {orderDraft.metodoPago === 'yappy' && 'Transfiere el monto al siguiente número de teléfono:'}
                    {orderDraft.metodoPago === 'transferencia' && 'Transfiere el monto a la siguiente cuenta bancaria:'}
                    {orderDraft.metodoPago === 'tarjeta' && 'Realiza tu pago en línea con tu tarjeta de crédito o débito:'}
                  </p>
                </div>
              </div>

              {/* Yappy Details */}
              {orderDraft.metodoPago === 'yappy' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-black/90 border-2 border-[#fbbf24]/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-inner">
                    <div className="space-y-2">
                      <span className="text-xs text-stone-300 uppercase tracking-wider block font-bold">
                        NÚMERO DE TELÉFONO PARA YAPPY:
                      </span>
                      <span className="text-3xl sm:text-4xl font-mono font-black text-[#fbbf24] block tracking-wider">
                        6215-0251
                      </span>
                      <div className="space-y-0.5 text-xs text-stone-200">
                        <p>
                          Titular de la cuenta: <strong className="text-white text-sm">JESUS ALEJANDRO CARDONA ESCOBAR</strong>
                        </p>
                        <p className="text-[#fbbf24] font-semibold text-xs pt-1">
                          Monto exacto a enviar: <strong className="text-sm underline">${orderDraft.total.toFixed(2)} USD</strong> (incluye envío)
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyYappy}
                      className="px-6 py-4 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-xl shadow-[#fbbf24]/25 min-h-[52px] active:scale-[0.98]"
                      title="Copiar número de teléfono"
                    >
                      {copiedYappy ? <Check size={20} className="stroke-[3]" /> : <Copy size={20} />}
                      <span>{copiedYappy ? '¡NÚMERO COPIADO!' : 'COPIAR NÚMERO'}</span>
                    </button>
                  </div>

                  {/* Clarifying guidance for elderly users */}
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-stone-300 space-y-1.5">
                    <span className="font-bold text-white block">¿Cómo transferir por Yappy?</span>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-stone-300 pl-1 leading-relaxed">
                      <li>Toca el botón amarillo <strong className="text-[#fbbf24]">"COPIAR NÚMERO"</strong>.</li>
                      <li>Abre tu aplicación de <strong>Banco General o Yappy</strong> en tu celular y busca el número <strong>6215-0251</strong>.</li>
                      <li>Envía los <strong>${orderDraft.total.toFixed(2)} USD</strong> a nombre de <strong>JESUS ALEJANDRO CARDONA ESCOBAR</strong>.</li>
                      <li>Toma una <strong>captura de pantalla o foto</strong> del comprobante de pago.</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Banco General Details */}
              {orderDraft.metodoPago === 'transferencia' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-black/90 border-2 border-[#fbbf24]/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-inner">
                    <div className="space-y-2">
                      <span className="text-xs text-stone-300 uppercase tracking-wider block font-bold">
                        BANCO GENERAL (CUENTA DE AHORROS):
                      </span>
                      <span className="text-2xl sm:text-3xl font-mono font-black text-[#fbbf24] block tracking-wider">
                        04-72-98-594685-0
                      </span>
                      <div className="space-y-0.5 text-xs text-stone-200">
                        <p>
                          A nombre de: <strong className="text-white text-sm">JESUS ALEJANDRO CARDONA ESCOBAR</strong>
                        </p>
                        <p className="text-[#fbbf24] font-semibold text-xs pt-1">
                          Monto exacto a transferir: <strong className="text-sm underline">${orderDraft.total.toFixed(2)} USD</strong> (incluye envío)
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyBank}
                      className="px-6 py-4 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-xl shadow-[#fbbf24]/25 min-h-[52px] active:scale-[0.98]"
                    >
                      {copiedBank ? <Check size={20} className="stroke-[3]" /> : <Copy size={20} />}
                      <span>{copiedBank ? '¡CUENTA COPIADA!' : 'COPIAR CUENTA'}</span>
                    </button>
                  </div>

                  {/* Instrucciones claras y amigables para personas mayores */}
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-[#fbbf24]/30 text-xs text-stone-200 space-y-2.5">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <span className="w-6 h-6 rounded-full bg-[#fbbf24] text-black font-black text-xs flex items-center justify-center">?</span>
                      <span>Guía Fácil para Transferencia Bancaria (Paso a Paso):</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-2 text-xs text-stone-300 pl-1 leading-relaxed">
                      <li>
                        Toca el botón amarillo <strong className="text-[#fbbf24]">"COPIAR CUENTA"</strong> para guardar el número automáticamente.
                      </li>
                      <li>
                        Abre la aplicación de tu banco o entra a la página web de tu banco en tu teléfono o computadora (también puedes hacerlo en ventanilla bancaria).
                      </li>
                      <li>
                        Elige la opción <strong>Transferir</strong> hacia <strong>Banco General (Cuenta de Ahorros)</strong>.
                      </li>
                      <li>
                        Pega o escribe el número de cuenta: <strong>04-72-98-594685-0</strong> a nombre de <strong>JESUS ALEJANDRO CARDONA ESCOBAR</strong>.
                      </li>
                      <li>
                        Coloca el monto exacto: <strong className="text-[#fbbf24]">${orderDraft.total.toFixed(2)} USD</strong> y envía la transferencia.
                      </li>
                      <li>
                        Toma una <strong>foto o captura de pantalla</strong> del comprobante de transferencia exitosa.
                      </li>
                      <li>
                        Vuelve a esta pantalla y toca el botón del <strong>PASO 2</strong> (abajo) para subir tu comprobante. ¡Y tu pedido quedará registrado!
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Tarjeta Details */}
              {orderDraft.metodoPago === 'tarjeta' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-black/90 border-2 border-[#fbbf24]/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-inner">
                    <div className="space-y-2">
                      <span className="text-xs text-stone-300 uppercase tracking-wider block font-bold">
                        ENLACE SEGURO PARA PAGO CON TARJETA:
                      </span>
                      <span className="text-xs sm:text-sm font-mono text-emerald-400 block break-all font-semibold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                        {CARD_PAYMENT_URL}
                      </span>
                      <div className="space-y-0.5 text-xs text-stone-200">
                        <p>
                          Acepta tarjetas de débito y crédito <strong className="text-white">(Visa, Mastercard y Clave)</strong>
                        </p>
                        <p className="text-[#fbbf24] font-semibold text-xs pt-1">
                          Monto total a pagar: <strong className="text-sm underline">${orderDraft.total.toFixed(2)} USD</strong> (incluye envío)
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                      <a
                        href={CARD_PAYMENT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-4 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-[#fbbf24]/25 min-h-[52px] active:scale-[0.98] text-center"
                      >
                        <ExternalLink size={18} />
                        <span>ABRIR ENLACE DE PAGO</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyCardLink}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        {copiedCardLink ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        <span>{copiedCardLink ? '¡Enlace copiado!' : 'Copiar enlace'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Instrucciones claras y amigables para personas mayores */}
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-[#fbbf24]/30 text-xs text-stone-200 space-y-2.5">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <span className="w-6 h-6 rounded-full bg-[#fbbf24] text-black font-black text-xs flex items-center justify-center">?</span>
                      <span>Guía Fácil para Pagar con Tarjeta (Paso a Paso):</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-2 text-xs text-stone-300 pl-1 leading-relaxed">
                      <li>
                        Toca el botón amarillo <strong className="text-[#fbbf24]">"ABRIR ENLACE DE PAGO"</strong>. Se abrirá una página segura de pago.
                      </li>
                      <li>
                        Escribe tu nombre tal como está escrito en tu tarjeta de débito o crédito.
                      </li>
                      <li>
                        Coloca los <strong>16 números</strong> que ves en el frente de tu tarjeta.
                      </li>
                      <li>
                        Coloca la <strong>fecha de vencimiento</strong> (mes y año) y el <strong>código de seguridad</strong> (los 3 números que están al reverso de la tarjeta).
                      </li>
                      <li>
                        Presiona el botón de pagar por los <strong>${orderDraft.total.toFixed(2)} USD</strong>.
                      </li>
                      <li>
                        Cuando la pantalla te indique que el pago fue aprobado, toma una <strong>foto o captura de pantalla</strong> del comprobante.
                      </li>
                      <li>
                        Regresa a esta ventana y toca el botón del <strong>PASO 2</strong> (abajo) para subir tu comprobante. ¡Y tu orden quedará confirmada al instante!
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* PASO 2: SUBIR LA FOTO DEL COMPROBANTE */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#121216] border-2 border-white/15 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#fbbf24] text-black font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                    2
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      PASO 2: Sube la foto o captura de tu pago
                    </h3>
                    <p className="text-xs text-stone-300">
                      Adjunta la foto de tu recibo para que podamos validar tu orden.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0">
                  Obligatorio
                </span>
              </div>

              <input
                type="file"
                ref={voucherInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleVoucherSelected}
              />

              {voucherDataUrl ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                    <img
                      src={voucherDataUrl}
                      alt="Comprobante de pago"
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-emerald-500 shrink-0 shadow-md"
                    />
                    <div className="min-w-0 space-y-1">
                      <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="shrink-0" />
                        <span>¡Foto del comprobante seleccionada con éxito!</span>
                      </span>
                      <span className="text-xs text-stone-300 truncate block">
                        {voucherFileName || 'captura_de_pago.jpg'}
                      </span>
                      <span className="text-[11px] text-emerald-300/80 block">
                        Todo listo para confirmar tu orden abajo.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => voucherInputRef.current?.click()}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer shrink-0 transition-colors border border-white/20 text-center"
                  >
                    🔄 Cambiar foto
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => voucherInputRef.current?.click()}
                  className="border-2 border-dashed border-[#fbbf24]/50 hover:border-[#fbbf24] p-6 sm:p-8 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-black/60 hover:bg-black/80 group space-y-3"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#fbbf24]/15 border border-[#fbbf24]/40 flex items-center justify-center text-[#fbbf24] group-hover:scale-110 transition-transform shadow-lg">
                    <Camera size={32} />
                  </div>
                  <div>
                    <strong className="text-sm sm:text-base text-white font-extrabold block mb-1">
                      📸 TOCA AQUÍ PARA ELEGIR LA FOTO DE TU PAGO
                    </strong>
                    <p className="text-xs text-stone-300 max-w-md mx-auto leading-relaxed">
                      Toca este recuadro para abrir la galería de fotos de tu celular o tomar una foto de tu comprobante.
                    </p>
                  </div>
                  <span className="px-5 py-2.5 rounded-xl bg-[#fbbf24]/20 hover:bg-[#fbbf24]/30 text-[#fbbf24] text-xs font-bold border border-[#fbbf24]/40 transition-colors">
                    📁 Elegir foto desde mis archivos
                  </span>
                </div>
              )}
            </div>

            {/* Assistance Section for Seniors */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Phone size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">¿Necesitas ayuda con tu pago?</span>
                  <span className="text-[11px] text-stone-400 block font-light">
                    Te asistimos con gusto por WhatsApp paso a paso.
                  </span>
                </div>
              </div>
              <a
                href="https://wa.me/50762150251?text=Hola,%20necesito%20ayuda%20para%20realizar%20mi%20pago%20en%20Pretty%20Store"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
              >
                <MessageCircle size={15} />
                <span>Escribir por WhatsApp</span>
              </a>
            </div>

            {/* PASO 3: CONFIRMAR PEDIDO */}
            <div className="space-y-3 pt-2">
              {voucherDataUrl ? (
                <button
                  type="button"
                  disabled={isSubmittingOrder}
                  onClick={handleConfirmOrderAndSave}
                  className="w-full py-4.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 hover:from-emerald-600 hover:to-emerald-500 text-white font-black uppercase tracking-wider text-sm sm:text-base flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 min-h-[58px]"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={22} className="shrink-0" />
                    <span>{isSubmittingOrder ? 'Confirmando pedido...' : 'FINALIZAR Y ENVIAR MI PEDIDO'}</span>
                  </div>
                  <span className="text-[11px] font-normal text-emerald-100 normal-case opacity-90">
                    (Toca aquí para ver tu recibo y confirmación oficial)
                  </span>
                </button>
              ) : (
                <div className="w-full p-4.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 text-xs sm:text-sm font-bold text-center flex flex-col sm:flex-row items-center justify-center gap-2 shadow-lg animate-pulse">
                  <span className="text-xl">⚠️</span>
                  <span>ATENCIÓN: Primero debes tocar el recuadro del PASO 2 y adjuntar la foto de tu comprobante.</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('form')}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 text-stone-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer min-h-[46px] active:scale-95"
                >
                  <ArrowLeft size={15} />
                  <span>Modificar Datos</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 text-stone-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer min-h-[46px] active:scale-95"
                >
                  <span>Regresar a la Tienda</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 4: RECEIPT (RECIBO OFICIAL) - IMAGES 8, 9
           ======================================================== */}
        {currentStep === 'receipt' && orderDraft && (
          <div className="overflow-y-auto overscroll-contain touch-scroll p-4 sm:p-6 lg:p-7 space-y-5 text-center pb-8">
            {/* Top Confirmed Badge & Order ID */}
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono uppercase font-bold inline-flex items-center gap-1 mb-1">
                <CheckCircle2 size={12} />
                <span>PEDIDO CONFIRMADO & COMPROBANTE GUARDADO</span>
              </span>
              <h2 className="text-2xl sm:text-4xl font-mono font-extrabold text-[#fbbf24]">
                #{orderDraft.orderNumber}
              </h2>
              <p className="text-xs text-stone-300 font-light max-w-md mx-auto">
                Tu orden ha sido registrada en el sistema de Pretty Store con su factura oficial y
                comprobante adjunto.
              </p>
            </div>

            {/* Print and View Capture Buttons */}
            <div className="max-w-xl mx-auto flex items-center justify-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-[#fbbf24]/20 cursor-pointer active:scale-95"
              >
                <Printer size={15} />
                <span>Imprimir / Ver Factura Oficial (PDF)</span>
              </button>

              {voucherDataUrl && (
                <button
                  type="button"
                  onClick={() => setIsVoucherViewerOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/15"
                >
                  <Maximize2 size={14} />
                  <span>Ver Captura en Grande</span>
                </button>
              )}
            </div>

            {/* Official Receipt Card (Image 8) */}
            <div className="max-w-xl mx-auto p-4 sm:p-6 rounded-2xl bg-black/90 border border-white/15 text-left space-y-4 text-xs font-sans shadow-2xl">
              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-black border border-white/20 shrink-0">
                    <img
                      src="/images/logo/logotipo.jpeg"
                      alt="Pretty Store"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/logo/logotipo.jpeg';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-serif-luxury">
                      PRETTY STORE · RECIBO OFICIAL
                    </h3>
                    <p className="text-[11px] text-[#fbbf24] font-mono">#{orderDraft.orderNumber}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-stone-400 text-[10px] block font-mono">
                    {orderDraft.date || new Date().toLocaleDateString('es-PA')}
                  </span>
                  <span className="text-emerald-400 text-[10px] font-semibold">Estado: Pendiente</span>
                </div>
              </div>

              {/* Client & Payment Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-white/10 pb-3 text-xs">
                <div>
                  <span className="text-stone-400 text-[10px] uppercase tracking-wider block mb-0.5">
                    CLIENTE:
                  </span>
                  <strong className="text-white font-medium block">{orderDraft.nombre}</strong>
                  <span className="text-stone-300 font-mono text-[11px]">{orderDraft.telefono}</span>
                </div>

                <div>
                  <span className="text-stone-400 text-[10px] uppercase tracking-wider block mb-0.5">
                    MÉTODO DE PAGO:
                  </span>
                  <span className="text-[#fbbf24] font-bold block capitalize">
                    {orderDraft.metodoPago === 'yappy'
                      ? 'Yappy (6215-0251)'
                      : orderDraft.metodoPago === 'transferencia'
                      ? 'Banco General (ACH 04-72-98-594685-0)'
                      : 'Tarjeta de Débito o Crédito'}
                  </span>
                </div>

                <div className="col-span-1 sm:col-span-2 pt-1">
                  <span className="text-stone-400 text-[10px] uppercase tracking-wider block mb-0.5">
                    MODALIDAD DE ENTREGA:
                  </span>
                  <span className="text-stone-200 font-medium block">
                    Envío express ({orderDraft.courier}) en {orderDraft.provincia} - {orderDraft.sucursalOdomicilio}
                  </span>
                </div>
              </div>

              {/* Products bought */}
              <div className="space-y-2 border-b border-white/10 pb-3">
                <span className="text-stone-300 font-semibold block text-xs uppercase tracking-wider">
                  DETALLE DE PRODUCTOS COMPRADOS:
                </span>
                <div className="space-y-2">
                  {items.map((it, idx) => {
                    const unitPrice = typeof it.selectedOption?.precio === 'number' ? it.selectedOption.precio : it.product.precio;
                    return (
                      <div key={idx} className="flex justify-between items-center text-xs gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={getPrimaryProductImage(it.product, '/images/logo/logotipo.jpeg')}
                            alt={it.product.nombre}
                            className="w-8 h-8 rounded object-cover border border-white/10 shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/images/logo/logotipo.jpeg';
                            }}
                          />
                          <span className="text-white truncate">
                            {it.product.nombre}{' '}
                            {it.selectedOption && (
                              <span className="text-amber-300 font-mono text-[10px]">[{it.selectedOption.nombre}] </span>
                            )}
                            <span className="text-stone-400 font-mono">({it.quantity}x)</span>
                          </span>
                        </div>
                        <span className="font-mono text-white font-bold shrink-0">
                          ${(it.quantity * unitPrice).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-300">
                  <span>Subtotal productos:</span>
                  <span className="font-mono text-white">${orderDraft.subtotal.toFixed(2)} USD</span>
                </div>
                {orderDraft.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Descuento Promo:</span>
                    <span className="font-mono">-${orderDraft.discount.toFixed(2)} USD</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-300">
                  <span>Modalidad ({orderDraft.courier || 'Retiro en sucursal'}):</span>
                  <span className="font-mono text-[#fbbf24] font-bold">
                    {orderDraft.shipping > 0
                      ? `+$${orderDraft.shipping.toFixed(2)} USD`
                      : 'Retiro en sucursal'}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                  <span className="text-white uppercase tracking-wider text-xs">Total de la Orden:</span>
                  <span className="text-xl font-mono text-[#fbbf24]">
                    ${orderDraft.total.toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>

            {/* Attached Voucher Box (Image 9) */}
            {voucherDataUrl && (
              <div className="max-w-xl mx-auto p-4 rounded-2xl bg-black/80 border border-white/10 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>CAPTURA DEL COMPROBANTE GUARDADA:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsVoucherViewerOpen(true)}
                    className="text-[11px] text-[#fbbf24] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Maximize2 size={12} />
                    <span>Ver en grande</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={voucherDataUrl}
                      alt="Comprobante"
                      className="w-14 h-14 rounded-lg object-cover border border-white/20 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-emerald-400 block truncate">
                        ✓ Comprobante verificado y montado
                      </span>
                      <span className="text-[10px] text-stone-400 truncate block mt-0.5">
                        {voucherFileName || 'captura_de_pago.jpeg'}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono block">
                        Almacenado con el pedido #{orderDraft.orderNumber}
                      </span>
                    </div>
                  </div>

                  <a
                    href={voucherDataUrl}
                    download={voucherFileName || `comprobante_${orderDraft.orderNumber}.jpg`}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
                    title="Descargar comprobante"
                  >
                    <Download size={16} />
                  </a>
                </div>
              </div>
            )}

            {/* Glowing Big Green WhatsApp Button (Image 9) */}
            <div className="max-w-xl mx-auto space-y-3">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full py-4 px-6 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-black font-black uppercase tracking-wider text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xl shadow-emerald-500/40 active:scale-[0.99]"
              >
                <MessageCircle size={20} className="fill-black text-black" />
                <span>ENVIAR FOTO Y PEDIDO A WHATSAPP (TODO EN 1 MENSAJE)</span>
              </button>

              {voucherDataUrl && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopyVoucherImage}
                    className="py-3 px-4 rounded-xl bg-stone-900 border border-white/15 hover:bg-stone-800 text-stone-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {copiedVoucherImage ? (
                      <>
                        <Check size={15} className="text-emerald-400 stroke-[3]" />
                        <span className="text-emerald-400 font-bold">¡Foto copiada! (Pégala en WhatsApp)</span>
                      </>
                    ) : (
                      <>
                        <Copy size={15} className="text-[#fbbf24]" />
                        <span>Copiar Foto para Pegar en WhatsApp</span>
                      </>
                    )}
                  </button>

                  <a
                    href={voucherDataUrl}
                    download={voucherFileName || `comprobante_${orderDraft.orderNumber}.jpg`}
                    className="py-3 px-4 rounded-xl bg-stone-900 border border-white/15 hover:bg-stone-800 text-stone-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download size={15} className="text-emerald-400" />
                    <span>Descargar Foto del Comprobante</span>
                  </a>
                </div>
              )}

              {/* WhatsApp explanation box */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-left space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>¿Cómo se envía el comprobante por WhatsApp?</span>
                </span>
                <p className="text-[11px] text-stone-300 leading-relaxed font-light">
                  1. Al tocar <strong>"ENVIAR FOTO Y PEDIDO A WHATSAPP"</strong>, el mensaje incluye arriba el enlace directo y seguro de tu foto de comprobante y todo el detalle de lo que compraste.
                  <br />
                  2. Si además deseas que la foto aparezca como imagen adjunta dentro del chat, toca el botón <strong>"Copiar Foto"</strong> y luego dale a <strong>"Pegar"</strong> dentro de WhatsApp, o adjúntala desde tu galería con el botón de clip (📎).
                </p>
              </div>

              {/* 48 hour notice */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2 text-left">
                <Clock size={16} className="text-amber-400 shrink-0" />
                <span className="text-[11px]">
                  Dispones de un plazo de <strong>48 horas</strong> para coordinar tu entrega o retiro con
                  tu comprobante.
                </span>
              </div>

              {/* Final Close Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3.5 px-4 rounded-xl bg-[#10b981] hover:bg-[#059669] text-black font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Check size={16} />
                  <span>FINALIZAR Y CERRAR PEDIDO</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3.5 px-4 rounded-xl bg-black/60 border border-white/15 hover:bg-white/10 text-stone-300 hover:text-white font-semibold text-xs transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>SEGUIR COMPRANDO EN LA TIENDA</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Official Invoice Modal PDF (Opens on Click) */}
      {isInvoiceModalOpen && invoiceOrderObj && (
        <OfficialInvoiceModal order={invoiceOrderObj} onClose={() => setIsInvoiceModalOpen(false)} />
      )}

      {/* Fullscreen Voucher Image Viewer */}
      {isVoucherViewerOpen && voucherDataUrl && (
        <div className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-3xl w-full flex flex-col items-center space-y-4">
            <div className="w-full flex items-center justify-between text-white">
              <span className="text-xs font-mono font-bold text-[#fbbf24]">
                Captura del comprobante (#{orderDraft?.orderNumber})
              </span>
              <button
                type="button"
                onClick={() => setIsVoucherViewerOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[75vh] w-full flex items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-stone-900">
              <img
                src={voucherDataUrl}
                alt="Comprobante en grande"
                className="max-h-[75vh] max-w-full object-contain"
              />
            </div>

            <div className="flex gap-3">
              <a
                href={voucherDataUrl}
                download={voucherFileName || 'comprobante_pago.jpg'}
                className="px-5 py-2.5 rounded-xl bg-[#fbbf24] text-black font-bold text-xs flex items-center gap-2 hover:bg-[#f59e0b] cursor-pointer"
              >
                <Download size={15} />
                <span>Descargar Imagen</span>
              </a>
              <button
                type="button"
                onClick={() => setIsVoucherViewerOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs hover:bg-white/20 cursor-pointer font-semibold"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
