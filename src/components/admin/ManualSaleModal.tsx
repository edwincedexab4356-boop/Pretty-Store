import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  DollarSign,
  User,
  ShoppingBag,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Package,
} from 'lucide-react';
import {
  getAdminClients,
  getAdminProducts,
  createManualSale,
  ManualSaleItem,
} from '../../services/adminService';
import { Cliente, Producto, MetodoPago, TipoEntrega, CourierOption, EstadoPedido } from '../../types/database';

interface ManualSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemRow {
  id: string;
  producto_id?: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  stockDisponible?: number;
}

export const ManualSaleModal: React.FC<ManualSaleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Client Selection
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('new');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientSearch, setClientSearch] = useState<string>('');
  const [newClientNombre, setNewClientNombre] = useState<string>('Cliente Mostrador');
  const [newClientEmail, setNewClientEmail] = useState<string>('');
  const [newClientTelefono, setNewClientTelefono] = useState<string>('');
  const [newClientDireccion, setNewClientDireccion] = useState<string>('Venta en tienda');

  // Items
  const [items, setItems] = useState<ItemRow[]>([
    {
      id: 'item-1',
      producto_id: '',
      nombre: '',
      cantidad: 1,
      precio_unitario: 0,
      subtotal: 0,
    },
  ]);

  // Sale metadata
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('retiro');
  const [courier, setCourier] = useState<CourierOption>('Uno Express');
  const [estado, setEstado] = useState<EstadoPedido>('entregado');
  const [fecha, setFecha] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [notas, setNotas] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const loadMeta = async () => {
      setIsLoadingMeta(true);
      setErrorMsg(null);
      try {
        const [cls, prods] = await Promise.all([
          getAdminClients().catch(() => []),
          getAdminProducts().catch(() => []),
        ]);
        setClients(cls);
        setProducts(prods);

        // Prepopulate first item if products exist
        if (prods.length > 0 && items.length === 1 && !items[0].producto_id && !items[0].nombre) {
          const first = prods[0];
          setItems([
            {
              id: 'item-1',
              producto_id: first.id,
              nombre: first.nombre,
              cantidad: 1,
              precio_unitario: Number(first.precio) || 0,
              subtotal: Number(first.precio) || 0,
              stockDisponible: first.stock,
            },
          ]);
        }
      } catch (err: any) {
        console.warn('Error loading manual sale metadata:', err);
      } finally {
        setIsLoadingMeta(false);
      }
    };

    loadMeta();
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter existing clients
  const filteredClients = clients.filter((c) => {
    const q = clientSearch.toLowerCase();
    return (
      (c.nombre || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.telefono || '').toLowerCase().includes(q)
    );
  });

  const handleProductChange = (rowIndex: number, prodId: string) => {
    const newItems = [...items];
    if (prodId === '__custom__') {
      newItems[rowIndex] = {
        ...newItems[rowIndex],
        producto_id: undefined,
        nombre: 'Concepto personalizado',
        stockDisponible: undefined,
      };
    } else {
      const prod = products.find((p) => p.id === prodId);
      if (prod) {
        const price = Number(prod.precio) || 0;
        newItems[rowIndex] = {
          ...newItems[rowIndex],
          producto_id: prod.id,
          nombre: prod.nombre,
          precio_unitario: price,
          subtotal: price * (newItems[rowIndex].cantidad || 1),
          stockDisponible: prod.stock,
        };
      }
    }
    setItems(newItems);
  };

  const handleQuantityChange = (rowIndex: number, qty: number) => {
    const validQty = Math.max(1, qty);
    const newItems = [...items];
    const current = newItems[rowIndex];
    newItems[rowIndex] = {
      ...current,
      cantidad: validQty,
      subtotal: validQty * (current.precio_unitario || 0),
    };
    setItems(newItems);
  };

  const handlePriceChange = (rowIndex: number, price: number) => {
    const validPrice = Math.max(0, price);
    const newItems = [...items];
    const current = newItems[rowIndex];
    newItems[rowIndex] = {
      ...current,
      precio_unitario: validPrice,
      subtotal: (current.cantidad || 1) * validPrice,
    };
    setItems(newItems);
  };

  const handleNameChange = (rowIndex: number, name: string) => {
    const newItems = [...items];
    newItems[rowIndex].nombre = name;
    setItems(newItems);
  };

  const addItemRow = () => {
    const firstProd = products.length > 0 ? products[0] : null;
    const price = firstProd ? Number(firstProd.precio) || 0 : 0;
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        producto_id: firstProd?.id,
        nombre: firstProd?.nombre || 'Nuevo artículo',
        cantidad: 1,
        precio_unitario: price,
        subtotal: price,
        stockDisponible: firstProd?.stock,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedSubtotal = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  const calculatedTotal = calculatedSubtotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validations
    if (items.length === 0) {
      setErrorMsg('Debes incluir al menos un producto o concepto en la venta.');
      return;
    }

    for (const it of items) {
      if (!it.nombre.trim()) {
        setErrorMsg('Todos los artículos deben tener un nombre o descripción.');
        return;
      }
      if (it.cantidad <= 0) {
        setErrorMsg('La cantidad debe ser mayor a 0.');
        return;
      }
    }

    if (clientMode === 'new' && !newClientNombre.trim()) {
      setErrorMsg('Debes ingresar el nombre del cliente o "Cliente Mostrador".');
      return;
    }

    if (clientMode === 'existing' && !selectedClientId) {
      setErrorMsg('Por favor selecciona un cliente de la lista.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payloadItems: ManualSaleItem[] = items.map((it) => ({
        producto_id: it.producto_id,
        nombre: it.nombre,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        subtotal: it.subtotal,
      }));

      await createManualSale({
        cliente_id: clientMode === 'existing' ? selectedClientId : null,
        cliente_nombre: clientMode === 'new' ? newClientNombre.trim() : undefined,
        cliente_email: clientMode === 'new' ? newClientEmail.trim() : undefined,
        cliente_telefono: clientMode === 'new' ? newClientTelefono.trim() : undefined,
        cliente_direccion: clientMode === 'new' ? newClientDireccion.trim() : undefined,
        items: payloadItems,
        subtotal: calculatedSubtotal,
        total: calculatedTotal,
        metodo_pago: metodoPago,
        tipo_entrega: tipoEntrega,
        courier: tipoEntrega === 'delivery' ? courier : undefined,
        estado: estado,
        fecha: fecha ? new Date(fecha).toISOString() : new Date().toISOString(),
        notas: notas.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error registrando venta manual:', err);
      setErrorMsg(err?.message || 'Error al guardar la venta manual.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-[#0e0e12] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#c5a059]">
              <DollarSign size={20} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#c5a059] font-medium block">
                Punto de Venta Administrativo
              </span>
              <h3 className="text-lg sm:text-xl font-serif-luxury font-semibold text-white">
                Registrar Venta Manual
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Customer Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-wider text-stone-300 font-semibold flex items-center gap-1.5">
                <User size={13} className="text-[#c5a059]" />
                <span>Cliente de la Venta</span>
              </label>

              {/* Mode switch */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setClientMode('new')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    clientMode === 'new'
                      ? 'bg-[#c5a059] text-black font-semibold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Nuevo / Mostrador
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode('existing')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    clientMode === 'existing'
                      ? 'bg-[#c5a059] text-black font-semibold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Cliente Existente
                </button>
              </div>
            </div>

            {clientMode === 'new' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/[0.02] p-4 rounded-xl border border-white/[0.06]">
                <div>
                  <label className="block text-[10px] text-stone-400 uppercase font-medium mb-1">
                    Nombre o Referencia <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientNombre}
                    onChange={(e) => setNewClientNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez o Cliente Mostrador"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e0e12] border border-white/10 text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-stone-400 uppercase font-medium mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={newClientTelefono}
                    onChange={(e) => setNewClientTelefono(e.target.value)}
                    placeholder="Ej. +507 6000-0000"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e0e12] border border-white/10 text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-stone-400 uppercase font-medium mb-1">
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="cliente@correo.com"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e0e12] border border-white/10 text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-stone-400 uppercase font-medium mb-1">
                    Dirección / Ubicación
                  </label>
                  <input
                    type="text"
                    value={newClientDireccion}
                    onChange={(e) => setNewClientDireccion(e.target.value)}
                    placeholder="Ej. Retiro en tienda o Ciudad de Panamá"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e0e12] border border-white/10 text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.06] space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Buscar cliente por nombre, email o teléfono..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0e0e12] border border-white/10 text-white placeholder-stone-600 focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto divide-y divide-white/[0.04] border border-white/[0.08] rounded-lg">
                  {filteredClients.length === 0 ? (
                    <div className="p-3 text-center text-stone-500 text-[11px]">
                      No se encontraron clientes registrados.
                    </div>
                  ) : (
                    filteredClients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedClientId(c.id)}
                        className={`w-full text-left p-2.5 flex items-center justify-between transition-colors cursor-pointer ${
                          selectedClientId === c.id
                            ? 'bg-[#c5a059]/15 text-white'
                            : 'hover:bg-white/[0.03] text-stone-300'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-white">{c.nombre}</div>
                          <div className="text-[10px] text-stone-400">{c.email || c.telefono || 'Sin contacto'}</div>
                        </div>
                        {selectedClientId === c.id && (
                          <CheckCircle2 size={16} className="text-[#c5a059]" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Products & Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-wider text-stone-300 font-semibold flex items-center gap-1.5">
                <Package size={13} className="text-[#c5a059]" />
                <span>Productos & Artículos Vendidos</span>
              </label>

              <button
                type="button"
                onClick={addItemRow}
                className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-stone-200 text-[11px] font-medium border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus size={13} />
                <span>Agregar Artículo</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((it, idx) => (
                <div
                  key={it.id}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                >
                  {/* Select product from catalog or custom */}
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[9px] text-stone-400 uppercase font-medium mb-1">
                      Producto / Catálogo
                    </label>
                    <select
                      value={it.producto_id || (it.nombre ? '__custom__' : '')}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg bg-[#0e0e12] border border-white/10 text-white text-xs focus:outline-none focus:border-[#c5a059]"
                    >
                      <option value="" disabled>Selecciona producto...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} — {formatMoney(p.precio)} {p.stock !== undefined ? `(Stock: ${p.stock})` : ''}
                        </option>
                      ))}
                      <option value="__custom__">★ Concepto / Artículo Personalizado</option>
                    </select>
                  </div>

                  {/* If custom concept, show name input */}
                  {(!it.producto_id || it.producto_id === '__custom__') && (
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-[9px] text-stone-400 uppercase font-medium mb-1">
                        Descripción
                      </label>
                      <input
                        type="text"
                        value={it.nombre}
                        onChange={(e) => handleNameChange(idx, e.target.value)}
                        placeholder="Nombre del artículo o servicio"
                        className="w-full px-2.5 py-2 rounded-lg bg-[#0e0e12] border border-white/10 text-white text-xs focus:outline-none focus:border-[#c5a059]"
                      />
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="w-20">
                    <label className="block text-[9px] text-stone-400 uppercase font-medium mb-1">
                      Cant.
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={it.cantidad}
                      onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-2 rounded-lg bg-[#0e0e12] border border-white/10 text-white text-center text-xs focus:outline-none focus:border-[#c5a059]"
                    />
                  </div>

                  {/* Unit price */}
                  <div className="w-28">
                    <label className="block text-[9px] text-stone-400 uppercase font-medium mb-1">
                      Precio Unit ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={it.precio_unitario}
                      onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 rounded-lg bg-[#0e0e12] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#c5a059]"
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="w-24 text-right sm:text-center">
                    <span className="block text-[9px] text-stone-400 uppercase font-medium mb-1">
                      Subtotal
                    </span>
                    <span className="font-mono font-semibold text-white text-sm">
                      {formatMoney(it.subtotal)}
                    </span>
                  </div>

                  {/* Remove */}
                  <div className="flex items-center justify-end sm:pt-4">
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => removeItemRow(idx)}
                      className="p-2 text-stone-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-stone-500 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar artículo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Payment, Delivery & Order Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/[0.02] p-4 rounded-xl border border-white/[0.06]">
            <div>
              <label className="block text-[10px] text-stone-400 uppercase font-medium mb-1">
                Método de Pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                className="w-full px-3 py-2 rounded-lg bg-[#0e0e12] border border-white/10 text-white capitalize text-xs focus:outline-none focus:border-[#c5a059]"
              >
                <option value="efectivo">Efectivo</option>
                <option value="yappy">Yappy</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="tarjeta">Tarjeta (Débito/Crédito)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-stone-400 uppercase font-medium mb-1">
                Tipo de Entrega
              </label>
              <select
                value={tipoEntrega}
                onChange={(e) => setTipoEntrega(e.target.value as TipoEntrega)}
                className="w-full px-3 py-2 rounded-lg bg-[#0e0e12] border border-white/10 text-white capitalize text-xs focus:outline-none focus:border-[#c5a059]"
              >
                <option value="retiro">Retiro en Tienda / Mostrador</option>
                <option value="delivery">Envío / Mensajería</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-stone-400 uppercase font-medium mb-1">
                Estado del Pedido
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoPedido)}
                className="w-full px-3 py-2 rounded-lg bg-[#0e0e12] border border-white/10 text-white capitalize text-xs focus:outline-none focus:border-[#c5a059]"
              >
                <option value="entregado">Entregado (Venta Concretada)</option>
                <option value="confirmado">Confirmado</option>
                <option value="pendiente">Pendiente</option>
                <option value="preparando">Preparando</option>
                <option value="enviado">Enviado</option>
              </select>
            </div>

            {tipoEntrega === 'delivery' && (
              <div>
                <label className="block text-[10px] text-stone-400 uppercase font-medium mb-1">
                  Courier / Empresa
                </label>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value as CourierOption)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0e0e12] border border-white/10 text-white text-xs focus:outline-none focus:border-[#c5a059]"
                >
                  <option value="Uno Express">Uno Express</option>
                  <option value="Ferguson">Ferguson</option>
                  <option value="Servientrega">Servientrega</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-[10px] text-stone-400 uppercase font-medium mb-1 flex items-center gap-1">
                <Calendar size={11} className="text-[#c5a059]" />
                <span>Fecha y Hora de la Venta</span>
              </label>
              <input
                type="datetime-local"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0e0e12] border border-white/10 text-white text-xs focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className={tipoEntrega === 'delivery' ? 'sm:col-span-1' : 'sm:col-span-2'}>
              <label className="block text-[10px] text-stone-400 uppercase font-medium mb-1">
                Notas / Referencia de Pago (Opcional)
              </label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. Pago confirmado por WhatsApp ref #0921"
                className="w-full px-3 py-2 rounded-lg bg-[#0e0e12] border border-white/10 text-white placeholder-stone-600 text-xs focus:outline-none focus:border-[#c5a059]"
              />
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-[#0e0e12] border border-[#c5a059]/30 rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">
                Total de la Venta
              </span>
              <span className="text-xs text-stone-500">
                {items.length} {items.length === 1 ? 'artículo' : 'artículos'} incluidos
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-mono font-semibold text-[#c5a059]">
                {formatMoney(calculatedTotal)}
              </span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-stone-300 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#c5a059] to-[#d4af37] text-black hover:opacity-95 flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#c5a059]/20"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-black" />
                  <span>Registrando Venta...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Guardar Venta Manual</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
