import React from 'react';
import { LegalPageLayout } from './LegalPageLayout';
import { usePageSeo } from '../../hooks/usePageSeo';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { Shield, AlertTriangle, FileText, CheckCircle2, MapPin, Mail, Phone, CreditCard, Truck, RefreshCw } from 'lucide-react';

interface TermsPageProps {
  onGoToStore: () => void;
  onGoToPrivacy: () => void;
  onOpenAdmin?: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({
  onGoToStore,
  onGoToPrivacy,
  onOpenAdmin,
}) => {
  const { config } = useStoreConfig();
  const storeName = config.nombre_tienda || 'Pretty Store';

  // Configure SEO metadata for Terms & Conditions
  usePageSeo({
    title: 'Términos y Condiciones | Pretty Store',
    description: 'Consulta los términos y condiciones de compra, pagos con Yappy, envíos en Panamá y políticas de servicio de Pretty Store.',
    canonicalPath: '/terminos-y-condiciones',
  });

  return (
    <LegalPageLayout
      title="Términos y Condiciones"
      subtitle="Reglas, derechos y responsabilidades que rigen el uso del sitio web, la adquisición de piezas y la prestación de servicios en Pretty Store."
      badge="Marco Contractual & Comercial"
      canonicalPath="/terminos-y-condiciones"
      onGoToStore={onGoToStore}
      onGoToOtherPage={onGoToPrivacy}
      otherPageTitle="Política de Privacidad"
      otherPagePath="/politica-de-privacidad"
      onOpenAdmin={onOpenAdmin}
    >
      <article className="space-y-10 text-stone-300 font-light leading-relaxed">
        {/* Notice of Transparency */}
        <div className="p-4 sm:p-5 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
          <AlertTriangle size={18} className="shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-amber-200">Aviso de Transparencia al Consumidor:</p>
            <p className="text-[11px] leading-relaxed text-amber-200/80">
              Al navegar en este sitio web y formalizar una orden de compra, usted acepta plenamente los presentes Términos y Condiciones. Recomendamos leer detenidamente este documento antes de realizar transacciones en nuestra plataforma.
            </p>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">01.</span>
            <span>Introducción e Identificación de las Partes</span>
          </h2>
          <p className="text-xs sm:text-sm">
            El presente contrato regula los términos y condiciones de acceso, navegación y adquisición de productos ofrecidos en el sitio web con dominio principal{' '}
            <strong className="text-white font-medium">https://prettystore.store/</strong> (en adelante, la "Plataforma" o la "Tienda"), operado bajo el nombre comercial <strong className="text-white font-medium">{storeName}</strong>.
          </p>
          <div className="p-3.5 rounded-lg bg-black/40 border border-[#c5a059]/30 text-[11px] space-y-1.5 font-mono">
            <p><span className="text-stone-400">Identidad Comercial:</span> <span className="text-white font-medium">Pretty-Store</span></p>
            <p><span className="text-stone-400">Razón Social o Nombre Legal:</span> <span className="text-white font-medium">Pretty Store (Wanda Taneth Ramos Martínez)</span></p>
            <p><span className="text-stone-400">RUC y DV:</span> <span className="text-white font-medium">8-875-349 DV 33</span></p>
            <p><span className="text-stone-400">Responsable / Representante Legal:</span> <span className="text-white font-medium">Jesús Alejandro Cardona Escobar (Tel: 62150251)</span></p>
            <p><span className="text-stone-400">Domicilio Legal:</span> <span className="text-white font-medium">La Chorrera, Calle Baldomero González, Plaza Galería City Place, Local 01, Almacén Pretty Store</span></p>
            <p><span className="text-stone-400">Contacto Electrónico:</span> <span className="text-[#c5a059] font-medium">prettystoresoporte@gmail.com</span></p>
            <p><span className="text-stone-400">Línea Telefónica / WhatsApp:</span> <span className="text-white font-medium">+507 6215-0251</span></p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">02.</span>
            <span>Aceptación de los Términos</span>
          </h2>
          <p className="text-xs sm:text-sm">
            El acceso, utilización y realización de cualquier pedido a través de la Plataforma atribuye la condición de Usuario y Cliente, implicando la aceptación plena, expresa y sin reservas de la totalidad de las cláusulas contenidas en estos Términos y Condiciones, así como de nuestra Política de Privacidad. Si usted no está conforme con alguna de las estipulaciones aquí expuestas, deberá abstenerse de utilizar el sitio web y de cursar pedidos a través de él.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">03.</span>
            <span>Uso del Sitio Web y Capacidad Legal</span>
          </h2>
          <p className="text-xs sm:text-sm">
            La Plataforma está destinada a personas mayores de edad con capacidad legal suficiente para celebrar contratos vinculantes conforme a la legislación de la República de Panamá. El Usuario se compromete a:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs pl-2 text-stone-300">
            <li>Hacer un uso lícito y de buena fe de la tienda online, sin incurrir en actividades fraudulentas, lesivas o que atenten contra los derechos de terceros.</li>
            <li>Proporcionar información verídica, exacta y actualizada durante el proceso de compra, especialmente en lo relativo a datos de contacto, facturación y entrega.</li>
            <li>No realizar pedidos falsos, especulativos o fraudulentos. Ante indicios razonables de transacciones irregulares, {storeName} se reserva el derecho de anular el pedido y notificar a las autoridades competentes.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">04.</span>
            <span>Registro y Cuentas de Usuario</span>
          </h2>
          <p className="text-xs sm:text-sm">
            Para la comodidad y agilidad del Cliente, la compra de artículos en {storeName} <strong className="text-white font-medium">no exige la creación obligatoria de una cuenta previa</strong>; los pedidos pueden formalizarse directamente como cliente invitado proporcionando únicamente los datos indispensables para la facturación y entrega.
          </p>
          <p className="text-xs sm:text-sm text-stone-400">
            Las cuentas con credenciales de autenticación en la Plataforma están reservadas exclusivamente al personal administrativo y operativo para la gestión de catálogo, pedidos y almacén. Queda terminantemente prohibido cualquier intento no autorizado de acceso a las interfaces administrativas.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">05.</span>
            <span>Productos, Descripción y Disponibilidad</span>
          </h2>
          <p className="text-xs sm:text-sm">
            {storeName} se especializa en la comercialización de perfumería selecta, cronógrafos de precisión, marroquinería y piezas de moda exclusiva. Cada producto se exhibe acompañado de sus características principales, fotografías e información de catálogo. Las imágenes buscan reflejar con la mayor exactitud posible los colores y acabados de las piezas; no obstante, pueden presentarse ligeras variaciones derivadas de la calibración de cada pantalla o dispositivo.
          </p>
          <p className="text-xs sm:text-sm">
            Todos los pedidos están sujetos a disponibilidad en inventario. En caso de que se produzca una indisponibilidad sobrevenida o rotura de stock tras la confirmación de una orden, {storeName} contactará al cliente a la brevedad posible para ofrecer una alternativa equivalente o gestionar el reembolso inmediato del monto abonado.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">06.</span>
            <span>Precios y Moneda</span>
          </h2>
          <p className="text-xs sm:text-sm">
            Los precios expuestos en la Plataforma se encuentran expresados en <strong className="text-white font-medium">Dólares de los Estados Unidos de América (USD)</strong>, moneda de curso legal en la República de Panamá en paridad con el Balboa (PAB).
          </p>
          <p className="text-xs sm:text-sm">
            Los precios vigentes serán los indicados al momento de pulsar la confirmación de la orden en el checkout. {storeName} se reserva el derecho de modificar los precios en cualquier momento sin previo aviso, sin que ello afecte a las órdenes previamente aceptadas y confirmadas.
          </p>
          <p className="text-xs text-stone-400">
            Los gastos de envío a domicilio no están incluidos en el precio base de las piezas salvo indicación expresa de promociones vigentes, y se calculan o coordinan según el destino y courier seleccionado.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">07.</span>
            <span>Perfeccionamiento del Pedido</span>
          </h2>
          <p className="text-xs sm:text-sm">
            El proceso de compra en línea comprende los siguientes pasos: selección de piezas, revisión del carrito, ingreso de información de entrega y contacto, selección de método de pago, aceptación obligatoria de los Términos y la Política de Privacidad, y confirmación final de la orden.
          </p>
          <p className="text-xs sm:text-sm">
            Una vez enviado el pedido, el sistema genera un número identificador único de orden y remite acuse de recibo. El perfeccionamiento del contrato de compraventa queda supeditado a la correcta validación del pago correspondiente.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">08.</span>
            <span>Métodos de Pago Habilitados</span>
          </h2>
          <p className="text-xs sm:text-sm">
            Para ofrecer máxima comodidad y seguridad en Panamá, la Tienda pone a disposición del Cliente los siguientes métodos de pago autorizados:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-white font-medium flex items-center gap-1.5 text-xs">
                <CreditCard size={14} className="text-[#c5a059]" />
                <span>1. Yappy (Banco General)</span>
              </span>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Pago móvil directo a través del directorio Yappy o número autorizado. El cliente debe remitir el comprobante de transferencia a través del enlace directo de WhatsApp generado al concluir el pedido para su conciliación inmediata.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-white font-medium flex items-center gap-1.5 text-xs">
                <CreditCard size={14} className="text-[#c5a059]" />
                <span>2. Transferencia Bancaria Directa (ACH)</span>
              </span>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Depósito o transferencia electrónica directa a nuestra cuenta bancaria en Banco General. El despacho de los bienes queda sujeto a la acreditación efectiva de los fondos.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-white font-medium flex items-center gap-1.5 text-xs">
                <CreditCard size={14} className="text-[#c5a059]" />
                <span>3. Tarjetas de Crédito / Débito (Pasarela)</span>
              </span>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Pagos procesados mediante enlace seguro de pasarela autorizada (PagueloFácil). {storeName} no almacena datos de tarjeta de crédito en sus servidores locales.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
              <span className="text-white font-medium flex items-center gap-1.5 text-xs">
                <CreditCard size={14} className="text-[#c5a059]" />
                <span>4. Pago en Efectivo contra Entrega</span>
              </span>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Habilitado para retiros presenciales coordinados en nuestro local o en zonas de entrega con cobertura de contraentrega autorizada.
              </p>
            </div>
          </div>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">09.</span>
            <span>Procesamiento y Seguridad de los Pagos</span>
          </h2>
          <p className="text-xs sm:text-sm">
            Las operaciones de pago se canalizan a través de conexiones cifradas mediante protocolo SSL/TLS de 256 bits. El Cliente garantiza que ostenta la titularidad o la debida autorización para emplear el medio de pago seleccionado.
          </p>
          <p className="text-xs sm:text-sm text-stone-400">
            En caso de pagos por Yappy o ACH, es indispensable el suministro de un número de referencia o imagen del comprobante emitido por la entidad bancaria. Cualquier inconsistencia, anulación o cargo no reconocido facultará a {storeName} a suspender la entrega hasta la resolución de la incidencia.
          </p>
        </section>

        {/* Section 10 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">10.</span>
            <span>Envíos, Despacho y Entregas</span>
          </h2>
          <p className="text-xs sm:text-sm">
            {storeName} ofrece dos modalidades de entrega en el territorio nacional de la República de Panamá:
          </p>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg">
              <strong className="text-white block mb-0.5">A. Retiro en Tienda / Boutique Física:</strong>
              <p className="text-stone-400 text-[11px]">
                Sin costo de envío. El cliente podrá retirar su paquete una vez confirmada la preparación del pedido en nuestra ubicación física:{' '}
                <a href="https://maps.app.goo.gl/PxA3suMXNZxuFF5X7" target="_blank" rel="noreferrer" className="text-[#c5a059] underline underline-offset-2">
                  Ver Ubicación en Google Maps
                </a>{' '}
                previa coordinación de horario.
              </p>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg">
              <strong className="text-white block mb-0.5">B. Envío a Domicilio / Sucursal por Courier:</strong>
              <p className="text-stone-400 text-[11px]">
                Despachos realizados a través de empresas de mensajería aliadas (Uno Express, Ferguson, Servientrega u operadores autorizados).
              </p>
              <div className="mt-2 p-2.5 rounded bg-black/40 border border-[#c5a059]/30 text-stone-300 text-[11px] font-sans">
                Despachos a Panamá Capital y Panamá Oeste (24 a 48 horas hábiles). Envíos a provincias centrales e interior (48 a 72 horas hábiles) a través de Servientrega, Ferguson y Uno Express, según las tarifas seleccionadas durante el proceso de compra.
              </div>
            </div>
          </div>
          <p className="text-xs text-stone-400">
            Es responsabilidad exclusiva del Cliente verificar que la dirección de entrega suministrada sea precisa y cuente con personal autorizado para la recepción del paquete.
          </p>
        </section>

        {/* Section 11 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">11.</span>
            <span>Responsabilidad del Usuario</span>
          </h2>
          <p className="text-xs sm:text-sm">
            El Usuario asume la responsabilidad por las actividades que se originen desde sus dispositivos o redes al interactuar con la Plataforma. Queda prohibida la introducción de virus, troyanos, ataques de denegación de servicio o cualquier intromisión informática no autorizada destinada a menoscabar la operatividad de los servidores y bases de datos.
          </p>
        </section>

        {/* Section 13 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">13.</span>
            <span>Propiedad Intelectual y Derechos de Autor</span>
          </h2>
          <p className="text-xs sm:text-sm">
            Todos los contenidos incluidos en la Plataforma, tales como textos, diseños gráficos, logotipos, íconos, imágenes, clips de video, código fuente, compilaciones de datos y software, son propiedad exclusiva de {storeName} o de sus respectivos titulares y licenciantes legítimos, encontrándose protegidos por las leyes de propiedad intelectual de Panamá y tratados internacionales. Queda prohibida su reproducción, distribución o explotación comercial sin autorización expresa y por escrito.
          </p>
        </section>

        {/* Section 14 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">14.</span>
            <span>Disponibilidad del Servicio y Exclusión de Garantías</span>
          </h2>
          <p className="text-xs sm:text-sm">
            {storeName} realiza sus mejores esfuerzos para garantizar la disponibilidad continua e ininterrumpida de la Plataforma; sin embargo, el acceso puede verse temporalmente suspendido por labores de mantenimiento técnico, actualizaciones o causas de fuerza mayor fuera de nuestro control. No seremos responsables por pérdidas o perjuicios derivados de caídas imprevistas de la red o de proveedores externos de telecomunicaciones.
          </p>
        </section>

        {/* Section 15 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">15.</span>
            <span>Modificaciones de los Términos</span>
          </h2>
          <p className="text-xs sm:text-sm">
            Nos reservamos el derecho de modificar o actualizar estos Términos y Condiciones en cualquier momento para adaptarlos a novedades legislativas, cambios en la operativa o mejoras de la tienda. Las modificaciones entrarán en vigencia desde su publicación en esta misma URL, identificada con la fecha de actualización correspondiente.
          </p>
        </section>

        {/* Section 16 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">16.</span>
            <span>Legislación Aplicable y Jurisdicción</span>
          </h2>
          <p className="text-xs sm:text-sm">
            Los presentes Términos y Condiciones se rigen e interpretan con arreglo a las leyes de la <strong className="text-white font-medium">República de Panamá</strong>, incluyendo la Ley 45 de 31 de octubre de 2007 (Sobre Protección al Consumidor y Defensa de la Competencia) y la Ley 51 de 22 de julio de 2008 (Sobre Comercio Electrónico y Documentos y Firmas Electrónicas). Para cualquier controversia derivada del presente contrato, las partes acuerdan someterse a la jurisdicción de los tribunales ordinarios de justicia de la Ciudad de Panamá, renunciando a cualquier otro fuero que pudiera corresponderles.
          </p>
        </section>

        {/* Section 17 */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-serif-luxury font-semibold text-white tracking-[0.04em] flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <span className="text-[#c5a059] font-mono text-sm">17.</span>
            <span>Canales de Contacto y Atención al Cliente</span>
          </h2>
          <p className="text-xs sm:text-sm">
            Para dudas, consultas o aclaraciones respecto a los presentes Términos y Condiciones, ponemos a su disposición nuestros canales directos:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg flex items-center gap-2.5">
              <Mail size={15} className="text-[#c5a059] shrink-0" />
              <div>
                <span className="text-stone-400 block text-[10px]">Correo Electrónico:</span>
                <span className="text-white font-medium">{config.email || 'contacto@prettystore.store'}</span>
              </div>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg flex items-center gap-2.5">
              <Phone size={15} className="text-[#c5a059] shrink-0" />
              <div>
                <span className="text-stone-400 block text-[10px]">Teléfono / WhatsApp:</span>
                <span className="text-white font-medium">{config.telefono || '+507 6215-0251'}</span>
              </div>
            </div>
          </div>
        </section>
      </article>
    </LegalPageLayout>
  );
};
