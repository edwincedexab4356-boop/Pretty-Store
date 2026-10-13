import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Check, Sparkles, ShieldCheck, Truck, Ruler } from 'lucide-react';
import { Producto, Categoria } from '../../types/database';
import { useCart } from '../../context/CartContext';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { getProductImages } from '../../utils/productImages';
import { getProductPromo } from '../../utils/promoUtils';
import { resolveSizeOptions } from '../../utils/categorySizesStorage';

interface ProductDetailModalProps {
  product: Producto | null;
  categories: Categoria[];
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  categories,
  onClose,
}) => {
  const { addItem, items } = useCart();
  const { config } = useStoreConfig();
  const [selectedQty, setSelectedQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const category = categories.find((c) => c.id === product?.categoria_id);
  const promoRule = getProductPromo(product, category?.nombre);
  const sizeInfo = resolveSizeOptions(product?.categoria_id, category?.nombre, product?.nombre, category?.descripcion || '');
  const [selectedSize, setSelectedSize] = useState<string>(() => sizeInfo.options[0] || '');

  useEffect(() => {
    if (sizeInfo.options.length > 0) {
      setSelectedSize(sizeInfo.options[0]);
    }
  }, [product?.id, sizeInfo.options.length]);

  if (!product) return null;

  const images = getProductImages(product);
  const hasRealImage = images.length > 0;
  const currentImage = hasRealImage ? images[currentImgIndex] || images[0] : null;

  const cartItem = items.find((item) => item.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const availableToAdd = Math.max(0, product.stock - inCartQty);
  const isOutOfStock = product.stock <= 0;

  const handleAdd = () => {
    if (isOutOfStock || availableToAdd <= 0) return;
    const ok = addItem(product, selectedQty, sizeInfo.enabled ? selectedSize : undefined);
    if (ok) {
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/85 backdrop-blur-md" />

      {/* Dialog */}
      <div className="relative w-full max-w-4xl bg-[#100f14] border border-white/10 shadow-2xl rounded-3xl overflow-hidden z-10 my-4 flex flex-col max-h-[92vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 text-stone-400 hover:text-white transition-colors cursor-pointer bg-black/70 hover:bg-black rounded-full border border-white/10"
        >
          <X size={18} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto flex-1">
          {/* Images Column */}
          <div className="md:col-span-6 bg-black/50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10">
            <div className="relative aspect-square w-full max-w-md rounded-2xl overflow-hidden bg-black/80 border border-white/10 flex items-center justify-center">
              {hasRealImage && currentImage ? (
                <img
                  src={currentImage}
                  alt={product.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-full border border-white/10 p-0.5 flex items-center justify-center mb-3 bg-black/60 overflow-hidden">
                    <img
                      src="/images/logo/logotipo.jpeg"
                      alt="Pretty Store"
                      className="w-full h-full object-cover rounded-full opacity-85"
                    />
                  </div>
                  <span className="text-xs uppercase tracking-[0.25em] text-[#c5a059] font-medium">Pretty Store</span>
                  <span className="text-xs text-stone-400 mt-1 font-light">Pieza Exclusiva</span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-2 mt-4 overflow-x-auto max-w-full pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImgIndex(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      currentImgIndex === idx ? 'border-[#c5a059] scale-105' : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider">
                <span className="text-[#c5a059] font-bold">
                  {category ? category.nombre : 'Colección Oficial'}
                </span>
                {isOutOfStock ? (
                  <span className="text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30">
                    Agotado
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium">
                    En stock ({product.stock})
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-white leading-tight">
                {product.nombre}
              </h2>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-white">
                  ${product.precio.toFixed(2)}
                </span>
                <span className="text-xs text-stone-400 font-light uppercase tracking-wider">USD</span>
              </div>

              {/* Promo Banner if applicable */}
              {promoRule && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-[#c5a059]/15 to-transparent border border-amber-500/40 space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-[#fbbf24] animate-pulse" />
                    <span className="text-white text-xs font-bold tracking-wide">
                      ¡Promo Exclusiva: {promoRule.badgeText}!
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-300 font-light leading-relaxed">
                    Lleva 2 artículos de esta colección y te quedan en <strong className="text-[#fbbf24] font-mono font-bold">${promoRule.pairPrice.toFixed(2)} USD</strong>. El descuento de <strong className="text-emerald-400 font-mono">-${promoRule.pairDiscount.toFixed(2)} USD</strong> se aplica de forma automática en tu carrito.
                  </p>
                </div>
              )}

              {/* APARTADO DE TAMAÑO / TALLA / PRESENTACION */}
              {sizeInfo.enabled && sizeInfo.options.length > 0 && (
                <div className="pt-3 border-t border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-bold flex items-center gap-1.5">
                      <Ruler size={14} className="text-[#c5a059]" />
                      <span>{sizeInfo.label || 'Selecciona tu Tamaño'}:</span>
                    </span>
                    <span className="text-[#c5a059] font-mono font-bold text-xs bg-[#c5a059]/10 px-2.5 py-0.5 rounded-lg border border-[#c5a059]/30">
                      {selectedSize || 'Elige una opción'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {sizeInfo.options.map((opt) => {
                      const isSelected = selectedSize === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedSize(opt)}
                          className={`p-2.5 rounded-xl text-xs font-semibold transition-all text-center border cursor-pointer ${
                            isSelected
                              ? 'bg-[#c5a059] text-black font-bold border-[#c5a059] shadow-lg shadow-[#c5a059]/30 scale-[1.02]'
                              : 'bg-stone-900 text-stone-300 border-white/10 hover:border-white/30 hover:text-white'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="pt-2 border-t border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block mb-1">
                  Descripción
                </span>
                <p className="text-xs text-stone-300 font-light leading-relaxed whitespace-pre-line">
                  {product.descripcion || 'Pieza elaborada con los más altos estándares de calidad y acabados de lujo.'}
                </p>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-200 text-xs font-bold">
                    <ShieldCheck size={14} className="text-[#c5a059]" />
                    <span>Autenticidad</span>
                  </div>
                  <p className="text-[10px] text-stone-400 font-light">
                    {config.badge_garantia_subtitulo || 'Acabados de primera calidad y empaque de colección.'}
                  </p>
                </div>
                <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-200 text-xs font-bold">
                    <Truck size={14} className="text-[#c5a059]" />
                    <span>Envíos Seguros</span>
                  </div>
                  <p className="text-[10px] text-stone-400 font-light">
                    Servientrega, Ferguson o UnoExpress a todo el país.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Area */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              {!isOutOfStock && availableToAdd > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-400 uppercase tracking-wider font-semibold">
                    Cantidad
                  </span>
                  <div className="flex items-center border border-white/15 bg-black/60 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                      disabled={selectedQty <= 1}
                      className="px-3.5 py-1.5 text-stone-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-xs font-mono font-bold text-white">
                      {selectedQty}
                    </span>
                    <button
                      onClick={() => setSelectedQty((q) => Math.min(availableToAdd, q + 1))}
                      disabled={selectedQty >= availableToAdd}
                      className="px-3.5 py-1.5 text-stone-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleAdd}
                disabled={isOutOfStock || availableToAdd <= 0}
                className={`w-full py-4 rounded-xl text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                  isOutOfStock || availableToAdd <= 0
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    : isAdded
                    ? 'bg-emerald-500 text-black shadow-emerald-500/20'
                    : 'bg-[#c5a059] hover:bg-[#b5914a] text-black shadow-[#c5a059]/20'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check size={16} />
                    <span>¡Añadido al Carrito!</span>
                  </>
                ) : isOutOfStock ? (
                  <span>Agotado</span>
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    <span>Añadir al Carrito</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
