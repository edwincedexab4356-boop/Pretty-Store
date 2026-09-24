import React from 'react';
import { Award, Truck, CreditCard, Clock } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Award size={22} className="text-[#c5a059] stroke-[1.5]" />,
      title: 'Autenticidad Absoluta',
      description: 'Cada fragancia, reloj y accesorio es verificado bajo rigurosos estándares de autenticidad.',
    },
    {
      icon: <Truck size={22} className="text-[#c5a059] stroke-[1.5]" />,
      title: 'Envíos Prioritarios',
      description: 'Empaque de protección premium y seguimiento directo. Envío sin costo a partir de $100.',
    },
    {
      icon: <CreditCard size={22} className="text-[#c5a059] stroke-[1.5]" />,
      title: 'Pagos Transparentes',
      description: 'Transacciones seguras vía Yappy, transferencias bancarias directas o tarjetas.',
    },
    {
      icon: <Clock size={22} className="text-[#c5a059] stroke-[1.5]" />,
      title: 'Atención Personalizada',
      description: 'Asistencia individual para selección de piezas exclusivas y consultas de disponibilidad.',
    },
  ];

  return (
    <section id="ventajas" className="py-24 sm:py-32 bg-[#09090b] text-stone-100 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-16 sm:mb-20">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[#c5a059] font-medium block mb-2">
            El Compromiso Pretty-Store
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif-luxury font-light text-white tracking-tight">
            Excelencia en Cada Experiencia
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-2 font-light">
            Un servicio a la altura de la distinción de nuestras piezas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-6 border-t border-white/10 hover:border-[#c5a059]/40 transition-colors duration-300 space-y-4"
            >
              <div className="w-10 h-10 border border-white/15 flex items-center justify-center bg-stone-900/40 text-[#c5a059]">
                {feature.icon}
              </div>
              <h3 className="text-base font-serif-luxury font-normal text-white">
                {feature.title}
              </h3>
              <p className="text-xs text-stone-400 font-light leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
