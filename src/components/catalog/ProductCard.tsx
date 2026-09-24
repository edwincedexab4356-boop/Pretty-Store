import React, { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { Producto } from '../../types/database';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Producto;
  categoryName?: string;
  onQuickView?: (product: Producto) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  categoryName,
  onQuickView,
}) => {
  const { addItem, items } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [imgError, setImgError] = useState(false);

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

  return (
    <article
      onClick={() => onQuickView && onQuickView(product)}
      className="group flex flex-col bg-[#0e0e11] border border-white/[0.07] hover:border-white/[0.2] transition-colors duration-300 cursor-pointer overflow-hidden"
    >
      {/* 1. Protagonist Image Container (consistent 4:5 aspect ratio) */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#141418] flex items-center justify-center">
        {product.imagen_url && !imgError ? (
          <img
            src={product.imagen_url}
            alt={product.nombre}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-out"
            loading="lazy"
          />
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

        {/* Quiet Stock Marker Overlay (if out of stock) */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
            <span className="px-3 py-1 bg-black/90 text-stone-300 text-[10px] uppercase tracking-[0.2em] font-medium border border-white/10">
              Agotado
            </span>
          </div>
        )}

        {/* Subtle Quick View Text on Hover */}
        <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex justify-center pointer-events-none">
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-stone-300 bg-black/80 backdrop-blur-sm px-3 py-1.5 border border-white/10">
            Vista Rápida
          </span>
        </div>
      </div>

      {/* 2. Content & Details */}
      <div className="flex flex-col flex-1 p-5 sm:p-6 space-y-3">
        {/* Category & Stock Indicator (Zero-Pill discipline) */}
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em]">
          <span className="text-[#c5a059] font-medium">
            {categoryName || 'Colección'}
          </span>
          {!isOutOfStock && product.stock <= 3 ? (
            <span className="text-amber-400/90 font-light">
              Últimas {product.stock}
            </span>
          ) : !isOutOfStock ? (
            <span className="text-stone-400 font-light">
              Disponible
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
            <span className="text-lg font-mono tabular-nums font-medium text-white">
              ${product.precio.toFixed(2)}
            </span>
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
