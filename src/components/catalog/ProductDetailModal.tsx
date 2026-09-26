import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  ChevronLeft,
  ChevronRight,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Producto, Categoria } from '../../types/database';
import { useCart } from '../../context/CartContext';
import { getProductImages, isVideoMedia, getVideoEmbedUrl } from '../../utils/productImages';

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
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  if (!product) return null;

  const images = getProductImages(product);
  const hasMultipleImages = images.length > 1;
  const currentMediaUrl = images[currentImgIndex] || product.imagen_url;
  const isCurrentVideo = isVideoMedia(currentMediaUrl);
  const embedUrl = isCurrentVideo && currentMediaUrl ? getVideoEmbedUrl(currentMediaUrl) : null;

  const category = categories.find((c) => c.id === product.categoria_id);
  const cartItem = items.find((item) => item.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const availableToAdd = Math.max(0, product.stock - inCartQty);
  const isOutOfStock = product.stock <= 0;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog - Wide, spacious desktop layout so nothing is cut off */}
      <div className="relative w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl bg-[#0c0c0f] border border-white/10 shadow-2xl overflow-hidden z-10 my-4 sm:my-8 rounded-sm max-h-[92vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 text-stone-400 hover:text-white transition-colors cursor-pointer bg-black/70 hover:bg-black rounded-full border border-white/10"
          aria-label="Cerrar detalle de producto"
        >
          <X size={18} />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          {/* Media & Carousel Column (7 cols on desktop for expansive presentation) */}
          <div className="lg:col-span-7 flex flex-col bg-[#141418] border-b lg:border-b-0 lg:border-r border-white/10">
            <div className="relative aspect-[4/5] sm:aspect-[1/1] lg:aspect-[4/5] w-full flex items-center justify-center overflow-hidden bg-black/60">
              {currentMediaUrl && !imgError ? (
                isCurrentVideo ? (
                  embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={product.nombre}
                      className="w-full h-full border-0"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                      <video
                        key={currentMediaUrl}
                        src={currentMediaUrl}
                        controls
                        autoPlay
                        loop
                        muted={isVideoMuted}
                        playsInline
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsVideoMuted(!isVideoMuted);
                        }}
                        className="absolute bottom-4 left-4 z-20 p-2 rounded-full bg-black/80 hover:bg-black text-white border border-white/20 transition-all cursor-pointer shadow-lg"
                        title={isVideoMuted ? 'Activar sonido' : 'Silenciar video'}
                      >
                        {isVideoMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                    </div>
                  )
                ) : (
                  <img
                    key={currentMediaUrl}
                    src={currentMediaUrl}
                    alt={product.nombre}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover object-center animate-in fade-in duration-200"
                  />
                )
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

              {/* Category & Video Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                {category && (
                  <span className="px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] font-medium bg-black/85 text-stone-300 border border-white/10">
                    {category.nombre}
                  </span>
                )}
                {isCurrentVideo && (
                  <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold bg-amber-500 text-black flex items-center gap-1 rounded-sm shadow">
                    <Play size={10} className="fill-black" />
                    <span>Video</span>
                  </span>
                )}
              </div>

              {/* Carousel Navigation Buttons */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={handlePrevImage}
                    aria-label="Foto o video anterior"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center border border-white/15 transition-all cursor-pointer shadow-lg z-20"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    aria-label="Siguiente foto o video"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center border border-white/15 transition-all cursor-pointer shadow-lg z-20"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Photo Index Counter */}
                  <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[10px] font-mono bg-black/80 text-stone-300 border border-white/10 tracking-wider z-20">
                    {currentImgIndex + 1} / {images.length}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnail Strip (if multiple photos / videos) */}
            {hasMultipleImages && (
              <div className="p-3 bg-[#0d0d10] border-t border-white/10 flex items-center gap-2 overflow-x-auto">
                {images.map((mediaUrl, idx) => {
                  const isThumbVideo = isVideoMedia(mediaUrl);
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentImgIndex(idx)}
                      className={`relative w-14 h-16 shrink-0 rounded overflow-hidden border transition-all cursor-pointer group ${
                        idx === currentImgIndex
                          ? 'border-[#c5a059] ring-2 ring-[#c5a059] opacity-100 scale-105'
                          : 'border-white/10 opacity-50 hover:opacity-85'
                      }`}
                    >
                      {isThumbVideo ? (
                        <div className="w-full h-full bg-black flex flex-col items-center justify-center relative">
                          <Play size={16} className="text-amber-400 fill-amber-400" />
                          <span className="text-[8px] font-bold text-amber-300 uppercase tracking-tighter mt-0.5">
                            Video
                          </span>
                        </div>
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={`Miniatura ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details Column (5 cols on desktop with full room for title, details, and actions) */}
          <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em]">
                <span className="text-[#c5a059] font-medium">
                  {category ? category.nombre : 'Colección Oficial'}
                </span>
                {isOutOfStock ? (
                  <span className="text-rose-400 font-medium">Agotado</span>
                ) : product.stock <= 3 ? (
                  <span className="text-amber-400 font-medium">Últimas {product.stock} unidades</span>
                ) : (
                  <span className="text-stone-400 font-light">En stock ({product.stock})</span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif-luxury font-normal text-white leading-tight">
                {product.nombre}
              </h2>

              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-2xl sm:text-3xl font-mono text-white tracking-tight">
                  ${product.precio.toFixed(2)}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                  USD
                </span>
              </div>

              {/* Description */}
              <div className="pt-2 border-t border-white/[0.08]">
                <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-medium block mb-2">
                  Descripción & Detalles
                </span>
                <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed whitespace-pre-line">
                  {product.descripcion ||
                    'Pieza elaborada con los más altos estándares de calidad y acabados de lujo.'}
                </p>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="p-3 bg-stone-900/40 border border-white/[0.06] rounded-sm space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-300 text-[11px] font-medium">
                    <ShieldCheck size={14} className="text-[#c5a059]" />
                    <span>100% Original</span>
                  </div>
                  <p className="text-[10px] text-stone-400 font-light">
                    Garantía de autenticidad en cada pieza.
                  </p>
                </div>
                <div className="p-3 bg-stone-900/40 border border-white/[0.06] rounded-sm space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-300 text-[11px] font-medium">
                    <Truck size={14} className="text-[#c5a059]" />
                    <span>Envío Nacional</span>
                  </div>
                  <p className="text-[10px] text-stone-400 font-light">
                    Uno Express, Ferguson o Servi Entrega.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Area */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              {!isOutOfStock && availableToAdd > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-400 uppercase tracking-wider font-light">
                    Cantidad
                  </span>
                  <div className="flex items-center border border-white/10 bg-stone-900">
                    <button
                      onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                      disabled={selectedQty <= 1}
                      className="px-3 py-1.5 text-stone-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-xs font-mono text-white">
                      {selectedQty}
                    </span>
                    <button
                      onClick={() => setSelectedQty((q) => Math.min(availableToAdd, q + 1))}
                      disabled={selectedQty >= availableToAdd}
                      className="px-3 py-1.5 text-stone-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleAdd}
                disabled={isOutOfStock || availableToAdd <= 0}
                className={`w-full py-4 text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  isOutOfStock || availableToAdd <= 0
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    : isAdded
                    ? 'bg-emerald-500 text-black font-semibold'
                    : 'bg-white hover:bg-stone-200 text-stone-950 font-semibold'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check size={16} />
                    <span>Añadido al Carrito</span>
                  </>
                ) : isOutOfStock ? (
                  <span>Agotado</span>
                ) : availableToAdd <= 0 ? (
                  <span>Límite de Stock en Carrito</span>
                ) : (
                  <>
                    <ShoppingBag size={16} />
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
