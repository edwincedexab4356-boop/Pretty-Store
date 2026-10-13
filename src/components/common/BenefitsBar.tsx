import React from 'react';
import { ShieldCheck, Truck, CreditCard, Headphones } from 'lucide-react';

export const BenefitsBar: React.FC = () => {
  const benefits = [
    {
      icon: <ShieldCheck size={22} className="text-[#c5a059] stroke-[1.5]" />,
      title: 'Autenticidad Absoluta',
      description: 'Cada fragancia, reloj y accesorio es verificado bajo rigurosos estándares de autenticidad.',
    },
    {
      icon: <Truck size={22} className="text-[#c5a059] stroke-[1.5]" />,
      title: 'Envíos a Nivel Nacional',
      description: 'Empaque de protección premium y coordinación directa por WhatsApp a todo Panamá.',
    },
    {
      icon: <CreditCard size={22} className="text-[#c5a059] stroke-[1.5]" />,
      title: 'Pagos Transparentes',
      description: 'Transacciones seguras vía Yappy, transferencias bancarias directas o tarjetas.',
    },
    {
      icon: <Headphones size={22} className="text-[#c5a059] stroke-[1.5]" />,
      title: 'Atención Personalizada',
      description: 'Asistencia individual para selección de piezas exclusivas y consultas de disponibilidad.',
    },
  ];

  return (
    <section id="ventajas" className="py-24 sm:py-32 bg-[#09090b] text-stone-100 border-t border-white/[0.06]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="text-center max-w-xl mx-auto mb-16 sm:mb-20">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[#c5a059] font-medium block mb-2">
            El Compromiso Pretty Store
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif-luxury font-light text-white tracking-tight">
            Excelencia en Cada Experiencia
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-2 font-light">
            Un servicio a la altura de la distinción de nuestras piezas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {benefits.map((item, idx) => (
            <div
              key={idx}
              className="p-6 border-t border-white/10 hover:border-[#c5a059]/50 transition-all duration-300 space-y-4 hover:-translate-y-1 bg-white/[0.01] hover:bg-white/[0.03] rounded-2xl group cursor-default shadow-lg shadow-black/20"
            >
              <div className="w-12 h-12 rounded-xl border border-white/15 group-hover:border-[#c5a059]/40 flex items-center justify-center bg-stone-900/60 text-[#c5a059] group-hover:scale-110 group-hover:text-[#fbbf24] transition-all duration-300 shadow-md">
                {item.icon}
              </div>
              <h3 className="text-base font-serif-luxury font-normal text-white group-hover:text-stone-100 transition-colors">{item.title}</h3>
              <p className="text-xs text-stone-400 font-light leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
