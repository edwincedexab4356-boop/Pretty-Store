import React, { useRef, useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

const DEFAULT_FALLBACK_VIDEO = '/videos/WhatsApp Video 2026-09-26 at 15.05.22.mp4';

interface HeroProps {
  videoUrl?: string;
  onExploreClick: () => void;
  onCategoriesClick?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ videoUrl = '/videos/hero.mp4', onExploreClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const resolveUrl = (url?: string) => (!url || url.includes('2026-09-23') ? DEFAULT_FALLBACK_VIDEO : url);
  const [currentUrl, setCurrentUrl] = useState(() => resolveUrl(videoUrl));

  useEffect(() => {
    setCurrentUrl(resolveUrl(videoUrl));
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;

    // Use IntersectionObserver to pause playback when out of viewport
    // drastically saving GPU/CPU memory on mobile and desktop
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
    };
  }, [currentUrl]);

  return (
    <section className="relative w-full min-h-[85vh] sm:min-h-[90vh] lg:min-h-screen overflow-hidden bg-black flex flex-col justify-center">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-black pointer-events-none">
        <video
          ref={videoRef}
          src={currentUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onError={() => {
            setCurrentUrl(currentUrl === '/videos/hero.mp4' ? DEFAULT_FALLBACK_VIDEO : '/videos/hero.mp4');
          }}
          className="absolute inset-0 w-full h-full object-cover object-center will-change-transform"
        />
      </div>

      {/* Atmospheric Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#09090b] to-transparent" />
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center min-h-[85vh] sm:min-h-[90vh]">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-[#c5a059]/30 text-[10px] sm:text-xs uppercase tracking-[0.35em] font-medium text-[#c5a059] mb-6 backdrop-blur-md animate-floatGentle shadow-lg shadow-black/50">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059] animate-pulse" />
          <span>The New Collection</span>
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif-luxury font-light text-white tracking-tight leading-[1.06] mb-6 max-w-3xl drop-shadow-md">
          Define your style.
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-stone-200/90 max-w-lg mx-auto font-light leading-relaxed mb-10">
          Piezas de distinción concebidas con los más altos estándares de calidad y elegancia moderna.
        </p>
        <div>
          <button
            onClick={onExploreClick}
            className="inline-flex items-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-950 font-sans-clean font-semibold uppercase tracking-[0.22em] text-[11px] sm:text-xs transition-all duration-300 hover:tracking-[0.26em] hover:-translate-y-1 hover:shadow-2xl hover:shadow-white/20 active:scale-95 cursor-pointer group shadow-2xl shadow-black/60 rounded-full"
          >
            <span>Descubre la colección</span>
            <ArrowRight size={14} className="stroke-[2] transition-transform duration-300 group-hover:translate-x-1.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
