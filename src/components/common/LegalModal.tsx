import React, { useState } from 'react';
import { X, ShieldCheck, FileText, RefreshCw, Mail, Phone, MapPin } from 'lucide-react';
import { useStoreConfig } from '../../context/StoreConfigContext';

export type LegalTab = 'privacidad' | 'terminos' | 'cambios' | 'contacto';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacidad',
}) => {
  const { config } = useStoreConfig();
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0e0e12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col selection:bg-[#c5a059] selection:text-black">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#c5a059] font-medium block mb-0.5">
              {config.nombre_tienda || 'Pretty-Store'} • Información Legal
            </span>
            <h2 className="text-lg sm:text-xl font-serif-luxury font-medium text-white">
              Términos, Privacidad & Garantías
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-white/[0.08] bg-black/20 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('privacidad')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'privacidad'
                ? 'border-[#c5a059] text-white bg-white/[0.02]'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={14} className={activeTab === 'privacidad' ? 'text-[#c5a059]' : 'text-stone-400'} />
            <span>Política de Privacidad</span>
          </button>

          <button
            onClick={() => setActiveTab('terminos')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'terminos'
                ? 'border-[#c5a059] text-white bg-white/[0.02]'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            <FileText size={14} className={activeTab === 'terminos' ? 'text-[#c5a059]' : 'text-stone-400'} />
            <span>Términos y Condiciones</span>
          </button>

          <button
            onClick={() => setActiveTab('cambios')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'cambios'
                ? 'border-[#c5a059] text-white bg-white/[0.02]'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            <RefreshCw size={14} className={activeTab === 'cambios' ? 'text-[#c5a059]' : 'text-stone-400'} />
            <span>Cambios y Devoluciones</span>
          </button>

          <button
            onClick={() => setActiveTab('contacto')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'contacto'
                ? 'border-[#c5a059] text-white bg-white/[0.02]'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            <Mail size={14} className={activeTab === 'contacto' ? 'text-[#c5a059]' : 'text-stone-400'} />
            <span>Contacto</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs text-stone-300 font-light leading-relaxed">
          {activeTab === 'privacidad' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                  1. Tratamiento y Protección de Datos Personales
                </h3>
                <p>
                  En {config.nombre_tienda || 'Pretty-Store'}, nos comprometemos a salvaguardar la privacidad de nuestros clientes de conformidad con las mejores prácticas internacionales y las leyes aplicables de protección de datos personales. Los datos recabados a través de nuestro sitio web (incluyendo nombre, número de teléfono, dirección de entrega y correo electrónico) son utilizados exclusivamente para la gestión, facturación, despacho y seguimiento de sus pedidos.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                  2. Confidencialidad y Seguridad
                </h3>
                <p>
                  Sus datos personales nunca serán vendidos, transferidos ni comercializados a terceras partes ajenas a la relación comercial directa con la boutique. El acceso a su información de contacto y pedidos está estrictamente restringido al personal autorizado y debidamente autenticado mediante controles de seguridad por roles (Row Level Security).
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                  3. Transacciones y Datos Financieros
                </h3>
                <p>
                  {config.nombre_tienda || 'Pretty-Store'} no almacena números completos de tarjetas de crédito o débito, códigos de seguridad (CVV) ni contraseñas bancarias en sus bases de datos. Los pagos electrónicos se coordinan a través de canales bancarios seguros (Yappy, ACH) o pasarelas de pago certificadas con cifrado SSL.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                  4. Derechos de los Titulares
                </h3>
                <p>
                  Usted tiene derecho a consultar, actualizar, rectificar o solicitar la supresión de sus datos personales de nuestro directorio en cualquier momento contactándonos directamente a través de nuestros canales oficiales de atención al cliente.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'terminos' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                  1. Ámbito de Aplicación
                </h3>
                <p>
                  Los presentes Términos y Condiciones regulan el uso del catálogo en línea y los procesos de compra en la boutique {config.nombre_tienda || 'Pretty-Store'}. Al registrar un pedido a través de nuestro sitio web, el cliente acepta los términos aquí descritos.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                  2. Precios y Disponibilidad
                </h3>
                <p>
                  Todos los precios están expresados en dólares de los Estados Unidos de América (USD) y corresponden a valores autorizados por la tienda. Las compras están sujetas a la verificación de existencias en inventario al momento de procesar el pedido.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                  3. Modalidades de Entrega
                </h3>
                <p>
                  Ofrecemos opciones de retiro en boutique física y envíos a nivel nacional a través de empresas de logística reconocidas (Uno Express, Ferguson, Servi Entrega). Los tiempos estimados y costos específicos de flete se coordinan directamente según la localidad de destino.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                  4. Verificación de Pagos
                </h3>
                <p>
                  El registro de un pedido genera un comprobante con estado 'Pendiente'. La confirmación y despacho de la orden queda sujeta a la validación efectiva del pago por parte de nuestro departamento de administración o a la confirmación de la pasarela autorizada.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'cambios' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                  1. Política de Cambios y Garantía
                </h3>
                <p>
                  En {config.nombre_tienda || 'Pretty-Store'}, garantizamos la autenticidad y excelencia de cada una de nuestras piezas. Si al momento de recibir su pedido la pieza presenta algún inconveniente o discrepancia con respecto a lo solicitado, puede gestionar su solicitud de cambio dentro del plazo acordado comunicándose con nuestro equipo de atención.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                  2. Condiciones para el Cambio
                </h3>
                <p>
                  Para ser elegible para cambio o revisión por garantía:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-stone-400">
                  <li>El artículo debe encontrarse sin uso, en su empaque original, con estuches, manuales y certificados correspondientes.</li>
                  <li>Presentar el número o comprobante de pedido emitido por la boutique.</li>
                  <li>Notificar a nuestro canal de soporte dentro del plazo estipulado posterior a la entrega.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                  3. Procedimiento
                </h3>
                <p>
                  Coordine la revisión de la pieza contactándonos por WhatsApp o acercándose directamente a nuestra boutique física con su comprobante de compra.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'contacto' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                  Canales Oficiales de Atención al Cliente
                </h3>
                <p className="mb-4">
                  Para consultas sobre pedidos, disponibilidad de piezas exclusivas, asesoría personalizada o solicitudes de privacidad:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                  <div className="flex items-center gap-2 text-stone-300 font-medium">
                    <Phone size={14} className="text-[#c5a059]" />
                    <span>WhatsApp & Teléfono</span>
                  </div>
                  <p className="text-xs text-[#c5a059] font-mono">
                    {config.whatsapp || config.telefono || '+507 6890-1234'}
                  </p>
                  <p className="text-[11px] text-stone-500">Atención personalizada y seguimiento</p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                  <div className="flex items-center gap-2 text-stone-300 font-medium">
                    <Mail size={14} className="text-[#c5a059]" />
                    <span>Correo Electrónico</span>
                  </div>
                  <p className="text-xs text-stone-300 font-mono truncate">
                    {config.email || 'contacto@pretty-store.com'}
                  </p>
                  <p className="text-[11px] text-stone-500">Consultas corporativas y soporte</p>
                </div>

                <div className="sm:col-span-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                  <div className="flex items-center gap-2 text-stone-300 font-medium">
                    <MapPin size={14} className="text-[#c5a059]" />
                    <span>Ubicación de la Boutique</span>
                  </div>
                  <p className="text-xs text-stone-300">
                    {config.direccion || 'Boulevard Costa del Este, Torre Financial Park, Ciudad de Panamá'}
                  </p>
                  <p className="text-[11px] text-stone-500">Atención en tienda física previa coordinación</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-black/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white hover:bg-stone-200 text-black text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
