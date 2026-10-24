import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Flame, ChevronRight } from 'lucide-react';
import { Novedad } from '../../types/database';
import { getPublicNovedades } from '../../services/adminService';

interface NovedadesSectionProps {
  onExploreCatalog?: () => void;
}

export const NovedadesSection: React.FC<NovedadesSectionProps> = ({ onExploreCatalog }) => {
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const trackRef = useRef<HTMLDivElement>(null);

  const fetchNovedades = async () => {
    try {
      const data = await getPublicNovedades();
      setNovedades(data);
      if (data.length > 0) {
        if (!activeTabId || !data.some((d) => d.id === activeTabId)) {
          setActiveTabId(data[0].id);
        }
      } else {
        setActiveTabId(null);
      }
    } catch (err) {
      console.warn('Error fetching public novedades:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNovedades();

    const handleUpdate = () => {
      fetchNovedades();
    };

    window.addEventListener('novedades-updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('novedades-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  // Si no hay novedades activas (el admin las eliminó u ocultó), no mostramos la sección
  if (!isLoading && novedades.length === 0) {
    return null;
  }

  // Duplicamos las novedades para lograr el bucle infinito continuo sin saltos
  const loopItems = novedades.length > 0
    ? novedades.length === 1
      ? [...novedades, ...novedades, ...novedades, ...novedades]
      : novedades.length <= 3
      ? [...novedades, ...novedades, ...novedades]
      : [...novedades, ...novedades]
    : [];

  const handleCardClick = (item: Novedad) => {
    if (item.enlace_url && item.enlace_url.startsWith('#')) {
      const targetId = item.enlace_url.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    } else if (item.enlace_url && item.enlace_url.startsWith('http')) {
      window.open(item.enlace_url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (onExploreCatalog) {
      onExploreCatalog();
    } else {
      const el = document.getElementById('catalogo');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative py-12 md:py-16 bg-gradient-to-b from-[#09090b] via-[#111116] to-[#09090b] border-y border-white/[0.06] overflow-hidden">
      {/* Glow ambiental */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#fbbf24]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-500/20 mb-3">
              <Sparkles size={13} className="text-[#fbbf24] animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-[#fbbf24]">
                Novedades & Drops Exclusivos
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Lo Más Reciente En <span className="text-[#fbbf24]">Pretty Store</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-1.5 max-w-xl">
              Descubre los últimos lanzamientos, gorras en tendencia y accesorios exclusivos en rotación continua.
            </p>
          </div>
        </div>

        {/* Pestañas de acceso rápido (Tabs) */}
        {novedades.length > 1 && (
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 scrollbar-none">
            {novedades.map((item, idx) => {
              const isSelected = activeTabId === item.id;
              return (
                <button
                  key={`tab-${item.id}-${idx}`}
                  onClick={() => {
                    setActiveTabId(item.id);
                    handleCardClick(item);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-amber-400/15 text-[#fbbf24] border-amber-400/40 shadow-sm shadow-amber-500/20'
                      : 'bg-stone-900/60 text-stone-400 border-white/5 hover:text-stone-200 hover:border-white/15'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#fbbf24]' : 'bg-stone-600'}`} />
                  <span>{item.titulo || `Novedad #${idx + 1}`}</span>
                  {item.badge && (
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-black/40 text-stone-300 ml-1">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Track Marquee Infinito Horizontal */}
      <div
        className="relative w-full overflow-hidden mask-gradient-x"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div
          ref={trackRef}
          className={`flex gap-5 sm:gap-6 py-2 px-4 will-change-transform ${
            isPaused ? '' : 'animate-marquee-infinite'
          }`}
          style={{
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {loopItems.map((item, index) => {
            const isHighlighted = activeTabId === item.id;

            return (
              <div
                key={`novedad-${item.id}-${index}`}
                onClick={() => handleCardClick(item)}
                className={`relative flex-shrink-0 w-[300px] sm:w-[380px] lg:w-[440px] h-[220px] sm:h-[260px] rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 border ${
                  isHighlighted
                    ? 'border-amber-400/50 shadow-lg shadow-amber-500/10'
                    : 'border-white/10 hover:border-amber-400/40 hover:shadow-xl hover:shadow-black/70'
                }`}
              >
                {/* Imagen de fondo de la novedad */}
                <img
                  src={item.imagen_url}
                  alt={item.titulo || 'Novedad Pretty Store'}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80';
                  }}
                />

                {/* Gradiente oscuro sobre la imagen para legibilidad óptima */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity group-hover:opacity-90" />

                {/* Badge flotante en la esquina superior izquierda estilo pestaña de lujo */}
                <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5">
                  {item.badge ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-black/75 backdrop-blur-md text-[#fbbf24] border border-amber-400/30 shadow-md">
                      {item.badge}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-black/75 backdrop-blur-md text-emerald-400 border border-emerald-400/30 shadow-md flex items-center gap-1">
                      <Flame size={11} className="text-emerald-400" />
                      NUEVO
                    </span>
                  )}
                </div>

                {/* Contenido inferior: Título, subtítulo y botón de acción */}
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 z-10 flex flex-col justify-end">
                  {item.titulo && (
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#fbbf24] transition-colors line-clamp-1 drop-shadow-md">
                      {item.titulo}
                    </h3>
                  )}

                  {item.subtitulo && (
                    <p className="text-xs sm:text-sm text-stone-300 mt-1 line-clamp-2 drop-shadow-sm font-light">
                      {item.subtitulo}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Explorar novedad</span>
                      <ChevronRight size={14} />
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 bg-white/5 px-2 py-0.5 rounded">
                      Pretty Store
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
