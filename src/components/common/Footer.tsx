import React, { useState } from 'react';
import { Smartphone, Mail, MapPin, Instagram, MessageCircle } from 'lucide-react';
import { Categoria } from '../../types/database';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { LegalModal, LegalTab } from './LegalModal';
import { ContactModal } from './ContactModal';

interface FooterProps {
  categories: Categoria[];
  onSelectCategory: (id: string) => void;
  onOpenAdmin?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  categories,
  onSelectCategory,
  onOpenAdmin,
  onOpenTerms,
  onOpenPrivacy,
}) => {
  const { config } = useStoreConfig();
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('privacidad');

  const [footerTaps, setFooterTaps] = useState(0);

  const handleFooterLogoTap = () => {
    const next = footerTaps + 1;
    if (next >= 5) {
      setFooterTaps(0);
      if (onOpenAdmin) onOpenAdmin();
      return;
    }
    setFooterTaps(next);
    setTimeout(() => setFooterTaps(0), 2500);
    scrollToTop();
  };

  const openLegal = (tab: LegalTab) => {
    setLegalTab(tab);
    setIsLegalOpen(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#070709] border-t border-white/[0.08] text-stone-400 text-xs">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <button
              onClick={handleFooterLogoTap}
              className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
              title="Pretty Store"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden bg-black border border-white/15 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <img
                  src={config.logo_url || '/images/logo/logotipo.jpeg'}
                  alt={config.nombre_tienda || 'Pretty Store'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.endsWith('/images/logo/logo.png')) {
                      target.src = '/images/logo/logo.png';
                    }
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-serif-luxury font-medium tracking-[0.16em] text-white uppercase leading-none transition-colors group-hover:text-[#c5a059]">
                  {config.nombre_tienda || 'Pretty Store'}
                </span>
                <span className="text-[8px] uppercase tracking-[0.3em] text-[#a1a1aa] mt-1 font-light">
                  Haute Horlogerie & Atelier
                </span>
              </div>
            </button>

            <p className="text-stone-400 text-xs leading-relaxed max-w-sm font-light">
              {config.descripcion ||
                'Boutique exclusiva de gorras legendarias, accesorios selectos y moda urbana diseñada con los más elevados estándares de distinción.'}
            </p>

            {/* Social links con el nombre debajo de cada logo */}
            <div className="pt-2 flex flex-wrap items-start gap-4 sm:gap-5 text-stone-400">
              {/* Instagram Principal */}
              <a
                href={config.instagram || 'https://instagram.com/pretty_store_pty'}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-1.5 group text-center min-w-[52px]"
                aria-label="Instagram"
                title="Instagram"
              >
                <div className="w-9 h-9 rounded-full border border-white/10 group-hover:border-[#fbbf24] text-stone-300 group-hover:text-[#fbbf24] flex items-center justify-center transition-all bg-white/[0.03] group-hover:bg-white/[0.08] shadow-sm">
                  <Instagram size={17} />
                </div>
                <span className="text-[10px] text-stone-400 group-hover:text-white transition-colors tracking-tight font-medium">
                  Instagram
                </span>
              </a>

              {/* Instagram (2) Solicitado */}
              <a
                href="https://www.instagram.com/tienda_prettystore2?stkn=MTR1MGo5YTJ1N3VycQ=="
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-1.5 group text-center min-w-[66px]"
                aria-label="Instagram (2)"
                title="Instagram (2)"
              >
                <div className="w-9 h-9 rounded-full border border-white/10 group-hover:border-[#fbbf24] text-stone-300 group-hover:text-[#fbbf24] flex items-center justify-center transition-all bg-white/[0.03] group-hover:bg-white/[0.08] shadow-sm relative">
                  <Instagram size={17} />
                  <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-[#fbbf24] text-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-sm">
                    2
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 group-hover:text-white transition-colors tracking-tight font-medium">
                  Instagram (2)
                </span>
              </a>

              {/* TikTok */}
              <a
                href={config.tiktok || 'https://www.tiktok.com/@tienda_prettystore?_r=1&_t=ZS-9A8sgqEMvKS'}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-1.5 group text-center min-w-[50px]"
                aria-label="TikTok"
                title="TikTok @tienda_prettystore"
              >
                <div className="w-9 h-9 rounded-full border border-white/10 group-hover:border-white text-stone-300 group-hover:text-white flex items-center justify-center transition-all bg-white/[0.03] group-hover:bg-white/[0.08] shadow-sm">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.08a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.51z" />
                  </svg>
                </div>
                <span className="text-[10px] text-stone-400 group-hover:text-white transition-colors tracking-tight font-medium">
                  TikTok
                </span>
              </a>

              {/* WhatsApp Oficial 6215-0251 */}
              <a
                href="https://wa.me/50762150251"
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-1.5 group text-center min-w-[56px]"
                aria-label="WhatsApp"
                title="WhatsApp 6215-0251"
              >
                <div className="w-9 h-9 rounded-full border border-emerald-500/40 group-hover:border-emerald-400 text-emerald-400 group-hover:text-emerald-300 flex items-center justify-center transition-all bg-emerald-500/10 group-hover:bg-emerald-500/20 shadow-sm">
                  <MessageCircle size={17} />
                </div>
                <span className="text-[10px] text-emerald-400 group-hover:text-emerald-300 transition-colors tracking-tight font-medium">
                  WhatsApp
                </span>
              </a>
            </div>
          </div>

          {/* Navigation Links (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-white text-[11px] uppercase tracking-[0.25em] font-medium font-serif-luxury">
              Navegación
            </h4>
            <ul className="space-y-2 text-xs font-light">
              <li>
                <button
                  onClick={scrollToTop}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Inicio
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Tienda
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    document.getElementById('categorias')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Colecciones
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    document.getElementById('editoriales')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Sobre Nosotros
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsContactOpen(true)}
                  className="hover:text-white text-[#e8c872] font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <MessageCircle size={13} className="text-[#e8c872]" />
                  <span>Contáctanos</span>
                </button>
              </li>
              <li>
                <a
                  href="/terminos-y-condiciones"
                  onClick={(e) => {
                    if (onOpenTerms) {
                      e.preventDefault();
                      onOpenTerms();
                    }
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <a
                  href="/politica-de-privacidad"
                  onClick={(e) => {
                    if (onOpenPrivacy) {
                      e.preventDefault();
                      onOpenPrivacy();
                    }
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Política de Privacidad
                </a>
              </li>
            </ul>
          </div>

          {/* Categories (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-white text-[11px] uppercase tracking-[0.25em] font-medium font-serif-luxury">
              Colecciones
            </h4>
            <ul className="space-y-2 text-xs font-light">
              <li>
                <button
                  onClick={() => {
                    onSelectCategory('all');
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Todas las Piezas
                </button>
              </li>
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      onSelectCategory(cat.id);
                      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {cat.nombre}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Payments (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-white text-[11px] uppercase tracking-[0.25em] font-medium font-serif-luxury">
              Atención al Cliente
            </h4>
            <div className="space-y-2 text-stone-400 font-light text-xs">
              <p className="flex items-center gap-2 text-stone-300">
                <Smartphone size={13} className="text-[#c5a059]" />
                <span>{config.whatsapp || '+507 6215-0251'}</span>
              </p>
              <p className="flex items-center gap-2 text-stone-300">
                <Mail size={13} className="text-[#c5a059]" />
                <span>{config.email || 'contacto@pretty store.com'}</span>
              </p>
              <a
                href="https://maps.app.goo.gl/PxA3suMXNZxuFF5X7"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors group cursor-pointer"
                title="Ver ubicación en Google Maps"
              >
                <MapPin size={13} className="text-[#c5a059] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="hover:underline underline-offset-4">Ver Ubicación en Google Maps</span>
              </a>
            </div>

            {/* Payment methods list */}
            <div className="pt-2 border-t border-white/[0.06]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium block mb-1.5">
                Métodos de Pago
              </span>
              <div className="flex flex-wrap gap-2 text-[10px] text-stone-300 font-light">
                <span className="px-2 py-0.5 bg-stone-900 border border-white/10">Yappy</span>
                <span className="px-2 py-0.5 bg-stone-900 border border-white/10">Tarjeta de Débito o Crédito</span>
                <span className="px-2 py-0.5 bg-stone-900 border border-white/10">Transferencia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500 font-light text-[11px]">
          <p>© {new Date().getFullYear()} {config.nombre_tienda || 'Pretty Store'}. Todos los derechos reservados.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2 text-stone-400">
            <a
              href="/politica-de-privacidad"
              onClick={(e) => {
                if (onOpenPrivacy) {
                  e.preventDefault();
                  onOpenPrivacy();
                } else {
                  e.preventDefault();
                  openLegal('privacidad');
                }
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Política de Privacidad
            </a>
            <span className="text-stone-700">•</span>
            <a
              href="/terminos-y-condiciones"
              onClick={(e) => {
                if (onOpenTerms) {
                  e.preventDefault();
                  onOpenTerms();
                } else {
                  e.preventDefault();
                  openLegal('terminos');
                }
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Términos y Condiciones
            </a>
            <span className="text-stone-700">•</span>
            <button
              onClick={() => openLegal('contacto')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Contacto
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Privacidad, Términos y Soporte */}
      <LegalModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        initialTab={legalTab}
      />

      {/* Modal Oficial de Contacto */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </footer>
  );
};
