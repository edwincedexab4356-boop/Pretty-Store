import React from 'react';
import { Smartphone, Mail, MapPin, Instagram, Facebook, Twitter, Lock } from 'lucide-react';
import { Categoria } from '../../types/database';
import { useStoreConfig } from '../../context/StoreConfigContext';

interface FooterProps {
  categories: Categoria[];
  onSelectCategory: (id: string) => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ categories, onSelectCategory, onOpenAdmin }) => {
  const { config } = useStoreConfig();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#070709] border-t border-white/[0.08] text-stone-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-black border border-white/15 flex items-center justify-center shrink-0">
                <img
                  src={config.logo_url || '/images/logo/logotipo.jpeg'}
                  alt={config.nombre_tienda || 'Pretty-Store'}
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
                <span className="text-lg font-serif-luxury font-medium tracking-[0.16em] text-white uppercase leading-none">
                  {config.nombre_tienda || 'Pretty-Store'}
                </span>
                <span className="text-[8px] uppercase tracking-[0.3em] text-[#a1a1aa] mt-1 font-light">
                  Haute Horlogerie & Atelier
                </span>
              </div>
            </div>

            <p className="text-stone-400 text-xs leading-relaxed max-w-sm font-light">
              {config.descripcion ||
                'Boutique exclusiva de alta relojería, perfumería selecta y marroquinería diseñada con los más elevados estándares de distinción.'}
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3 pt-2 text-stone-400">
              {config.instagram && (
                <a
                  href={config.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 border border-white/10 hover:border-white/30 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={14} />
                </a>
              )}
              {config.facebook && (
                <a
                  href={config.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 border border-white/10 hover:border-white/30 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook size={14} />
                </a>
              )}
              {config.twitter && (
                <a
                  href={config.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 border border-white/10 hover:border-white/30 hover:text-white transition-colors"
                  aria-label="Twitter / X"
                >
                  <Twitter size={14} />
                </a>
              )}
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
                <span>{config.whatsapp || '+507 6890-1234'}</span>
              </p>
              <p className="flex items-center gap-2 text-stone-300">
                <Mail size={13} className="text-[#c5a059]" />
                <span>{config.email || 'contacto@pretty-store.com'}</span>
              </p>
              <p className="flex items-center gap-2 text-stone-400">
                <MapPin size={13} className="text-stone-500 shrink-0" />
                <span>{config.direccion || 'Costa del Este, Ciudad de Panamá'}</span>
              </p>
            </div>

            {/* Payment methods list */}
            <div className="pt-2 border-t border-white/[0.06]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium block mb-1.5">
                Métodos de Pago
              </span>
              <div className="flex flex-wrap gap-2 text-[10px] text-stone-300 font-light">
                <span className="px-2 py-0.5 bg-stone-900 border border-white/10">Yappy</span>
                <span className="px-2 py-0.5 bg-stone-900 border border-white/10">Visa / MC</span>
                <span className="px-2 py-0.5 bg-stone-900 border border-white/10">ACH Directo</span>
                <span className="px-2 py-0.5 bg-stone-900 border border-white/10">Efectivo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-400 font-light text-[11px]">
          <p>© {new Date().getFullYear()} {config.nombre_tienda || 'Pretty-Store'}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span>Privacidad</span>
            <span>•</span>
            <span>Términos</span>
            {onOpenAdmin && (
              <>
                <span>•</span>
                <button
                  onClick={onOpenAdmin}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  aria-label="Acceso Administrador"
                >
                  <Lock size={11} />
                  <span>Administración</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
