import React, { useState } from 'react';
import { Save, Check, Clock, Phone, Store, CreditCard } from 'lucide-react';
import { useStoreConfig } from '../../../context/StoreConfigContext';

export const SettingsView: React.FC = () => {
  const { config, updateConfig } = useStoreConfig();
  const [nombre, setNombre] = useState(config.nombre_tienda || 'Pretty-Store');
  const [descripcion, setDescripcion] = useState(config.descripcion || '');
  const [whatsapp, setWhatsapp] = useState(config.whatsapp || '+507 6215-0251');
  const [yappy, setYappy] = useState(config.yappy_numero || '6215-0251');
  const [banco, setBanco] = useState(config.banco_datos || '');
  const [direccion, setDireccion] = useState(config.direccion || 'Ciudad de Panamá, Panamá');
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig({
      nombre_tienda: nombre.trim(),
      descripcion: descripcion.trim(),
      whatsapp: whatsapp.trim(),
      yappy_numero: yappy.trim(),
      banco_datos: banco.trim(),
      direccion: direccion.trim(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif-luxury font-bold text-white text-base">
            Configuración General de la Tienda
          </h3>
          <p className="text-xs text-stone-400 font-light">
            Datos comerciales, números de cobro y horarios oficiales.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-[#100f14] border border-white/10 space-y-5 text-xs">
        <div>
          <label className="block text-stone-300 font-semibold mb-1">Nombre Comercial de la Tienda</label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-stone-300 font-semibold mb-1">Eslogan o Descripción Oficial</label>
          <textarea
            rows={2}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-[#c5a059] resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-stone-300 font-semibold mb-1">Número de WhatsApp (Ventas)</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-[#c5a059]"
            />
          </div>
          <div>
            <label className="block text-stone-300 font-semibold mb-1">Número de Yappy para Clientes</label>
            <input
              type="text"
              value={yappy}
              onChange={(e) => setYappy(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-[#c5a059]"
            />
          </div>
        </div>

        <div>
          <label className="block text-stone-300 font-semibold mb-1">Datos de Cuenta Bancaria para Transferencias</label>
          <textarea
            rows={2}
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-[#c5a059] font-mono text-xs"
          />
        </div>

        {/* Horario Requerido Informativo */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#fbbf24] flex items-center gap-1.5">
            <Clock size={14} />
            <span>Horario de Atención al Cliente (Fijado)</span>
          </span>
          <div className="space-y-1 text-stone-300 font-mono text-xs">
            <div>• Lunes a Sábado: 8:00 AM - 7:00 PM</div>
            <div>• Domingo: 8:00 AM - 5:00 PM</div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#b5914a] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-[#c5a059]/20"
          >
            {isSaved ? <Check size={14} /> : <Save size={14} />}
            <span>{isSaved ? '¡Configuración Guardada!' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
