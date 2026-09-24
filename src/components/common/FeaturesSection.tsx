import React from 'react';
import { ShieldCheck, Truck, Clock, Sparkles, CreditCard, Award } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Award className="text-amber-400" size={28} />,
      title: '100% Original & Genuino',
      description: 'Garantía absoluta de autenticidad en perfumería, relojería, carteras y accesorios.',
    },
    {
      icon: <Truck className="text-amber-400" size={28} />,
      title: 'Envíos Rápidos & Seguros',
      description: 'Empaque reforzado y seguimiento directo. Envío gratis en órdenes superiores a $100.',
    },
    {
      icon: <CreditCard className="text-amber-400" size={28} />,
      title: 'Métodos de Pago Locales',
      description: 'Paga cómodamente a través de Yappy, tarjetas, transferencia bancaria o en efectivo.',
    },
    {
      icon: <Clock className="text-amber-400" size={28} />,
      title: 'Atención Prioritaria',
      description: 'Asesoramiento personalizado en fragancias exclusivas y especificaciones de producto.',
    },
  ];

  return (
    <section id="ventajas" className="py-20 bg-slate-900/50 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles size={14} />
            <span>La Experiencia AURA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif-luxury">
            Compromiso con la Excelencia
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Cada pieza de nuestra tienda es seleccionada meticulosamente para ofrecerte distinción y durabilidad.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-black/20"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-5">
                {feature.icon}
              </div>
              <h3 className="text-base font-bold text-white mb-2 font-serif-luxury">
                {feature.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
