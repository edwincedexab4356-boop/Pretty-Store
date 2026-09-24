import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, Crown, Search, Database, Shield, Lock } from 'lucide-react';
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
  onOpenSupabaseConfig,
  isSupabaseConnected = false,
  onOpenAdmin,
}) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { config } = useStoreConfig();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);

  // Trigger pulse effect on cart item count change
  useEffect(() => {
    if (totalItems > 0) {
      setCartPulse(true);
      const timer = setTimeout(() => setCartPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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
          ? 'bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 shadow-xl shadow-black/20 py-3.5'
          : 'bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <button
            onClick={() => handleNavClick('hero')}
            className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
          >
            {config.logo_url ? (
              <img
                src={config.logo_url}
                alt={config.nombre_tienda || 'Logo'}
                className="w-10 h-10 object-contain rounded-xl bg-slate-900 border border-slate-800 p-1 group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Crown size={22} className="stroke-[2.5]" />
              </div>
            )}
            <div>
              <span className="text-xl sm:text-2xl font-bold tracking-wider text-white font-serif-luxury block leading-none">
                {config.nombre_tienda || 'AURA'}
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-amber-400">
                {config.descripcion ? config.descripcion.slice(0, 24) : 'Luxe Store'}
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <button
              onClick={() => handleNavClick('hero')}
              className="hover:text-amber-400 transition-colors cursor-pointer py-1"
            >
              Inicio
            </button>
            <button
              onClick={() => handleNavClick('categorias')}
              className="hover:text-amber-400 transition-colors cursor-pointer py-1"
            >
              Categorías
            </button>
            <button
              onClick={() => handleNavClick('catalogo')}
              className="hover:text-amber-400 transition-colors cursor-pointer py-1"
            >
              Catálogo
            </button>
            <button
              onClick={() => handleNavClick('ventajas')}
              className="hover:text-amber-400 transition-colors cursor-pointer py-1"
            >
              Garantía
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Quick jump to catalog search */}
            <button
              onClick={() => handleNavClick('catalogo')}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
              title="Buscar productos"
              aria-label="Buscar en el catálogo"
            >
              <Search size={20} />
            </button>

            {/* Cart Button with interactive badge */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                totalItems > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shadow-lg shadow-amber-500/25'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80'
              } ${cartPulse ? 'scale-105' : 'scale-100'}`}
              aria-label={`Ver carrito de compras con ${totalItems} productos`}
            >
              <ShoppingBag size={18} className="shrink-0" />
              <span className="hidden sm:inline">Carrito</span>
              <span
                className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs rounded-full font-bold transition-transform ${
                  totalItems > 0
                    ? 'bg-slate-950 text-amber-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {totalItems}
              </span>
            </button>

            {/* Discreet Admin Lock Button */}
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="p-2 text-slate-500 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                title="Acceso Administrador"
                aria-label="Acceso Administrador"
              >
                <Lock size={16} />
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 md:hidden transition-colors cursor-pointer"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 pb-3 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-xl rounded-2xl px-4 flex flex-col gap-3 text-base shadow-2xl">
            <button
              onClick={() => handleNavClick('hero')}
              className="text-left py-2 px-3 rounded-lg text-slate-200 hover:bg-slate-900 hover:text-amber-400 transition-colors"
            >
              Inicio
            </button>
            <button
              onClick={() => handleNavClick('categorias')}
              className="text-left py-2 px-3 rounded-lg text-slate-200 hover:bg-slate-900 hover:text-amber-400 transition-colors"
            >
              Categorías
            </button>
            <button
              onClick={() => handleNavClick('catalogo')}
              className="text-left py-2 px-3 rounded-lg text-slate-200 hover:bg-slate-900 hover:text-amber-400 transition-colors"
            >
              Catálogo Completo
            </button>
            <button
              onClick={() => handleNavClick('ventajas')}
              className="text-left py-2 px-3 rounded-lg text-slate-200 hover:bg-slate-900 hover:text-amber-400 transition-colors"
            >
              Beneficios & Seguridad
            </button>
            {onOpenAdmin && (
              <div className="pt-2 border-t border-slate-800/60 flex justify-end">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="p-2 text-slate-500 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
                  aria-label="Acceso Administrador"
                >
                  <Lock size={14} />
                  <span>Acceso Admin</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
