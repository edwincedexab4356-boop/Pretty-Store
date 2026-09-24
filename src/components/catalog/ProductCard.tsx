import React, { useState } from 'react';
import { ShoppingBag, ImageOff, Check, AlertCircle } from 'lucide-react';
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
    <div
      onClick={() => onQuickView && onQuickView(product)}
      className="group relative flex flex-col bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer shadow-lg shadow-black/40"
    >
      {/* Product Image Box */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-950 flex items-center justify-center">
        {product.imagen_url && !imgError ? (
          <img
            src={product.imagen_url}
            alt={product.nombre}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          /* Graceful fallback for products without image */
          <div className="flex flex-col items-center justify-center text-slate-600 p-6 text-center">
            <ImageOff size={44} className="mb-2 stroke-1 opacity-70" />
            <span className="text-xs font-medium text-slate-500">
              Imagen no disponible
            </span>
            <span className="text-[10px] text-slate-600 mt-0.5">
              Fotografía en proceso
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
          {categoryName ? (
            <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-lg bg-slate-950/75 backdrop-blur-md text-slate-300 border border-white/10">
              {categoryName}
            </span>
          ) : (
            <span />
          )}

          {/* Stock Status Badge */}
          {isOutOfStock ? (
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-rose-950/85 backdrop-blur-md text-rose-300 border border-rose-600/40">
              Agotado
            </span>
          ) : product.stock <= 3 ? (
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-amber-950/85 backdrop-blur-md text-amber-300 border border-amber-600/40 animate-pulse">
              ¡Últimas {product.stock}!
            </span>
          ) : (
            <span className="px-2.5 py-1 text-[11px] font-medium tracking-wider rounded-lg bg-emerald-950/70 backdrop-blur-md text-emerald-400 border border-emerald-600/30">
              Stock: {product.stock}
            </span>
          )}
        </div>

        {/* Quick view hint on hover */}
        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-medium border border-white/20 backdrop-blur-sm shadow-lg">
            Vista Rápida
          </span>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="flex flex-col flex-1 p-5">
        {/* Title */}
        <h3 className="text-base font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-1 mb-1">
          {product.nombre}
        </h3>

        {/* Short description */}
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed flex-1">
          {product.descripcion || 'Sin descripción disponible para este producto.'}
        </p>

        {/* Price and Add button bar */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">
              Precio
            </span>
            <span className="text-xl font-bold text-amber-400 font-mono">
              ${product.precio.toFixed(2)}
            </span>
          </div>

          {/* Add to cart action button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isMaxReached}
            className={`relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
              isOutOfStock
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : isMaxReached
                ? 'bg-amber-950/40 text-amber-300/80 border border-amber-500/30 cursor-not-allowed'
                : isAdding
                ? 'bg-emerald-500 text-slate-950 scale-95'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
            }`}
            aria-label={
              isOutOfStock
                ? 'Producto agotado'
                : isMaxReached
                ? 'Stock máximo alcanzado'
                : `Agregar ${product.nombre} al carrito`
            }
          >
            {isOutOfStock ? (
              <span>Agotado</span>
            ) : isMaxReached ? (
              <span className="flex items-center gap-1">
                <AlertCircle size={14} />
                <span>En Carrito ({inCartQty})</span>
              </span>
            ) : isAdding ? (
              <span className="flex items-center gap-1.5">
                <Check size={16} className="stroke-[3]" />
                <span>Agregado</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <ShoppingBag size={15} />
                <span>Agregar</span>
                {inCartQty > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-950/20 text-[10px] font-bold">
                    +{inCartQty}
                  </span>
                )}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
