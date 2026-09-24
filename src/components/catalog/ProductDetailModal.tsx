import React, { useState } from 'react';
import { X, ShoppingBag, Check, ShieldCheck, Truck, RefreshCw, ImageOff } from 'lucide-react';
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
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden z-10 my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-950 rounded-full transition-colors cursor-pointer"
          aria-label="Cerrar ventana"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Column */}
          <div className="relative bg-slate-950 aspect-square md:aspect-auto min-h-[300px] flex items-center justify-center overflow-hidden">
            {product.imagen_url && !imgError ? (
              <img
                src={product.imagen_url}
                alt={product.nombre}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-600 p-8 text-center">
                <ImageOff size={56} className="mb-3 stroke-1 opacity-70" />
                <p className="text-sm font-medium text-slate-400">Sin imagen de producto</p>
                <p className="text-xs text-slate-600 mt-1">Se cargará en Supabase Storage</p>
              </div>
            )}

            {category && (
              <span className="absolute top-4 left-4 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-lg bg-slate-950/80 backdrop-blur-md text-amber-400 border border-amber-500/20">
                {category.nombre}
              </span>
            )}
          </div>

          {/* Details Column */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {isOutOfStock ? (
                  <span className="text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-800/40 px-2.5 py-0.5 rounded-full uppercase">
                    Agotado
                  </span>
                ) : product.stock <= 3 ? (
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2.5 py-0.5 rounded-full uppercase animate-pulse">
                    ¡Pocas existencias ({product.stock} disponibles)!
                  </span>
                ) : (
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                    {product.stock} unidades disponibles
                  </span>
                )}

                {inCartQty > 0 && (
                  <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                    En carrito: {inCartQty}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-white font-serif-luxury mb-3">
                {product.nombre}
              </h2>

              <p className="text-2xl font-extrabold text-amber-400 font-mono mb-4">
                ${product.precio.toFixed(2)}
              </p>

              <div className="text-sm text-slate-300 space-y-2 mb-6 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
                <p>{product.descripcion || 'Sin descripción detallada.'}</p>
              </div>

              {/* Badges / Guarantees */}
              <div className="grid grid-cols-2 gap-3 mb-6 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-amber-400" />
                  <span>100% Original</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-amber-400" />
                  <span>Envío seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw size={16} className="text-amber-400" />
                  <span>Garantía de tienda</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-amber-400" />
                  <span>Factura de venta</span>
                </div>
              </div>
            </div>

            {/* Quantity Stepper & Add to Cart */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  Cantidad:
                </span>
                <div className="inline-flex items-center rounded-xl bg-slate-950 border border-slate-800 p-1">
                  <button
                    onClick={() => setSelectedQty((prev) => Math.max(1, prev - 1))}
                    disabled={selectedQty <= 1 || isOutOfStock}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-white text-sm">
                    {selectedQty}
                  </span>
                  <button
                    onClick={() => setSelectedQty((prev) => Math.min(availableToAdd, prev + 1))}
                    disabled={selectedQty >= availableToAdd || isOutOfStock}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-500">
                  (Máx. {availableToAdd} para agregar)
                </span>
              </div>

              <button
                onClick={handleAdd}
                disabled={isOutOfStock || availableToAdd <= 0}
                className={`w-full py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isOutOfStock || availableToAdd <= 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : isAdded
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                }`}
              >
                {isOutOfStock ? (
                  <span>Producto Agotado</span>
                ) : availableToAdd <= 0 ? (
                  <span>Stock máximo alcanzado en el carrito</span>
                ) : isAdded ? (
                  <>
                    <Check size={18} />
                    <span>¡Agregado al Carrito!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>Agregar al Carrito — ${(product.precio * selectedQty).toFixed(2)}</span>
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
