import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Menu, X, ChevronDown, Layers } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { Categoria } from '../../types/database';

interface HeaderProps {
  categories: Categoria[];
  selectedCategoryId?: string;
  onSelectCategory: (id: string) => void;
  onNavigateSection?: (sectionId: string) => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  categories = [],
  selectedCategoryId,
  onSelectCategory,
  onNavigateSection,
  onOpenAdmin,
}) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { config } = useStoreConfig();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        setCategoriesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setCategoriesDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setCategoriesDropdownOpen(false);
    }, 250);
  };

  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setCategoriesDropdownOpen((prev) => !prev);
  };

  const navigateTo = (targetId: string) => {
    setMobileMenuOpen(false);
    setMobileCategoriesOpen(false);
    setCategoriesDropdownOpen(false);

    if (targetId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (targetId === 'contacto') {
      const el = document.getElementById('contacto') || document.querySelector('footer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
      return;
    }

    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (onNavigateSection) {
      onNavigateSection(targetId);
    }
  };

  // Secret 5-tap to open admin
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      if (onOpenAdmin) onOpenAdmin();
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2500);

    navigateTo('hero');
  };

  const handleCategorySelect = (id: string) => {
    setMobileMenuOpen(false);
    setMobileCategoriesOpen(false);
    setCategoriesDropdownOpen(false);
    onSelectCategory(id);
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
          {/* Logo & Store Name */}
          <div className="flex items-center">
            <button
              onClick={handleLogoTap}
              className="flex items-center gap-3 group cursor-pointer text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c5a059]"
              title="Pretty Store"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-black border border-white/15 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
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
                <span className="text-base sm:text-lg font-serif-luxury font-semibold tracking-[0.16em] text-white uppercase leading-none transition-colors group-hover:text-[#c5a059]">
                  {config.nombre_tienda || 'Pretty Store'}
                </span>
                <span className="text-[8px] uppercase tracking-[0.3em] text-[#a1a1aa] mt-1 font-light hidden sm:block">
                  Almacén y accesorio urbano
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation - responsive gap for iPad / tablet & desktop */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-8 text-sm lg:text-[16px] font-extrabold tracking-wide">
            <button
              onClick={() => navigateTo('hero')}
              className="text-[#fbbf24] hover:text-white transition-all duration-200 cursor-pointer py-1 relative group drop-shadow-[0_1px_6px_rgba(251,191,36,0.4)] hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] active:scale-95"
            >
              <span>Inicio</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2.5px] bg-[#fbbf24] group-hover:w-full transition-all duration-300 rounded-full" />
            </button>

            <button
              onClick={() => navigateTo('catalogo')}
              className="text-[#fbbf24] hover:text-white transition-all duration-200 cursor-pointer py-1 relative group drop-shadow-[0_1px_6px_rgba(251,191,36,0.4)] hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] active:scale-95"
            >
              <span>Tienda</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2.5px] bg-[#fbbf24] group-hover:w-full transition-all duration-300 rounded-full" />
            </button>

            {/* Categorías Dropdown */}
            <div
              ref={dropdownRef}
              className="relative py-1"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={handleToggleDropdown}
                className="text-[#fbbf24] hover:text-white transition-all duration-200 cursor-pointer py-1 relative group flex items-center gap-1.5 focus:outline-none drop-shadow-[0_1px_6px_rgba(251,191,36,0.4)] hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] active:scale-95"
                aria-expanded={categoriesDropdownOpen}
              >
                <span>Categorías</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${categoriesDropdownOpen ? 'rotate-180 text-white' : ''}`}
                />
                <span className="absolute bottom-0 left-0 w-0 h-[2.5px] bg-[#fbbf24] group-hover:w-full transition-all duration-300 rounded-full" />
              </button>

              {categoriesDropdownOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-64 z-50 animate-slideUp"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="bg-[#09090b]/98 backdrop-blur-2xl border border-white/10 shadow-2xl py-2 rounded-xl flex flex-col max-h-[65vh] overflow-hidden">
                    <div className="px-4 py-2 border-b border-white/10 text-[11px] uppercase tracking-[0.25em] text-[#fbbf24] font-bold flex items-center justify-between shrink-0">
                      <span>Colecciones</span>
                      <span className="text-stone-400 font-mono text-[9px]">{categories.length} categorías</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCategorySelect('all')}
                      className="w-full text-left px-4 py-2.5 text-xs text-stone-300 hover:text-white hover:bg-white/5 transition-all flex items-center justify-between cursor-pointer border-b border-white/[0.04] shrink-0 active:scale-[0.98]"
                    >
                      <span className="font-semibold text-[#c5a059]">Todas las Colecciones</span>
                      <span className="text-[10px] text-stone-400 font-mono">Ver todas</span>
                    </button>

                    <div className="overflow-y-auto flex-1 divide-y divide-white/[0.03]">
                      {categories.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-stone-500 italic">Cargando colecciones...</div>
                      ) : (
                        categories.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleCategorySelect(c.id)}
                            className="w-full text-left px-4 py-2 text-xs text-stone-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2.5 cursor-pointer active:scale-[0.98]"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] shrink-0" />
                            <span className="capitalize text-stone-200">{c.nombre}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigateTo('contacto')}
              className="text-[#fbbf24] hover:text-white transition-all duration-200 cursor-pointer py-1 relative group drop-shadow-[0_1px_6px_rgba(251,191,36,0.4)] hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] active:scale-95"
            >
              <span>Contáctanos</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2.5px] bg-[#fbbf24] group-hover:w-full transition-all duration-300 rounded-full" />
            </button>

            <button
              onClick={() => navigateTo('editoriales')}
              className="text-[#fbbf24] hover:text-white transition-all duration-200 cursor-pointer py-1 relative group drop-shadow-[0_1px_6px_rgba(251,191,36,0.4)] hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] active:scale-95"
            >
              <span>Sobre Nosotros</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2.5px] bg-[#fbbf24] group-hover:w-full transition-all duration-300 rounded-full" />
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigateTo('catalogo')}
              className="p-2 text-stone-300 hover:text-white transition-all active:scale-90 cursor-pointer hover:bg-white/5 rounded-full"
              title="Buscar en la tienda"
              aria-label="Buscar en la tienda"
            >
              <Search size={18} className="stroke-[1.5]" />
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full text-stone-200 hover:text-white hover:bg-white/10 border border-white/10 hover:border-[#c5a059]/50 transition-all duration-200 cursor-pointer active:scale-95 hover:shadow-lg hover:shadow-[#c5a059]/10 group"
              aria-label={`Carrito de compras (${totalItems} artículos)`}
            >
              <ShoppingCart size={18} className="stroke-[1.5] group-hover:text-[#fbbf24] transition-colors" />
              <span
                key={totalItems}
                className={`text-[11px] font-mono tabular-nums font-semibold px-1.5 py-0.2 rounded-full ${
                  totalItems > 0 ? 'bg-[#c5a059] text-black animate-popBadge' : 'text-stone-300'
                }`}
              >
                {totalItems}
              </span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-300 hover:text-white md:hidden transition-all active:scale-90 cursor-pointer hover:bg-white/5 rounded-lg"
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? <X size={22} className="stroke-[1.5] text-amber-400 rotate-90 transition-transform" /> : <Menu size={22} className="stroke-[1.5]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-4 pb-5 border-t border-white/10 bg-[#09090b]/98 backdrop-blur-2xl px-3 flex flex-col gap-2 text-base font-extrabold tracking-wide animate-in fade-in duration-200">
          <button
            onClick={() => navigateTo('hero')}
            className="text-left py-2.5 px-3 text-[#fbbf24] hover:text-white hover:bg-white/5 rounded-xl transition-colors drop-shadow-[0_1px_4px_rgba(251,191,36,0.3)]"
          >
            Inicio
          </button>

          <button
            onClick={() => navigateTo('catalogo')}
            className="text-left py-2.5 px-3 text-[#fbbf24] hover:text-white hover:bg-white/5 rounded-xl transition-colors drop-shadow-[0_1px_4px_rgba(251,191,36,0.3)]"
          >
            Tienda
          </button>

          {/* Categorías Mobile Accordion */}
          <div className="border border-white/10 rounded-xl overflow-hidden my-1 bg-black/40">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMobileCategoriesOpen((prev) => !prev);
              }}
              className="w-full text-left py-3 px-3 text-[#fbbf24] hover:text-white flex items-center justify-between transition-colors bg-white/[0.02] cursor-pointer drop-shadow-[0_1px_4px_rgba(251,191,36,0.3)]"
            >
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-[#fbbf24]" />
                <span>Categorías</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#fbbf24] font-mono lowercase">{categories.length} categorías</span>
                <ChevronDown
                  size={16}
                  className={`text-[#fbbf24] transition-transform duration-300 ${mobileCategoriesOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {mobileCategoriesOpen && (
              <div className="px-2 py-2 border-t border-white/10 bg-black/60 flex flex-col gap-1 max-h-[50vh] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200 font-medium">
                <button
                  onClick={() => handleCategorySelect('all')}
                  className="text-left py-2 px-3 text-xs text-[#c5a059] font-bold hover:bg-white/5 rounded transition-colors flex items-center justify-between"
                >
                  <span>Todas las Colecciones</span>
                  <span className="text-[9px] text-stone-400 font-mono tracking-normal">Ver catálogo</span>
                </button>
                {categories.length === 0 ? (
                  <div className="py-2 px-3 text-[11px] text-stone-500 font-light lowercase">No hay categorías registradas aún</div>
                ) : (
                  categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleCategorySelect(c.id)}
                      className="text-left py-2.5 px-3 text-xs text-stone-200 hover:text-white hover:bg-white/5 rounded transition-colors flex items-center gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] shrink-0" />
                      <span className="capitalize">{c.nombre}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => navigateTo('contacto')}
            className="text-left py-2.5 px-3 text-[#fbbf24] hover:text-white hover:bg-white/5 rounded-xl transition-colors drop-shadow-[0_1px_4px_rgba(251,191,36,0.3)] font-extrabold"
          >
            Contáctanos
          </button>

          <button
            onClick={() => navigateTo('editoriales')}
            className="text-left py-2.5 px-3 text-[#fbbf24] hover:text-white hover:bg-white/5 rounded-xl transition-colors drop-shadow-[0_1px_4px_rgba(251,191,36,0.3)] font-extrabold"
          >
            Sobre Nosotros
          </button>
        </div>
      )}
    </header>
  );
};
