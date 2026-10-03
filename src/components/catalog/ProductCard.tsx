import React, { useState } from 'react';
import { ShoppingBag, Check, ChevronLeft, ChevronRight, Play, Sparkles } from 'lucide-react';
import { Producto } from '../../types/database';
import { useCart } from '../../context/CartContext';
import { getProductImages, isVideoMedia } from '../../utils/productImages';
import { isLegendaryCap } from '../../utils/promoUtils';

interface ProductCardProps {
  product: Producto;
  categoryName?: string;
  onQuickView?: (product: Producto) => void;
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  categoryName,
  onQuickView,
}) => {
  const { addItem, items } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const isLegendary = isLegendaryCap(product, categoryName);
  const images = getProductImages(product);
  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentImgIndex] || product.imagen_url;
  const isCurrentVideo = isVideoMedia(currentImage);

  // Check how many of this product are already in cart
  const cartItem = items.find((item) => item.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const remainingStock = Math.max(0, product.stock - inCartQty);
  const isOutOfStock = product.stock <= 0;
  const isMaxReached = inCartQty >= product.stock && product.stock > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock || isMaxReached) return;

    setIsAdding(true);
    addItem(product, 1);

    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Touch Swipe tracking for phones & tablets
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasMultipleImages) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!hasMultipleImages || touchStartX.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - endX;
    const diffY = (touchStartY.current || 0) - endY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
      if (diffX > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <article
      onClick={() => onQuickView && onQuickView(product)}
      className="group flex flex-col bg-[#0e0e11] border border-white/[0.07] hover:border-white/[0.2] transition-colors duration-300 cursor-pointer overflow-hidden rounded-sm select-none"
    >
      {/* 1. Protagonist Image Container (consistent 4:5 aspect ratio) with Carousel */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-[4/5] w-full overflow-hidden bg-[#141418] flex items-center justify-center touch-pan-y"
      >
        {currentImage && !imgError ? (
          isCurrentVideo ? (
            <video
              key={currentImage}
              src={currentImage}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-out"
            />
          ) : (
            <img
              key={currentImage}
              src={currentImage}
              alt={product.nombre}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          )
        ) : (
          /* Clean Luxury Fallback */
          <div className="flex flex-col items-center justify-center text-center p-6 bg-[#121215] w-full h-full">
            <div className="w-12 h-12 rounded-full border border-white/10 p-0.5 flex items-center justify-center mb-3 bg-black">
              <img
                src="/images/logo/logotipo.jpeg"
                alt="Pretty-Store"
                className="w-full h-full object-cover rounded-full opacity-70"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#c5a059]">
              Pretty-Store
            </span>
            <span className="text-[11px] text-stone-400 mt-1 font-light">
              Pieza Exclusiva
            </span>
          </div>
        )}

        {/* Video Badge */}
        {isCurrentVideo && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] text-white flex items-center gap-1 border border-white/15 z-10 shadow">
            <Play size={10} className="fill-amber-400 text-amber-400" />
            <span className="tracking-wider uppercase text-[9px] font-medium">Video</span>
          </span>
        )}

        {/* Low Stock Urgent Badge - Ultra Llamativo cuando se están agotando */}
        {!isOutOfStock && product.stock <= 5 && (
          <span className={`absolute ${isCurrentVideo ? 'top-10' : 'top-2.5'} right-2.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-black text-[11px] tracking-wider flex items-center gap-1.5 shadow-2xl shadow-red-600/70 border-2 border-yellow-300 z-10 animate-bounce`}>
            <span className="text-sm">🔥</span>
            <span>¡QUEDAN {product.stock}!</span>
          </span>
        )}

        {/* Legendary Caps Promo Badge */}
        {isLegendary && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md text-[10px] text-amber-300 flex items-center gap-1.5 border border-[#c5a059]/50 z-10 shadow-lg font-medium tracking-wide">
            <Sparkles size={11} className="text-[#c5a059]" />
            <span>2 por $55</span>
          </span>
        )}

        {/* Carousel Arrow Controls */}
        {hasMultipleImages && (
          <>
            <button
              onClick={handlePrevImage}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 cursor-pointer z-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextImage}
              aria-label="Siguiente foto"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 cursor-pointer z-10"
            >
              <ChevronRight size={16} />
            </button>

            {/* Carousel Dot Indicators */}
            <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentImgIndex
                      ? 'w-4 bg-[#c5a059]'
                      : 'w-1.5 bg-white/40 group-hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Quiet Stock Marker Overlay (if out of stock) */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
            <span className="px-3 py-1 bg-black/90 text-stone-300 text-[10px] uppercase tracking-[0.2em] font-medium border border-white/10">
              Agotado
            </span>
          </div>
        )}

        {/* Subtle Quick View Text on Hover (only if not clicking arrows) */}
        {!hasMultipleImages && (
          <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex justify-center pointer-events-none">
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-stone-300 bg-black/80 backdrop-blur-sm px-3 py-1.5 border border-white/10">
              Vista Rápida
            </span>
          </div>
        )}
      </div>

      {/* 2. Content & Details */}
      <div className="flex flex-col flex-1 p-5 sm:p-6 space-y-3">
        {/* Category & Stock Indicator (Zero-Pill discipline) */}
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em]">
          <span className="text-[#c5a059] font-medium">
            {categoryName || 'Colección'}
          </span>
          {!isOutOfStock && product.stock <= 5 ? (
            <span className="px-2.5 py-1 rounded-full bg-red-600/30 text-amber-300 border border-red-500/80 font-black text-[10px] tracking-wide flex items-center gap-1 animate-pulse shadow-md shadow-red-600/30">
              <span className="text-xs">⚡</span>
              <span>¡Solo {product.stock} restantes!</span>
            </span>
          ) : !isOutOfStock ? (
            <span className="text-emerald-400 font-light flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Disponible</span>
            </span>
          ) : null}
        </div>

        {/* Product Name */}
        <h3 className="text-base font-serif-luxury font-normal text-white group-hover:text-stone-100 transition-colors line-clamp-1">
          {product.nombre}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed font-light flex-1">
          {product.descripcion || 'Pieza exclusiva diseñada con materiales nobles y acabados de primera calidad.'}
        </p>

        {/* Price & Add to Cart Action */}
        <div className="pt-3 border-t border-white/[0.07] flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-light">
              Precio
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-mono tabular-nums font-medium text-white">
                ${product.precio.toFixed(2)}
              </span>
              {isLegendary && (
                <span className="text-[10px] text-amber-300 font-mono font-medium">
                  (2x $55)
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isMaxReached}
            className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-[11px] uppercase tracking-[0.16em] font-medium transition-all duration-200 cursor-pointer ${
              isOutOfStock
                ? 'bg-stone-900 text-stone-500 border border-white/5 cursor-not-allowed'
                : isMaxReached
                ? 'bg-stone-900 text-stone-400 border border-white/10 cursor-not-allowed'
                : isAdding
                ? 'bg-[#c5a059] text-stone-950 font-semibold'
                : 'bg-white hover:bg-stone-200 text-stone-950 active:scale-95'
            }`}
            aria-label={`Añadir ${product.nombre} a la bolsa`}
          >
            {isAdding ? (
              <>
                <Check size={14} className="stroke-[2.5]" />
                <span className="hidden sm:inline">Añadido</span>
              </>
            ) : isOutOfStock ? (
              <span>Agotado</span>
            ) : isMaxReached ? (
              <span>En Carrito</span>
            ) : (
              <>
                <ShoppingBag size={13} className="stroke-[2]" />
                <span>Añadir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
