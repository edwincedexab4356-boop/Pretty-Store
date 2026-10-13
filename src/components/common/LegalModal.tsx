import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, Clock } from 'lucide-react';
import { useStoreConfig } from '../../context/StoreConfigContext';

interface LegalModalProps {
  initialTab?: 'terminos' | 'privacidad';
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ initialTab = 'terminos', onClose }) => {
  const [activeTab, setActiveTab] = useState<'terminos' | 'privacidad'>(initialTab);
  const { config } = useStoreConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#100f14] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="font-serif-luxury font-bold text-white text-base">Políticas y Garantías Oficiales</h3>
              <p className="text-[11px] text-stone-400 font-light">{config.nombre_tienda || 'Pretty-Store'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-black/20 shrink-0">
          <button
            onClick={() => setActiveTab('terminos')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'terminos'
                ? 'text-[#c5a059] border-b-2 border-[#c5a059] bg-[#c5a059]/5'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <FileText size={14} />
            <span>Términos y Devoluciones</span>
          </button>
          <button
            onClick={() => setActiveTab('privacidad')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'privacidad'
                ? 'text-[#c5a059] border-b-2 border-[#c5a059] bg-[#c5a059]/5'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Lock size={14} />
            <span>Privacidad y Atención</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-stone-300 font-light leading-relaxed">
          {activeTab === 'terminos' ? (
            <>
              {/* Cláusula Clave Requerida por el Usuario */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-stone-200 space-y-2">
                <span className="font-bold text-amber-300 block text-xs uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#fbbf24]" />
                  <span>Política Especial de Stock y Devolución por Equivocación:</span>
                </span>
                <p className="text-xs text-stone-200 leading-relaxed">
                  Si en caso tal un artículo se acabó y fue pagado por equivocación, <strong>nosotros le responderemos de dos maneras</strong>:
                </p>
                <div className="space-y-2 pt-1">
                  <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                    <strong className="text-white block font-semibold">1️⃣ Devolución completa de su dinero (100% Reembolso):</strong>
                    <span className="text-stone-300 text-[11px] block mt-0.5">
                      Reembolso total e inmediato transferido a su cuenta bancaria o Yappy sin ningún descuento ni cargo adicional.
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                    <strong className="text-white block font-semibold">2️⃣ Cambio por otro producto:</strong>
                    <span className="text-stone-300 text-[11px] block mt-0.5">
                      Sustitución inmediata por cualquier otra prenda, gorra, perfume o accesorio de su agrado disponible en nuestra tienda.
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-1">1. Proceso de Pedidos y Envíos</h4>
                <p>
                  Todos los pedidos se gestionan con empresas de logística reconocidas como Uno Express, Ferguson o Servientrega a nivel nacional en Panamá, o mediante retiro coordinado.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-1">2. Medios de Pago Verificados</h4>
                <p>
                  Aceptamos Yappy, transferencias directas de Banco General y otros bancos de la plaza, y tarjetas de crédito o débito mediante pasarelas seguras. El comprobante de pago es verificado antes del despacho de la orden.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h4 className="font-bold text-white text-sm mb-1">Protección de Datos y Confidencialidad</h4>
                <p>
                  En Pretty-Store tratamos su información personal (nombre, teléfono y dirección de entrega) exclusivamente con la finalidad de coordinar y enviar sus pedidos oficiales. Sus datos no son compartidos con terceros ni comercializados.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                <span className="text-xs uppercase font-bold text-[#fbbf24] flex items-center gap-2">
                  <Clock size={15} />
                  <span>Horario Oficial de Atención al Cliente</span>
                </span>
                <p className="text-xs text-stone-300">
                  Nuestro equipo de soporte y atención vía WhatsApp y canales oficiales opera en los siguientes horarios:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                    <span className="text-stone-400 block text-[10px] uppercase font-sans">Días de semana:</span>
                    <strong className="text-white">Lunes a Sábado: 8:00 AM - 7:00 PM</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
                    <span className="text-stone-400 block text-[10px] uppercase font-sans">Fin de semana:</span>
                    <strong className="text-[#fbbf24]">Domingo: 8:00 AM - 5:00 PM</strong>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end bg-black/40 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-bold text-xs transition-colors cursor-pointer"
          >
            Entendido y Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
