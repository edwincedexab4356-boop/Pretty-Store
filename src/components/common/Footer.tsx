import React from 'react';
import { Crown, Heart, ShieldCheck, Database, Smartphone, Lock } from 'lucide-react';
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
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1 & 2: Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              {config.logo_url ? (
                <img
                  src={config.logo_url}
                  alt={config.nombre_tienda || 'Logo'}
                  className="w-9 h-9 object-contain rounded-xl bg-slate-900 border border-slate-800 p-1"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
                  <Crown size={20} className="stroke-[2.5]" />
                </div>
              )}
              <span className="text-xl font-bold tracking-wider text-white font-serif-luxury">
                {config.nombre_tienda || 'AURA'}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {config.descripcion ||
                'Exclusiva selección de moda, gorras y accesorios de alta gama.'}
            </p>
            <div className="pt-2 flex items-center gap-3 text-slate-400">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Métodos Aceptados:
              </span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-amber-300 font-semibold">
                Yappy
              </span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-semibold">
                Tarjetas
              </span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-semibold">
                ACH
              </span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-semibold">
                Efectivo
              </span>
            </div>
          </div>

          {/* Col 3: Categorías */}
          <div>
            <h4 className="text-white text-xs uppercase tracking-widest font-bold mb-4 font-serif-luxury">
              Categorías
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() => {
                    onSelectCategory('all');
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-amber-400 transition-colors text-left cursor-pointer"
                >
                  Todas las Piezas
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      onSelectCategory(cat.id);
                      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-amber-400 transition-colors text-left cursor-pointer"
                  >
                    {cat.nombre}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Enlaces Rápidos */}
          <div>
            <h4 className="text-white text-xs uppercase tracking-widest font-bold mb-4 font-serif-luxury">
              Navegación
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={scrollToTop} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Volver al Inicio
                </button>
              </li>
              <li>
                <a href="#catalogo" className="hover:text-amber-400 transition-colors">
                  Catálogo Completo
                </a>
              </li>
              <li>
                <a href="#ventajas" className="hover:text-amber-400 transition-colors">
                  Garantía & Envíos
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Contacto */}
          <div>
            <h4 className="text-white text-xs uppercase tracking-widest font-bold mb-4 font-serif-luxury">
              Atención al Cliente
            </h4>
            <div className="space-y-2 text-slate-400 text-xs">
              <p className="flex items-center gap-1.5 text-slate-300">
                <Smartphone size={14} className="text-amber-400" />
                <span>{config.whatsapp || '+507 6899-0000'} (WhatsApp)</span>
              </p>
              <p>Lunes a Sábado: 9:00 AM – 7:00 PM</p>
              <p>{config.direccion || 'Ciudad de Panamá, Panamá'}</p>
              <p className="text-[11px] text-slate-500 pt-1">
                Soporte en vivo para coordinación de pedidos e información de stock.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
          <p>© {new Date().getFullYear()} {config.nombre_tienda || 'AURA'}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-3 text-slate-500">
            <span>Tienda Oficial</span>
            <span>•</span>
            <span className="text-slate-400">Moda & Accesorios</span>
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="text-slate-600 hover:text-amber-400 transition-colors text-xs cursor-pointer ml-2 flex items-center gap-1"
                title="Panel de Administración"
                aria-label="Panel de Administración"
              >
                <Lock size={11} />
                <span>Acceso Privado</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
