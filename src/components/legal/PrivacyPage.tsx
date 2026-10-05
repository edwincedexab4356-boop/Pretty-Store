import React from 'react';
import { LegalPageLayout } from './LegalPageLayout';
import { usePageSeo } from '../../hooks/usePageSeo';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { ShieldCheck, Lock, Database, Cpu, Eye, FileText, CheckCircle2, AlertCircle, Mail, Phone, Server } from 'lucide-react';

interface PrivacyPageProps {
  onGoToStore: () => void;
  onGoToTerms: () => void;
  onOpenAdmin?: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({
  onGoToStore,
  onGoToTerms,
  onOpenAdmin,
}) => {
  const { config } = useStoreConfig();
  const storeName = config.nombre_tienda || 'Pretty Store';

  // Configure SEO metadata for Privacy Policy
  usePageSeo({
    title: 'Política de Privacidad | Pretty Store',
    description: 'Conoce cómo Pretty Store protege y trata tus datos personales conforme a la Ley 81 de 2019 de la República de Panamá.',
    canonicalPath: '/politica-de-privacidad',
  });

  return (
    <LegalPageLayout
      title="Política de Privacidad"
      subtitle="Compromiso de protección de datos personales, tratamiento responsable y derechos de los titulares conforme a la legislación de la República de Panamá."
      badge="Protección de Datos & Ley 81 de 2019"
      canonicalPath="/politica-de-privacidad"
      onGoToStore={onGoToStore}
      onGoToOtherPage={onGoToTerms}
      otherPageTitle="Términos y Condiciones"
      otherPagePath="/terminos-y-condiciones"
      onOpenAdmin={onOpenAdmin}
    >
      <article className="space-y-10 text-stone-300 font-light leading-relaxed">
        {/* Compliance Notice */}
        <div className="p-4 sm:p-5 rounded-xl bg-blue-500/[0.05] border border-blue-500/20 text-xs text-blue-200/90 flex items-start gap-3">
          <ShieldCheck size={18} className="shrink-0 text-blue-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-blue-200">Marco Legal Aplicable (República de Panamá):</p>
            <p className="text-[11px] leading-relaxed text-blue-200/80">
              Esta política ha sido estructurada en observancia de la <strong className="text-white font-medium">Ley 81 de 26 de marzo de 2019</strong> sobre Protección de Datos Personales de la República de Panamá y su reglamentación mediante el <strong className="text-white font-medium">Decreto Ejecutivo 285 de 28 de mayo de 2021</strong>. La presente política de privacidad describe nuestras prácticas operativas; no obstante, {storeName} aclara que la mera existencia o publicación de este documento no constituye por sí sola una certificación de cumplimiento automático ni sustituye las auditorías y deberes normativos continuos aplicables al responsable del tratamiento.
            </p>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">01.</span>
            <span>Responsable del Tratamiento de los Datos</span>
          </h2>
          <p className="text-xs sm:text-sm">
            El responsable del tratamiento de las bases de datos generadas a través del sitio web{' '}
            <strong className="text-white font-medium">https://prettystore.store/</strong> es la persona natural o jurídica que opera bajo el nombre comercial <strong className="text-white font-medium">{storeName}</strong>:
          </p>
          <div className="p-3.5 rounded-lg bg-black/40 border border-white/10 text-[11px] space-y-1.5 font-mono">
            <p><span className="text-stone-400">Identidad Comercial:</span> <span className="text-white">{storeName}</span></p>
            <p><span className="text-stone-400">Razón Social o Nombre Legal:</span> <span className="text-amber-400">[COMPLETAR POR EL PROPIETARIO - Razón Social o Nombre Legal del Titular]</span></p>
            <p><span className="text-stone-400">RUC y DV:</span> <span className="text-amber-400">[COMPLETAR POR EL PROPIETARIO - Número de RUC y Dígito Verificador]</span></p>
            <p><span className="text-stone-400">Responsable / Oficial de Privacidad:</span> <span className="text-amber-400">[COMPLETAR POR EL PROPIETARIO - Nombre del Oficial o Contacto de Protección de Datos]</span></p>
            <p><span className="text-stone-400">Correo para Asuntos de Privacidad:</span> <span className="text-white">{config.email || 'contacto@prettystore.store'}</span></p>
            <p><span className="text-stone-400">Dirección para Notificaciones Físicas:</span> <span className="text-amber-400">[COMPLETAR POR EL PROPIETARIO - Dirección Física en Panamá]</span></p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">02.</span>
            <span>Datos Personales que Recopila Pretty Store</span>
          </h2>
          <p className="text-xs sm:text-sm">
            En estricto cumplimiento del principio de proporcionalidad y minimización de datos (Artículo 5 de la Ley 81 de 2019), {storeName} solo solicita y almacena los datos personales estrictamente indispensables para la relación comercial y la entrega de pedidos. Las categorías de datos comprenden:
          </p>
          <div className="space-y-2 text-xs pt-1">
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg">
              <strong className="text-white block mb-0.5 font-medium">A. Datos de Identificación y Contacto:</strong>
              <p className="text-stone-400 text-[11px]">
                Nombre y apellido del cliente o destinatario, número telefónico móvil o de WhatsApp para notificaciones sobre el envío, y dirección de correo electrónico para el envío de confirmaciones o recibos de compra.
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg">
              <strong className="text-white block mb-0.5 font-medium">B. Datos de Entrega y Logística:</strong>
              <p className="text-stone-400 text-[11px]">
                Provincia, distrito, dirección detallada de entrega en Panamá, referencias físicas y notas especiales provistas por el comprador para facilitar la entrega al mensajero o transportista.
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg">
              <strong className="text-white block mb-0.5 font-medium">C. Datos de Transacción y Pedido:</strong>
              <p className="text-stone-400 text-[11px]">
                Detalle de piezas seleccionadas, montos, método de pago escogido (Yappy, ACH, Tarjeta, Efectivo) y número de referencia o imagen del comprobante de transferencia bancaria enviado voluntariamente por el cliente. {storeName} <strong className="text-stone-200">no almacena números completos de tarjetas de crédito o débito ni códigos CVV</strong> en sus servidores.
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg">
              <strong className="text-white block mb-0.5 font-medium">D. Datos de Cuentas Administrativas:</strong>
              <p className="text-stone-400 text-[11px]">
                Exclusivo del personal interno autorizado: correo electrónico, nombre de perfil y credenciales de acceso autenticadas y cifradas mediante Supabase Auth. Los clientes no requieren crear una cuenta para comprar.
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg">
              <strong className="text-white block mb-0.5 font-medium">E. Información Técnica y de Navegación:</strong>
              <p className="text-stone-400 text-[11px]">
                Dirección IP de conexión, tipo de navegador, registros técnicos de peticiones al servidor web y cookies estrictamente técnicas necesarias para mantener la operatividad y estabilidad del sitio.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">03.</span>
            <span>Finalidades del Tratamiento de los Datos</span>
          </h2>
          <p className="text-xs sm:text-sm">
            Los datos personales recopilados se tratan para finalidades legítimas, explícitas y concretas:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs pl-2 text-stone-300">
            <li><strong className="text-white">Procesamiento y Gestión de Pedidos:</strong> Registrar, validar el pago, preparar el empaque y coordinar el despacho o retiro de las piezas adquiridas.</li>
            <li><strong className="text-white">Comunicación con el Cliente:</strong> Enviar acuses de recibo, coordinar entregas vía WhatsApp o llamada telefónica, y resolver cualquier consulta relacionada con el estado del pedido.</li>
            <li><strong className="text-white">Atención al Cliente:</strong> Responder dudas, aclaraciones, soporte técnico y seguimiento personalizado del pedido.</li>
            <li><strong className="text-white">Seguridad y Prevención de Fraudes:</strong> Proteger la integridad de la tienda frente a pedidos falsos, transacciones sospechosas y verificar pagos mediante Yappy o tarjeta.</li>
            <li><strong className="text-white">Cumplimiento Legal y Tributario:</strong> Conservar los registros de ventas y transacciones comerciales conforme a las obligaciones fiscales y contables vigentes en Panamá.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">04.</span>
            <span>Plazos de Conservación de los Datos</span>
          </h2>
          <p className="text-xs sm:text-sm">
            Los datos personales se conservarán únicamente durante el tiempo estrictamente necesario para cumplir con las finalidades para las cuales fueron recabados, o mientras se mantenga la relación comercial entre las partes.
          </p>
          <p className="text-xs sm:text-sm text-stone-400">
            Posteriormente, los datos vinculados a facturación y transacciones se conservarán debidamente bloqueados durante los plazos legales previstos por el Código de Comercio de Panamá y la legislación tributaria aplicable, tras lo cual se procederá a su eliminación segura o anonimización definitiva.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">05.</span>
            <span>Derechos de los Titulares (Derechos ARCO y Portabilidad)</span>
          </h2>
          <p className="text-xs sm:text-sm">
            En virtud de los Artículos 15 al 20 de la Ley 81 de 2019 de la República de Panamá, el titular de los datos personales cuenta con los siguientes derechos fundamentales:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-1">
              <span className="text-[#c5a059] font-medium block">1. Derecho de Acceso</span>
              <p className="text-[11px] text-stone-400">
                Obtener de {storeName} la confirmación de si sus datos personales están siendo tratados, la procedencia de los mismos y las finalidades a las cuales se destinan.
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-1">
              <span className="text-[#c5a059] font-medium block">2. Derecho de Rectificación</span>
              <p className="text-[11px] text-stone-400">
                Solicitar la corrección o actualización de sus datos personales cuando estos resulten inexactos, desactualizados, incompletos o erróneos.
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-1">
              <span className="text-[#c5a059] font-medium block">3. Derecho de Cancelación</span>
              <p className="text-[11px] text-stone-400">
                Solicitar la eliminación o supresión de sus datos personales cuando considere que no están siendo tratados conforme a la ley o hayan dejado de ser necesarios.
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-1">
              <span className="text-[#c5a059] font-medium block">4. Derecho de Oposición</span>
              <p className="text-[11px] text-stone-400">
                Oponerse al tratamiento de sus datos personales por motivos fundados y legítimos, o cuando el tratamiento tenga por objeto fines de prospección publicitaria.
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg sm:col-span-2 space-y-1">
              <span className="text-[#c5a059] font-medium block">5. Derecho de Portabilidad</span>
              <p className="text-[11px] text-stone-400">
                Recibir sus datos personales en un formato estructurado, genérico y de uso común, o solicitar su transmisión directa a otro responsable cuando sea técnicamente factible.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">06.</span>
            <span>Procedimiento para el Ejercicio de sus Derechos</span>
          </h2>
          <p className="text-xs sm:text-sm">
            Para ejercer cualquiera de los derechos descritos, el titular o su apoderado debidamente acreditado deberá remitir una solicitud por correo electrónico a:
          </p>
          <div className="p-3.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-[#c5a059]">
            {config.email || 'contacto@pretty store.com'}
          </div>
          <p className="text-xs sm:text-sm">
            La solicitud debe contener:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs pl-2 text-stone-300">
            <li>Nombre completo y número de cédula o pasaporte del titular de los datos.</li>
            <li>Descripción clara y precisa de los datos objeto de la solicitud y el derecho específico que desea ejercer (Acceso, Rectificación, Cancelación, Oposición o Portabilidad).</li>
            <li>Documentación que respalde su solicitud en caso de rectificación de datos inexactos.</li>
            <li>Datos de contacto para notificar la respuesta.</li>
          </ul>
          <p className="text-xs text-stone-400">
            Conforme a la normativa panameña, las solicitudes serán atendidas dentro de los plazos legales establecidos en el Decreto Ejecutivo 285 de 2021.
          </p>
        </section>

        {/* Section 7 - Required AI Section */}
        <section className="space-y-3 p-5 rounded-2xl bg-[#121217] border border-[#c5a059]/25 shadow-lg">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <Cpu size={16} className="text-[#c5a059]" />
            <span>Uso de tecnologías de inteligencia artificial</span>
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed">
            {storeName} puede utilizar herramientas de software y tecnologías basadas en inteligencia artificial para determinadas funciones relacionadas con la optimización operativa, generación de código, diseño, análisis estadístico agregado, asistencia técnica y mejora continua de la plataforma digital.
          </p>
          <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-2 text-xs">
            <span className="text-white font-medium block text-xs flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Transparencia y Diferenciación Operativa:</span>
            </span>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              <strong className="text-white">Fase de Desarrollo vs. Entorno de Producción:</strong> Las herramientas de asistencia de Inteligencia Artificial han sido empleadas exclusivamente durante la fase de diseño, arquitectura y programación técnica de esta tienda en línea. En la actualidad, <strong className="text-white">Pretty Store NO transmite, no vende ni procesa datos personales identificables de clientes</strong> (tales como nombres, números de teléfono, correos electrónicos, direcciones físicas o comprobantes de pago) a través de modelos de inteligencia artificial generativa externos en producción.
            </p>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              En el eventual caso de que la Tienda incorpore en el futuro funcionalidades de producción impulsadas por IA que interactúen con el cliente (por ejemplo, asistentes conversacionales de compra o motores de recomendación automatizados), se informará expresamente al usuario sobre dicha tecnología y se recabará el consentimiento requerido conforme a la Ley 81 de 2019 de la República de Panamá.
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">08.</span>
            <span>Proveedores Externos de Servicios y Transferencias de Datos</span>
          </h2>
          <p className="text-xs sm:text-sm">
            Para la correcta prestación de los servicios comerciales, {storeName} contrata con proveedores especializados que actúan en calidad de encargados del tratamiento o terceros receptores legítimos, bajo estrictos estándares de confidencialidad y seguridad:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-1">
              <strong className="text-white block text-xs font-medium">Infraestructura y Base de Datos (Supabase):</strong>
              <p className="text-[11px] text-stone-400">
                Almacenamiento de catálogo, pedidos y autenticación en servidores seguros en la nube protegidos por protocolos de cifrado y aislamiento por capas.
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-1">
              <strong className="text-white block text-xs font-medium">Pasarelas de Pago y Entidades Bancarias:</strong>
              <p className="text-[11px] text-stone-400">
                PagueloFácil, Yappy y Banco General de Panamá. El tratamiento de los datos financieros se rige por las políticas de privacidad y certificaciones bancarias de cada operador.
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-1">
              <strong className="text-white block text-xs font-medium">Empresas de Logística y Mensajería:</strong>
              <p className="text-[11px] text-stone-400">
                Uno Express, Ferguson, Servientrega u operadores locales. Se les transmite únicamente el nombre, teléfono y dirección necesarios para completar la entrega física del paquete.
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-1">
              <strong className="text-white block text-xs font-medium">Canales de Comunicación (WhatsApp / Meta):</strong>
              <p className="text-[11px] text-stone-400">
                Comunicación directa iniciada por el cliente mediante la API de wa.me para la remisión voluntaria de comprobantes de pago o consultas de pedidos.
              </p>
            </div>
          </div>
          <p className="text-xs text-stone-400">
            {storeName} no comercializa, no alquila ni cede bases de datos personales a terceros para finalidades distintas a las expresamente autorizadas por el Cliente.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">09.</span>
            <span>Medidas de Seguridad de la Información</span>
          </h2>
          <p className="text-xs sm:text-sm">
            Adoptamos medidas técnicas, administrativas y organizativas razonables para salvaguardar la confidencialidad, integridad y disponibilidad de los datos personales frente a accesos no autorizados, pérdidas, alteraciones o destrucción. Esto incluye el cifrado SSL/TLS en tránsito y políticas de acceso restringido con privilegios mínimos para el personal administrativo.
          </p>
        </section>

        {/* Section 10 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">10.</span>
            <span>Modificaciones a la Política de Privacidad</span>
          </h2>
          <p className="text-xs sm:text-sm">
            {storeName} se reserva el derecho de modificar esta Política de Privacidad periódicamente a fin de reflejar mejoras en la plataforma o exigencias normativas dictadas por la Autoridad Nacional de Transparencia y Acceso a la Información (ANTAI) u organismos competentes de Panamá. Toda modificación será publicada en esta misma página con indicación de su fecha de entrada en vigencia.
          </p>
        </section>

        {/* Section 11 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">11.</span>
            <span>Contacto para Consultas de Privacidad</span>
          </h2>
          <p className="text-xs sm:text-sm">
            Si tiene dudas, observaciones o requiere información adicional sobre el tratamiento de sus datos personales, puede comunicarse directamente con nuestro equipo:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg flex items-center gap-2.5">
              <Mail size={15} className="text-[#c5a059] shrink-0" />
              <div>
                <span className="text-stone-400 block text-[10px]">Atención de Privacidad:</span>
                <span className="text-white font-medium">{config.email || 'contacto@pretty store.com'}</span>
              </div>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg flex items-center gap-2.5">
              <Phone size={15} className="text-[#c5a059] shrink-0" />
              <div>
                <span className="text-stone-400 block text-[10px]">Línea Directa:</span>
                <span className="text-white font-medium">{config.telefono || '+507 6215-0251'}</span>
              </div>
            </div>
          </div>
        </section>
      </article>
    </LegalPageLayout>
  );
};
