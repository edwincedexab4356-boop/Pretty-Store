import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, Search, Shield, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStoreConfig } from '../../context/StoreConfigContext';

interface HeaderProps {
  onSearchChange?: (query: string) => void;
  onNavigateSection?: (sectionId: string) => void;
  onOpenSupabaseConfig?: () => void;
  isSupabaseConnected?: boolean;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateSection,
  onOpenAdmin,
}) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { config } = useStoreConfig();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#09090b]/92 backdrop-blur-md border-b border-white/[0.08] py-3.5 shadow-lg shadow-black/50'
          : 'bg-gradient-to-b from-black/80 via-black/30 to-transparent py-5 sm:py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-9">
          {/* Left Zone: Brand Logo & Wordmark */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavClick('hero')}
              className="flex items-center gap-3 group cursor-pointer text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c5a059]"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-black border border-white/15 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
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
                <span className="text-base sm:text-lg font-serif-luxury font-semibold tracking-[0.16em] text-white uppercase leading-none transition-colors group-hover:text-[#c5a059]">
                  {config.nombre_tienda || 'Pretty-Store'}
                </span>
                <span className="text-[8px] uppercase tracking-[0.3em] text-[#a1a1aa] mt-1 font-light hidden sm:block">
                  Atelier & Boutique
                </span>
              </div>
            </button>
          </div>

          {/* Center Zone: Clean Desktop Navigation (Rolex/Chanel luxury style) */}
          <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.22em] font-medium text-stone-300">
            <button
              onClick={() => handleNavClick('hero')}
              className="hover:text-white transition-colors cursor-pointer py-1 relative group"
            >
              <span>Inicio</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#c5a059] group-hover:w-full transition-all duration-300" />
            </button>
            <button
              onClick={() => handleNavClick('catalogo')}
              className="hover:text-white transition-colors cursor-pointer py-1 relative group"
            >
              <span>Tienda</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#c5a059] group-hover:w-full transition-all duration-300" />
            </button>
            <button
              onClick={() => handleNavClick('categorias')}
              className="hover:text-white transition-colors cursor-pointer py-1 relative group"
            >
              <span>Categorías</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#c5a059] group-hover:w-full transition-all duration-300" />
            </button>
            <button
              onClick={() => handleNavClick('editoriales')}
              className="hover:text-white transition-colors cursor-pointer py-1 relative group"
            >
              <span>Sobre Nosotros</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#c5a059] group-hover:w-full transition-all duration-300" />
            </button>
          </nav>

          {/* Right Zone: Actions (Search, Cart, Admin) */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Icon */}
            <button
              onClick={() => handleNavClick('catalogo')}
              className="p-2 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Buscar en la tienda"
              aria-label="Buscar en la tienda"
            >
              <Search size={18} className="stroke-[1.5]" />
            </button>

            {/* Cart Icon with Minimalist Counter */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full text-stone-200 hover:text-white hover:bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
              aria-label={`Bolsa de compras (${totalItems} artículos)`}
            >
              <ShoppingBag size={17} className="stroke-[1.5]" />
              <span className="text-[11px] font-mono tabular-nums font-medium text-stone-200">
                {totalItems}
              </span>
            </button>

            {/* Admin / Account Access */}
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="p-2 text-stone-400 hover:text-white transition-colors cursor-pointer hidden sm:flex items-center justify-center"
                title="Panel de Administración"
                aria-label="Panel de Administración"
              >
                <User size={18} className="stroke-[1.5]" />
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-300 hover:text-white md:hidden transition-colors cursor-pointer"
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? <X size={22} className="stroke-[1.5]" /> : <Menu size={22} className="stroke-[1.5]" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-4 pb-4 border-t border-white/10 bg-[#09090b]/98 backdrop-blur-2xl px-2 flex flex-col gap-1 text-xs uppercase tracking-[0.2em] animate-in fade-in duration-200">
            <button
              onClick={() => handleNavClick('hero')}
              className="text-left py-2.5 px-3 text-stone-300 hover:text-white hover:bg-white/5 rounded transition-colors"
            >
              Inicio
            </button>
            <button
              onClick={() => handleNavClick('catalogo')}
              className="text-left py-2.5 px-3 text-stone-300 hover:text-white hover:bg-white/5 rounded transition-colors"
            >
              Tienda
            </button>
            <button
              onClick={() => handleNavClick('categorias')}
              className="text-left py-2.5 px-3 text-stone-300 hover:text-white hover:bg-white/5 rounded transition-colors"
            >
              Categorías
            </button>
            <button
              onClick={() => handleNavClick('editoriales')}
              className="text-left py-2.5 px-3 text-stone-300 hover:text-white hover:bg-white/5 rounded transition-colors"
            >
              Sobre Nosotros
            </button>
            {onOpenAdmin && (
              <div className="pt-2 mt-2 border-t border-white/10 flex">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="py-2.5 px-3 text-stone-400 hover:text-[#c5a059] flex items-center gap-2 text-xs w-full text-left"
                >
                  <User size={15} />
                  <span>Área de Administración</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
