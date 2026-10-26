import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Flame,
  ChevronRight,
  ChevronLeft,
  X,
  MessageCircle,
  ExternalLink,
  ShoppingBag,
  Info,
  MoveHorizontal,
} from 'lucide-react';
import { Novedad } from '../../types/database';
import { getPublicNovedades } from '../../services/adminService';
import { useStoreConfig } from '../../context/StoreConfigContext';

interface NovedadesSectionProps {
  onExploreCatalog?: () => void;
}

export const NovedadesSection: React.FC<NovedadesSectionProps> = ({ onExploreCatalog }) => {
  const { config } = useStoreConfig();
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [selectedNovedad, setSelectedNovedad] = useState<Novedad | null>(null);

  // Referencias para el contenedor interactivo deslizante
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const isUserInteractingRef = useRef(false);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

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

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNovedad(null);
      }
    };
    if (selectedNovedad) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNovedad]);

  // Si no hay novedades activas (el admin las eliminó u ocultó), no mostramos la sección
  if (!isLoading && novedades.length === 0) {
    return null;
  }

  // Duplicamos las novedades asegurando exactamente 2 mitades idénticas para un ciclo infinito continuo
  const baseItems = (() => {
    if (novedades.length === 0) return [];
    let items = [...novedades];
    while (items.length < 4) {
      items = [...items, ...novedades];
    }
    return items;
  })();

  const loopItems = [...baseItems, ...baseItems];

  // Pausa temporal y reanudación del auto-scroll tras interacción táctil o mouse
  const pauseAutoScrollTemporarily = () => {
    isUserInteractingRef.current = true;
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 3000);
  };

  // Motor de desplazamiento continuo automático (Auto-drift) con bucle infinito suave
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const step = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      const container = scrollContainerRef.current;
      if (container && !isUserInteractingRef.current && !selectedNovedad && loopItems.length > 0) {
        // Velocidad suave de 35px por segundo
        const speed = 35;
        container.scrollLeft += speed * delta;

        const halfWidth = container.scrollWidth / 2;
        if (halfWidth > 0 && container.scrollLeft >= halfWidth) {
          container.scrollLeft -= halfWidth;
        } else if (container.scrollLeft <= 0) {
          container.scrollLeft += halfWidth;
        }
      }

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animId);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [selectedNovedad, loopItems.length]);

  // Manejo de arrastre con mouse (Computadora)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    isMouseDownRef.current = true;
    isUserInteractingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - container.offsetLeft;
    scrollLeftStartRef.current = container.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startXRef.current) * 1.35; // Factor de respuesta de arrastre
    if (Math.abs(walk) > 6) {
      hasDraggedRef.current = true;
    }
    container.scrollLeft = scrollLeftStartRef.current - walk;

    // Manejo de bucle durante arrastre
    const halfWidth = container.scrollWidth / 2;
    if (halfWidth > 0) {
      if (container.scrollLeft >= halfWidth) {
        container.scrollLeft -= halfWidth;
        scrollLeftStartRef.current -= halfWidth;
      } else if (container.scrollLeft <= 0) {
        container.scrollLeft += halfWidth;
        scrollLeftStartRef.current += halfWidth;
      }
    }
  };

  const handleMouseUpOrLeave = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      pauseAutoScrollTemporarily();
      // Pequeño timeout para no registrar click si hubo arrastre
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 100);
    }
  };

  // Manejo de deslizamiento táctil con el dedo (Móviles Android / iOS)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    isUserInteractingRef.current = true;
    hasDraggedRef.current = false;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const deltaX = Math.abs(e.touches[0].clientX - touchStartXRef.current);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartYRef.current);
    if (deltaX > 8 && deltaX > deltaY) {
      hasDraggedRef.current = true;
    }

    // Mantener bucle infinito en móvil al deslizar
    const container = scrollContainerRef.current;
    if (container) {
      const halfWidth = container.scrollWidth / 2;
      if (halfWidth > 0) {
        if (container.scrollLeft >= halfWidth) {
          container.scrollLeft -= halfWidth;
        } else if (container.scrollLeft <= 0) {
          container.scrollLeft += halfWidth;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    pauseAutoScrollTemporarily();
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 120);
  };

  // Flechas de navegación para computadora o atajo
  const scrollByAmount = (amount: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    pauseAutoScrollTemporarily();
    container.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Clic en novedad: Si el usuario solo tocó/hizo click sin arrastrar, abre el modal con la descripción
  const handleCardClick = (item: Novedad) => {
    if (hasDraggedRef.current) {
      return;
    }
    setActiveTabId(item.id);
    setSelectedNovedad(item);
  };

  // Acción dentro del modal: ir al catálogo o enlace
  const handleModalAction = (item: Novedad) => {
    setSelectedNovedad(null);
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

  // Limpiar número de WhatsApp para enlace
  const rawWa = config.whatsapp || '+507 6215-0251';
  const cleanWaNumber = rawWa.replace(/\D/g, '');

  return (
    <section className="relative py-12 md:py-16 bg-gradient-to-b from-[#09090b] via-[#111116] to-[#09090b] border-y border-white/[0.06] overflow-hidden select-none">
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
              Descubre los últimos lanzamientos en rotación continua. Desliza con el dedo o mouse y toca para ver todos sus detalles.
            </p>
          </div>

          {/* Controles de flechas y tip de deslizamiento para Computadora y Móvil */}
          <div className="flex items-center gap-3 self-start md:self-end">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-stone-400">
              <MoveHorizontal size={13} className="text-[#fbbf24]" />
              <span>Desliza o arrastra</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollByAmount(-380)}
                aria-label="Ver novedad anterior"
                className="w-9 h-9 rounded-full bg-black/60 border border-white/10 hover:border-amber-400/50 hover:bg-amber-400/10 text-stone-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount(380)}
                aria-label="Ver siguiente novedad"
                className="w-9 h-9 rounded-full bg-black/60 border border-white/10 hover:border-amber-400/50 hover:bg-amber-400/10 text-stone-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
              >
                <ChevronRight size={18} />
              </button>
            </div>
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
                    setSelectedNovedad(item);
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

      {/* Contenedor Interactivo Deslizable con Dedo (Móvil) y Mouse (Computadora) */}
      <div className="relative w-full overflow-hidden mask-gradient-x">
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex gap-5 sm:gap-6 py-3 px-4 overflow-x-auto scrollbar-none touch-pan-x cursor-grab active:cursor-grabbing will-change-scroll"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'auto',
          }}
        >
          {loopItems.map((item, index) => {
            const isHighlighted = activeTabId === item.id;

            return (
              <div
                key={`novedad-${item.id}-${index}`}
                onClick={() => handleCardClick(item)}
                className={`relative flex-shrink-0 w-[290px] sm:w-[380px] lg:w-[440px] h-[230px] sm:h-[270px] rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 border ${
                  isHighlighted
                    ? 'border-amber-400/60 shadow-xl shadow-amber-500/15 ring-1 ring-amber-400/30'
                    : 'border-white/10 hover:border-amber-400/40 hover:shadow-2xl hover:shadow-black/80'
                }`}
              >
                {/* Imagen de fondo de la novedad */}
                <img
                  src={item.imagen_url}
                  alt={item.titulo || 'Novedad Pretty Store'}
                  loading="lazy"
                  draggable={false}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/logo/logotipo.jpeg';
                  }}
                />

                {/* Gradiente oscuro sobre la imagen para legibilidad óptima */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent transition-opacity group-hover:opacity-90 pointer-events-none" />

                {/* Badge flotante en la esquina superior izquierda estilo pestaña de lujo */}
                <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 pointer-events-none">
                  {item.badge ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-black/80 backdrop-blur-md text-[#fbbf24] border border-amber-400/40 shadow-md">
                      {item.badge}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-black/80 backdrop-blur-md text-emerald-400 border border-emerald-400/40 shadow-md flex items-center gap-1">
                      <Flame size={11} className="text-emerald-400" />
                      NUEVO
                    </span>
                  )}

                  {/* Indicador de que tiene descripción */}
                  {item.descripcion && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-amber-400/20 text-amber-200 border border-amber-400/30 backdrop-blur-sm flex items-center gap-1">
                      <Info size={10} />
                      <span>Ver detalles</span>
                    </span>
                  )}
                </div>

                {/* Contenido inferior: Título, subtítulo y botón de acción */}
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 z-10 flex flex-col justify-end pointer-events-none">
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
                      <span>Toca para ver descripción completa</span>
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

      {/* MODAL POPUP DE DETALLE Y DESCRIPCIÓN COMPLETA */}
      {selectedNovedad && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedNovedad(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl bg-[#111116] border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-black/90 animate-scaleUp max-h-[92vh] flex flex-col"
          >
            {/* Botón cerrar flotante */}
            <button
              type="button"
              onClick={() => setSelectedNovedad(null)}
              className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/70 hover:bg-amber-400/20 text-stone-300 hover:text-white border border-white/15 hover:border-amber-400/50 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md active:scale-95"
              aria-label="Cerrar ventana"
            >
              <X size={18} />
            </button>

            {/* Cabecera con Imagen */}
            <div className="relative aspect-[16/9] w-full bg-black overflow-hidden shrink-0">
              <img
                src={selectedNovedad.imagen_url}
                alt={selectedNovedad.titulo || 'Detalle de novedad'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/logo/logotipo.jpeg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111116] via-transparent to-black/30" />

              {/* Badge */}
              <div className="absolute top-4 left-4 z-20">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-black/85 backdrop-blur-md text-[#fbbf24] border border-amber-400/40 shadow-lg">
                  {selectedNovedad.badge || 'NOVEDAD DESTACADA'}
                </span>
              </div>
            </div>

            {/* Cuerpo con Título, Subtítulo y Descripción Completa */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#fbbf24] block mb-1">
                  Pretty Store · Lanzamiento Oficial
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                  {selectedNovedad.titulo || 'Novedad Exclusiva'}
                </h3>
                {selectedNovedad.subtitulo && (
                  <p className="text-xs sm:text-sm text-stone-300 font-medium mt-1">
                    {selectedNovedad.subtitulo}
                  </p>
                )}
              </div>

              {/* Sección de la Descripción */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                  <Info size={14} className="text-amber-400" />
                  <span>Descripción y Detalles</span>
                </div>
                <div className="text-xs sm:text-sm text-stone-200 leading-relaxed font-light whitespace-pre-line">
                  {selectedNovedad.descripcion ? (
                    selectedNovedad.descripcion
                  ) : (
                    <p className="italic text-stone-400">
                      Esta pieza forma parte de la colección exclusiva de Pretty Store. Acabados premium, materiales de máxima calidad y disponibilidad sujeta a inventario.
                    </p>
                  )}
                </div>
              </div>

              {/* Acciones del Modal */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                {/* Botón WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?phone=${cleanWaNumber}&text=${encodeURIComponent(
                    `¡Hola Pretty Store! Me interesa la novedad "${selectedNovedad.titulo || 'que vi en la tienda'}" y quisiera más información para adquirirla.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
                >
                  <MessageCircle size={16} />
                  <span>Consultar por WhatsApp</span>
                </a>

                {/* Botón Explorar Catálogo o Enlace */}
                <button
                  type="button"
                  onClick={() => handleModalAction(selectedNovedad)}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#b5914a] hover:from-[#d5b069] hover:to-[#c5a059] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#c5a059]/25 transition-all cursor-pointer active:scale-95"
                >
                  <ShoppingBag size={15} />
                  <span>
                    {selectedNovedad.enlace_url && selectedNovedad.enlace_url.startsWith('http')
                      ? 'Ver Enlace Externo'
                      : 'Ver en Catálogo'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
