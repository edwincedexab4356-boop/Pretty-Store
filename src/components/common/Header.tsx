import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Menu, X, Search, ChevronDown, Layers } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { Categoria } from '../../types/database';

interface HeaderProps {
  categories?: Categoria[];
  onSelectCategory?: (id: string) => void;
  onSearchChange?: (query: string) => void;
  onNavigateSection?: (sectionId: string) => void;
  onOpenSupabaseConfig?: () => void;
  isSupabaseConnected?: boolean;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  categories = [],
  onSelectCategory,
  onNavigateSection,
  onOpenAdmin,
}) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { config } = useStoreConfig();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDesktopDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseEnterDropdown = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setDesktopDropdownOpen(true);
  };

  const handleMouseLeaveDropdown = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setDesktopDropdownOpen(false);
    }, 250);
  };

  const handleToggleCategories = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setDesktopDropdownOpen((prev) => !prev);
  };

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    setMobileCategoriesOpen(false);
    setDesktopDropdownOpen(false);
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePickCategory = (categoryId: string) => {
    setMobileMenuOpen(false);
    setMobileCategoriesOpen(false);
    setDesktopDropdownOpen(false);
    if (onSelectCategory) {
      onSelectCategory(categoryId);
    }
    const el = document.getElementById('catalogo');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#09090b]/92 backdrop-blur-md border-b border-white/[0.08] py-3.5 shadow-lg shadow-black/50'
          : 'bg-gradient-to-b from-black/80 via-black/30 to-transparent py-5 sm:py-6'
      }`}
    >
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12">
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

          {/* Center Zone: Clean Desktop Navigation with Categories Dropdown */}
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

            {/* Desktop Categories with Dropdown */}
            <div
              ref={dropdownRef}
              className="relative py-1"
              onMouseEnter={handleMouseEnterDropdown}
              onMouseLeave={handleMouseLeaveDropdown}
            >
              <button
                type="button"
                onClick={handleToggleCategories}
                className="hover:text-white transition-colors cursor-pointer py-1 relative group flex items-center gap-1.5 focus:outline-none"
                aria-expanded={desktopDropdownOpen}
              >
                <span>Categorías</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    desktopDropdownOpen ? 'rotate-180 text-[#c5a059]' : ''
                  }`}
                />
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#c5a059] group-hover:w-full transition-all duration-300" />
              </button>

              {desktopDropdownOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-60 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                  onMouseEnter={handleMouseEnterDropdown}
                  onMouseLeave={handleMouseLeaveDropdown}
                >
                  <div className="bg-[#09090b]/98 backdrop-blur-2xl border border-white/10 shadow-2xl py-2 rounded-lg overflow-hidden">
                    <div className="px-4 py-2 border-b border-white/10 text-[9px] uppercase tracking-[0.25em] text-[#c5a059] font-medium flex items-center justify-between">
                      <span>Colecciones</span>
                      <span className="text-stone-500 font-mono text-[9px] lowercase">
                        {categories.length} categorías
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePickCategory('all')}
                      className="w-full text-left px-4 py-2.5 text-xs text-stone-300 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-medium text-[#c5a059]">Todo el Catálogo</span>
                      <span className="text-[10px] text-stone-500 font-mono">Ver Todo</span>
                    </button>
                    {categories.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-stone-500 italic">
                        Cargando colecciones...
                      </div>
                    ) : (
                      categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handlePickCategory(cat.id)}
                          className="w-full text-left px-4 py-2 text-xs text-stone-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059] shrink-0" />
                          <span className="capitalize text-stone-200">{cat.nombre}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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

            {/* Mobile Menu Toggle Button (Tres rayitas) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-300 hover:text-white md:hidden transition-colors cursor-pointer"
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? <X size={22} className="stroke-[1.5]" /> : <Menu size={22} className="stroke-[1.5]" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Tres rayitas desplegadas) */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-4 pb-5 border-t border-white/10 bg-[#09090b]/98 backdrop-blur-2xl px-3 flex flex-col gap-1 text-xs uppercase tracking-[0.2em] animate-in fade-in duration-200">
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

            {/* Accordion Deslizante de Categorías */}
            <div className="border border-white/10 rounded-lg overflow-hidden my-1 bg-black/40">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileCategoriesOpen((prev) => !prev);
                }}
                className="w-full text-left py-3 px-3 text-stone-200 hover:text-white flex items-center justify-between transition-colors bg-white/[0.02] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-[#c5a059]" />
                  <span>Categorías</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#c5a059] font-mono lowercase">
                    {categories.length} categorías
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-stone-400 transition-transform duration-300 ${
                      mobileCategoriesOpen ? 'rotate-180 text-[#c5a059]' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Sub-menu deslizante con todas las categorías */}
              {mobileCategoriesOpen && (
                <div className="px-2 py-2 border-t border-white/10 bg-black/60 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <button
                    onClick={() => handlePickCategory('all')}
                    className="text-left py-2 px-3 text-xs text-[#c5a059] font-medium hover:bg-white/5 rounded transition-colors flex items-center justify-between"
                  >
                    <span>Ver Todo el Catálogo</span>
                    <span className="text-[9px] text-stone-400 font-mono tracking-normal">
                      Mostrar Todo
                    </span>
                  </button>

                  {categories.length === 0 ? (
                    <div className="py-2 px-3 text-[11px] text-stone-500 font-light lowercase">
                      No hay categorías registradas aún
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handlePickCategory(cat.id)}
                        className="text-left py-2.5 px-3 text-xs text-stone-300 hover:text-white hover:bg-white/5 rounded transition-colors flex items-center gap-2.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059] shrink-0" />
                        <span className="capitalize text-stone-200 font-light">{cat.nombre}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => handleNavClick('editoriales')}
              className="text-left py-2.5 px-3 text-stone-300 hover:text-white hover:bg-white/5 rounded transition-colors"
            >
              Sobre Nosotros
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

