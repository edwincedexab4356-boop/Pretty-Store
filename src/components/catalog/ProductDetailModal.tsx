import React, { useState } from 'react';
import { X, ShoppingBag, Check, ShieldCheck, Truck, ImageOff } from 'lucide-react';
import { Producto, Categoria } from '../../types/database';
import { useCart } from '../../context/CartContext';

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
  const [selectedQty, setSelectedQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  const category = categories.find((c) => c.id === product.categoria_id);
  const cartItem = items.find((item) => item.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const availableToAdd = Math.max(0, product.stock - inCartQty);
  const isOutOfStock = product.stock <= 0;

  const handleAdd = () => {
    if (isOutOfStock || availableToAdd <= 0) return;
    const ok = addItem(product, selectedQty);
    if (ok) {
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-[#0c0c0f] border border-white/10 shadow-2xl overflow-hidden z-10 my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-stone-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Cerrar detalle de producto"
        >
          <X size={18} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Column */}
          <div className="relative bg-[#141418] aspect-[4/5] md:aspect-auto min-h-[300px] flex items-center justify-center overflow-hidden">
            {product.imagen_url && !imgError ? (
              <img
                src={product.imagen_url}
                alt={product.nombre}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-[#121215] w-full h-full">
                <div className="w-14 h-14 rounded-full border border-white/10 p-0.5 flex items-center justify-center mb-3 bg-black">
                  <img
                    src="/images/logo/logotipo.jpeg"
                    alt="Pretty-Store"
                    className="w-full h-full object-cover rounded-full opacity-70"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#c5a059]">Pretty-Store</p>
                <p className="text-xs text-stone-400 mt-1 font-light">Pieza de Alta Gama</p>
              </div>
            )}

            {category && (
              <span className="absolute top-4 left-4 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] font-medium bg-black/85 text-stone-300 border border-white/10">
                {category.nombre}
              </span>
            )}
          </div>

          {/* Details Column */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em]">
                <span className="text-[#c5a059] font-medium">
                  {category ? category.nombre : 'Colección Oficial'}
                </span>
                {isOutOfStock ? (
                  <span className="text-rose-400">Agotado</span>
                ) : product.stock <= 3 ? (
                  <span className="text-amber-400">Últimas {product.stock} unidades</span>
                ) : (
                  <span className="text-stone-400 font-light">En stock ({product.stock})</span>
                )}
              </div>

              <h2 className="text-2xl font-serif-luxury font-normal text-white">
                {product.nombre}
              </h2>

              <p className="text-2xl font-mono tabular-nums font-medium text-white">
                ${product.precio.toFixed(2)}
              </p>

              <div className="text-xs text-stone-300 leading-relaxed font-light pt-2 border-t border-white/[0.08]">
                <p>{product.descripcion || 'Pieza exclusiva confeccionada bajo los más altos estándares de autenticidad y refinamiento.'}</p>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-stone-400 font-light">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-[#c5a059]" />
                  <span>100% Auténtico</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-[#c5a059]" />
                  <span>Envío Prioritario</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-white/[0.08] space-y-3">
              {!isOutOfStock && availableToAdd > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400 font-light uppercase tracking-wider text-[10px]">Cantidad:</span>
                  <div className="flex items-center border border-white/15">
                    <button
                      onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                      className="w-8 h-8 flex items-center justify-center text-stone-300 hover:bg-white/10 transition-colors cursor-pointer"
                      disabled={selectedQty <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono tabular-nums text-white">
                      {selectedQty}
                    </span>
                    <button
                      onClick={() => setSelectedQty(Math.min(availableToAdd, selectedQty + 1))}
                      className="w-8 h-8 flex items-center justify-center text-stone-300 hover:bg-white/10 transition-colors cursor-pointer"
                      disabled={selectedQty >= availableToAdd}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleAdd}
                disabled={isOutOfStock || availableToAdd <= 0}
                className="w-full py-3.5 bg-white hover:bg-stone-200 text-stone-950 font-sans-clean font-semibold uppercase tracking-[0.2em] text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isAdded ? (
                  <>
                    <Check size={15} className="stroke-[2.5]" />
                    <span>Añadido a la Bolsa</span>
                  </>
                ) : isOutOfStock ? (
                  <span>Agotado</span>
                ) : availableToAdd <= 0 ? (
                  <span>Límite de Stock Alcanzado</span>
                ) : (
                  <>
                    <ShoppingBag size={14} className="stroke-[2]" />
                    <span>Añadir a la Bolsa</span>
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
