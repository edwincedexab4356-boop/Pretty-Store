import React from 'react';
import { LegalPageLayout } from './LegalPageLayout';
import { Clock } from 'lucide-react';

export const PrivacyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <LegalPageLayout
      title="Política de Privacidad y Tratamiento de Datos"
      subtitle="Tratamiento seguro y confidencial de la información de nuestros clientes."
      onBack={onBack}
    >
      <section className="space-y-2">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">
          1. Tratamiento de Datos Personales
        </h2>
        <p>
          En Pretty-Store recopilamos únicamente los datos necesarios para procesar su compra: nombre completo, número de teléfono de contacto y dirección para envíos de mensajería (Uno Express, Ferguson o Servientrega).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">
          2. Confidencialidad de Pagos
        </h2>
        <p>
          Los comprobantes de pago adjuntados en la plataforma se utilizan exclusivamente para cotejar el abono bancario correspondiente y despachar el pedido. No almacenamos credenciales bancarias ni contraseñas.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">
          3. Horario de Soporte al Cliente
        </h2>
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5 font-mono text-xs">
          <div className="flex items-center gap-2 text-[#fbbf24] font-sans font-bold">
            <Clock size={14} />
            <span>Atención al Cliente:</span>
          </div>
          <div>Lunes a Sábado: 8:00 AM - 7:00 PM</div>
          <div>Domingo: 8:00 AM - 5:00 PM</div>
        </div>
      </section>
    </LegalPageLayout>
  );
};
