import React from 'react';
import { LegalPageLayout } from './LegalPageLayout';
import { ShieldCheck, Clock } from 'lucide-react';
import { useStoreConfig } from '../../context/StoreConfigContext';

export const TermsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { config } = useStoreConfig();

  return (
    <LegalPageLayout
      title="Términos, Condiciones y Políticas de Compra"
      subtitle="Políticas de compra en línea, despachos a nivel nacional y garantías de reembolso."
      onBack={onBack}
    >
      {/* Politica de Stock Garantizada */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-stone-200 space-y-3">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm uppercase tracking-wide">
          <ShieldCheck size={18} className="text-[#fbbf24]" />
          <span>Política de Agotamiento de Stock y Pago por Equivocación</span>
        </div>
        <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
          Todos los pedidos en {config.nombre_tienda || 'Pretty-Store'} están sujetos a disponibilidad en inventario. En caso tal de que un artículo o producto seleccionado se haya acabado y haya sido pagado por equivocación, <strong>nosotros le responderemos de dos maneras garantizadas</strong>:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-1">
            <span className="text-white font-bold block text-xs">1️⃣ Devolución Completa de su Dinero:</span>
            <span className="text-stone-300 text-xs block">
              Reembolso íntegro del 100% del dinero transferido de forma inmediata a su cuenta bancaria o Yappy sin ningún costo ni penalización.
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-1">
            <span className="text-white font-bold block text-xs">2️⃣ Cambio por Otro Artículo:</span>
            <span className="text-stone-300 text-xs block">
              Sustitución inmediata por cualquier otra pieza de igual valor disponible en nuestro catálogo.
            </span>
          </div>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">
          1. Identificación y Ámbito de Aplicación
        </h2>
        <p>
          Las presentes condiciones regulan las compras realizadas en la tienda digital de Pretty-Store para envíos a cualquier provincia de la República de Panamá o retiros coordinados.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">
          2. Métodos de Pago y Comprobantes
        </h2>
        <p>
          Los pagos se efectúan mediante Yappy o transferencia directa a cuentas bancarias autorizadas. Para validar cada orden, el cliente debe adjuntar la captura del comprobante oficial emitido por su banca en línea o aplicación financiera.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">
          3. Horario de Atención y Despachos
        </h2>
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5 font-mono text-xs">
          <div className="flex items-center gap-2 text-[#fbbf24] font-sans font-bold">
            <Clock size={14} />
            <span>Horarios Oficiales:</span>
          </div>
          <div>Lunes a Sábado: 8:00 AM - 7:00 PM</div>
          <div>Domingo: 8:00 AM - 5:00 PM</div>
        </div>
      </section>
    </LegalPageLayout>
  );
};
