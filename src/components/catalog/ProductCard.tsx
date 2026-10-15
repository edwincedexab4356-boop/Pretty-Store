import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Check, Play, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Producto } from '../../types/database';
import { useCart } from '../../context/CartContext';
import { getProductImages, isVideoUrl } from '../../utils/productImages';
import { getProductPromo } from '../../utils/promoUtils';

interface ProductCardProps {
  product: Producto;
  categoryName?: string;
  onQuickView?: (product: Producto) => void;
  priority?: boolean;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  categoryName,
  onQuickView,
  priority = false,
}) => {
  const { addItem, items } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    setImageError(false);
    setCurrentImgIndex(0);
  }, [product.id, product.imagen_url]);

  const promo = getProductPromo(product, categoryName);
  const images = getProductImages(product);
  const hasMultiple = images.length > 1;
  const hasRealImage = images.length > 0;
  const currentMedia = hasRealImage ? images[currentImgIndex] || images[0] : null;
  const isVideo = isVideoUrl(currentMedia);

  const cartItem = items.find((i) => i.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock <= 0;
  const isMaxInCart = inCartQty >= product.stock && product.stock > 0;

  const hasOptions = Boolean(product.opciones && product.opciones.length > 0);
  const optionsPrices = hasOptions
    ? product.opciones!.map((o) => (typeof o.precio === 'number' ? o.precio : product.precio))
    : [product.precio];
  const minPrice = Math.min(...optionsPrices);
  const maxPrice = Math.max(...optionsPrices);
  const hasPriceRange = minPrice !== maxPrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock || isMaxInCart) return;

    if (hasOptions && onQuickView) {
      onQuickView(product);
      return;
    }

    setIsAdding(true);
    addItem(product, 1);
    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  const handlePrevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasMultiple) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!hasMultiple || touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = (touchStartY.current || 0) - touchEndY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
      if (diffX > 0) {
        handleNextImg(e as any);
      } else {
        handlePrevImg(e as any);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <article
      onClick={() => onQuickView && onQuickView(product)}
      className="group flex flex-col bg-[#0e0e11] border border-white/[0.08] hover:border-[#c5a059]/40 hover:shadow-2xl hover:shadow-[#c5a059]/10 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer overflow-hidden rounded-2xl select-none product-card-contain"
    >
      {/* Media Canvas */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-[4/5] w-full overflow-hidden bg-[#141418] flex items-center justify-center touch-pan-y"
      >
        {hasRealImage && currentMedia && !imageError ? (
          isVideo ? (
            <video
              key={currentMedia}
              src={currentMedia}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <img
              key={currentMedia}
              src={currentMedia}
              alt={product.nombre}
              onError={() => setImageError(true)}
              className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={priority ? 'high' : 'low'}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4 sm:p-6 bg-[#121215] w-full h-full select-none">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/10 p-0.5 flex items-center justify-center mb-2.5 bg-black/60 overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
              <img
                src="/images/logo/logotipo-thumb.webp"
                alt="Pretty Store"
                width={56}
                height={56}
                className="w-full h-full object-cover rounded-full opacity-85"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-[#c5a059] font-medium">Pretty Store</span>
            <span className="text-[10px] sm:text-[11px] text-stone-400 mt-1 font-light">Pieza Exclusiva</span>
          </div>
        )}

        {/* Video Badge */}
        {isVideo && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/90 text-[10px] text-white flex items-center gap-1 border border-white/15 z-10 shadow">
            <Play size={10} className="fill-amber-400 text-amber-400" />
            <span className="tracking-wider uppercase text-[9px] font-medium">Video</span>
          </span>
        )}

        {/* Low Stock Urgent Badge - high performance styling */}
        {!isOutOfStock && product.stock <= 5 && (
          <span
            className={`absolute ${isVideo ? 'top-10' : 'top-2.5'} right-2.5 px-2 sm:px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-black text-[9px] sm:text-[10px] tracking-wider flex items-center gap-1 shadow-lg shadow-black/80 border border-yellow-300/80 z-10`}
          >
            <span className="text-xs">🔥</span>
            <span>¡QUEDAN {product.stock}!</span>
          </span>
        )}

        {/* Promo Badge */}
        {promo && (
          <span className="absolute top-2.5 left-2.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-black/90 text-[9px] sm:text-[10px] text-amber-300 flex items-center gap-1 border border-[#c5a059]/50 z-10 shadow-lg font-medium tracking-wide">
            <Sparkles size={11} className="text-[#c5a059]" />
            <span>{promo.shortBadge || '2 por $55'}</span>
          </span>
        )}

        {/* Multi-image Arrows */}
        {hasMultiple && (
          <>
            <button
              onClick={handlePrevImg}
              aria-label="Foto anterior"
              className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-90 border border-white/15 cursor-pointer z-10 shadow-md"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextImg}
              aria-label="Siguiente foto"
              className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-90 border border-white/15 cursor-pointer z-10 shadow-md"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentImgIndex ? 'w-4 bg-[#c5a059]' : 'w-1.5 bg-white/40 group-hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
            <span className="px-3 py-1 bg-black/90 text-stone-300 text-[10px] uppercase tracking-[0.2em] font-medium border border-white/10 rounded-lg">
              Agotado
            </span>
          </div>
        )}

        {/* Quick View Hover Tag */}
        {!hasMultiple && (
          <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300 hidden sm:flex justify-center pointer-events-none translate-y-1 group-hover:translate-y-0">
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-stone-200 bg-black/85 backdrop-blur-sm px-3 py-1.5 border border-white/10 rounded-full shadow-lg">
              Vista Rápida
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-5 lg:p-6 space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between text-[9px] sm:text-[10px] uppercase tracking-[0.2em]">
          <span className="text-[#c5a059] font-medium truncate max-w-[65%]">
            {categoryName || 'Colección'}
          </span>
          {!isOutOfStock && product.stock <= 5 ? (
            <span className="px-2 py-0.5 rounded-full bg-red-600/30 text-amber-300 border border-red-500/80 font-black text-[9px] tracking-wide flex items-center gap-1 animate-pulse shadow-md shadow-red-600/30">
              <span className="text-xs">⚡</span>
              <span>¡{product.stock} restantes!</span>
            </span>
          ) : isOutOfStock ? null : (
            <span className="text-emerald-400 font-light flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Disponible</span>
            </span>
          )}
        </div>

        <h3 className="text-sm sm:text-base font-serif-luxury font-normal text-white group-hover:text-stone-100 transition-colors line-clamp-1">
          {product.nombre}
        </h3>

        <p className="text-[11px] sm:text-xs text-stone-400 line-clamp-2 leading-relaxed font-light flex-1">
          {product.descripcion || 'Pieza exclusiva diseñada con materiales nobles y acabados de primera calidad.'}
        </p>

        {/* Options Badge if product has variants */}
        {hasOptions && (
          <div className="flex items-center gap-1.5 text-[9px] text-[#fbbf24] bg-[#fbbf24]/10 border border-[#fbbf24]/25 px-2 py-0.5 rounded-lg w-fit font-medium">
            <span>🎨</span>
            <span className="truncate max-w-[140px] sm:max-w-[170px]">
              {product.opciones!.map((o) => o.nombre).join(' · ')}
            </span>
          </div>
        )}

        {/* Price & Add to Cart button */}
        <div className="pt-2.5 sm:pt-3 border-t border-white/[0.07] flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-stone-400 font-light">
              {hasPriceRange ? 'Desde' : 'Precio'}
            </span>
            <div className="flex items-baseline gap-1 sm:gap-1.5">
              <span className="text-base sm:text-lg font-mono tabular-nums font-medium text-white">
                ${minPrice.toFixed(2)}
              </span>
              {promo && (
                <span className="text-[9px] sm:text-[10px] text-amber-300 font-mono font-medium truncate">
                  {promo.shortBadge ? `(${promo.shortBadge})` : '(2x $55)'}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isMaxInCart}
            className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 text-[10px] sm:text-[11px] uppercase tracking-[0.16em] font-medium transition-all duration-200 cursor-pointer rounded-xl active:scale-95 ${
              isOutOfStock
                ? 'bg-stone-900 text-stone-500 border border-white/5 cursor-not-allowed'
                : isMaxInCart
                ? 'bg-stone-900 text-stone-400 border border-white/10 cursor-not-allowed'
                : isAdding
                ? 'bg-[#c5a059] text-stone-950 font-semibold shadow-lg shadow-[#c5a059]/30 scale-105'
                : 'bg-white hover:bg-stone-200 text-stone-950 hover:shadow-md hover:shadow-white/10'
            }`}
            aria-label={`Añadir ${product.nombre} al carrito`}
          >
            {isAdding ? (
              <>
                <Check size={14} className="stroke-[2.5]" />
                <span className="hidden sm:inline">Añadido</span>
              </>
            ) : isOutOfStock ? (
              <span>Agotado</span>
            ) : isMaxInCart ? (
              <span>En Carrito</span>
            ) : hasOptions ? (
              <>
                <Sparkles size={13} className="text-[#c5a059]" />
                <span>Opciones</span>
              </>
            ) : (
              <>
                <ShoppingCart size={13} className="stroke-[2]" />
                <span>Añadir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export const ProductCard = React.memo(ProductCardComponent);
