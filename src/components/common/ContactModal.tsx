import React from 'react';
import { X, Smartphone, MapPin, Mail, CreditCard, ExternalLink, MessageCircle, Clock, ShieldCheck } from 'lucide-react';
import { useStoreConfig } from '../../context/StoreConfigContext';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const { config } = useStoreConfig();

  if (!isOpen) return null;

  const whatsappClean = '50762150251';
  const whatsappDisplay = '+507 6215-0251';
  const yappyDisplay = '6215-0251';
  const bancoCuenta = '0472985946850';
  const titular = 'JESUS ALEJANDRO CARDONA ESCOBAR';
  const pagueloFacilUrl = 'https://checkout.paguelofacil.com/W_F9464GL';
  const tiktokUrl = config.tiktok || 'https://www.tiktok.com/@tienda_prettystore?_r=1&_t=ZS-9A8sgqEMvKS';
  const mapsUrl = 'https://maps.app.goo.gl/PxA3suMXNZxuFF5X7';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      <div className="min-h-full flex items-center justify-center p-4 text-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-2xl bg-[#0c0c0f] border border-white/15 rounded-2xl p-6 sm:p-8 text-left shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-[#e8c872] font-semibold block mb-1">
                Atención & Canales Oficiales
              </span>
              <h2 className="text-xl sm:text-2xl font-serif-luxury font-medium text-white tracking-wide">
                Contáctanos · {config.nombre_tienda || 'Pretty-Store'}
              </h2>
              <p className="text-xs text-stone-400 font-light mt-0.5">
                Comunícate directamente con nuestro equipo o visita nuestras páginas oficiales.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 cursor-pointer"
              aria-label="Cerrar modal de contacto"
            >
              <X size={20} />
            </button>
          </div>

          {/* Grid de Canales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. WhatsApp Oficial */}
            <a
              href={`https://wa.me/${whatsappClean}?text=${encodeURIComponent('Hola Pretty-Store, deseo información sobre sus productos y pedidos.')}`}
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/15 transition-all group flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <MessageCircle size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white">WhatsApp Oficial</h3>
                  <ExternalLink size={12} className="text-emerald-400 opacity-60 group-hover:opacity-100" />
                </div>
                <p className="text-sm font-mono text-emerald-300 font-bold mt-0.5">
                  {whatsappDisplay}
                </p>
                <p className="text-[10px] text-stone-400 font-light mt-1">
                  Atención rápida, confirmación de pedidos y comprobantes.
                </p>
              </div>
            </a>

            {/* 2. TikTok Oficial */}
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-xl bg-stone-900/60 border border-white/10 hover:border-[#e8c872] hover:bg-white/5 transition-all group flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.08a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.51z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white">TikTok Oficial</h3>
                  <ExternalLink size={12} className="text-stone-400 group-hover:text-white" />
                </div>
                <p className="text-xs font-mono text-[#e8c872] font-semibold mt-0.5 truncate">
                  @tienda_prettystore
                </p>
                <p className="text-[10px] text-stone-400 font-light mt-1">
                  Videos exclusivos, drops de gorras y novedades.
                </p>
              </div>
            </a>

            {/* 3. Instagram Oficial */}
            <a
              href={config.instagram || 'https://instagram.com'}
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-xl bg-stone-900/60 border border-white/10 hover:border-pink-500/50 hover:bg-pink-500/5 transition-all group flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-lg bg-pink-500/15 text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Smartphone size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white">Instagram</h3>
                  <ExternalLink size={12} className="text-stone-400 group-hover:text-white" />
                </div>
                <p className="text-xs font-mono text-pink-300 font-semibold mt-0.5">
                  @prettystore
                </p>
                <p className="text-[10px] text-stone-400 font-light mt-1">
                  Catálogo fotográfico y piezas de colección.
                </p>
              </div>
            </a>

            {/* 4. Pasarela PagueloFacil */}
            <a
              href={pagueloFacilUrl}
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-xl bg-stone-900/60 border border-white/10 hover:border-[#e8c872] hover:bg-[#e8c872]/5 transition-all group flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-lg bg-[#e8c872]/15 text-[#e8c872] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CreditCard size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white">PagueloFacil Checkout</h3>
                  <ExternalLink size={12} className="text-[#e8c872] opacity-70 group-hover:opacity-100" />
                </div>
                <p className="text-xs font-mono text-[#e8c872] font-semibold mt-0.5">
                  checkout.paguelofacil.com
                </p>
                <p className="text-[10px] text-stone-400 font-light mt-1">
                  Pagos seguros con Tarjeta Visa, Mastercard o Clave.
                </p>
              </div>
            </a>

            {/* 5. Ubicación en Google Maps */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-xl bg-stone-900/60 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group flex items-start gap-3.5 sm:col-span-2"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <MapPin size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white">Sede Física y Retiro</h3>
                  <ExternalLink size={12} className="text-amber-400 opacity-70 group-hover:opacity-100" />
                </div>
                <p className="text-xs text-stone-200 font-medium mt-0.5">
                  La Chorrera, Panamá Oeste (Frente al Parque Feuillet)
                </p>
                <p className="text-[10px] text-stone-400 font-light mt-0.5">
                  Haz clic para abrir la ruta exacta en Google Maps.
                </p>
              </div>
            </a>
          </div>

          {/* Información Bancaria Oficial */}
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-[#e8c872] font-semibold text-xs uppercase tracking-wider">
              <ShieldCheck size={16} />
              <span>Cuentas Oficiales para Pagos</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] text-stone-300">
              <div className="p-2.5 rounded-lg bg-stone-900/50 border border-white/5 space-y-1">
                <span className="text-stone-400 block text-[10px]">Yappy Oficial:</span>
                <span className="font-mono text-white font-bold text-xs">{yappyDisplay}</span>
                <span className="text-[10px] text-stone-400 block">Titular: {titular}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-900/50 border border-white/5 space-y-1">
                <span className="text-stone-400 block text-[10px]">Banco General:</span>
                <span className="font-mono text-white font-bold text-xs">Cuenta #{bancoCuenta}</span>
                <span className="text-[10px] text-stone-400 block">Titular: {titular}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-[11px] text-stone-400 border-t border-white/10 font-light">
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-[#e8c872]" />
              <span>Horario de Atención: Lunes a Sábado de 9:00 AM a 7:00 PM</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={13} className="text-[#e8c872]" />
              <span>{config.email || 'contacto@pretty-store.com'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
