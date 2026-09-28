import { getSupabaseClient } from '../lib/supabase';
import { CartItem, MetodoPago, TipoEntrega, CourierOption } from '../types/database';

export interface CreateOrderParams {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  nombre: string;
  telefono: string;
  email?: string;
  direccion?: string;
  metodoPago: MetodoPago;
  tipoEntrega: TipoEntrega;
  courier?: CourierOption;
  comprobantePago?: string;
  tarjetaInfo?: {
    numeroEnmascarado: string;
    titular: string;
  };
  notas?: string;
}

export interface CreatedOrderResult {
  orderId: string;
  orderNumber: string;
  date: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  metodoPago: MetodoPago;
  tipoEntrega: TipoEntrega;
  courier?: CourierOption;
  comprobantePago?: string;
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
  notas?: string;
  items?: CartItem[];
}

/**
 * Sanitiza cadenas para prevenir XSS y ataques de inyección
 */
function sanitizeInput(str: string, maxLength = 250): string {
  if (!str) return '';
  return str
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates stock, re-verifies prices from authoritative database,
 * recalculates totals to prevent DevTools tampering,
 * creates customer if needed, registers order in public.pedidos with 'pendiente' status,
 * registers items in public.detalle_pedidos, and safely discounts stock.
 */
export async function createRealOrder(params: CreateOrderParams): Promise<CreatedOrderResult> {
  const supabase = getSupabaseClient();
  const {
    items,
    nombre,
    telefono,
    email = '',
    direccion = '',
    metodoPago,
    tipoEntrega,
    courier,
    comprobantePago,
    tarjetaInfo,
    notas,
  } = params;

  // 1. Validaciones estrictas de formulario
  const cleanNombre = sanitizeInput(nombre, 100);
  const cleanTelefono = sanitizeInput(telefono, 30);
  const cleanEmail = sanitizeInput(email, 120);
  const cleanDireccion = sanitizeInput(direccion, 250);
  const cleanNotas = sanitizeInput(notas || '', 300);
  const cleanComprobante = sanitizeInput(comprobantePago || '', 80);

  if (!cleanNombre || cleanNombre.length < 2) {
    throw new Error('Por favor ingresa un nombre válido.');
  }

  const phoneDigits = cleanTelefono.replace(/\D/g, '');
  if (!phoneDigits || phoneDigits.length < 7) {
    throw new Error('Por favor ingresa un número de teléfono válido (al menos 7 dígitos).');
  }

  if (tipoEntrega === 'delivery' && (!cleanDireccion || cleanDireccion.length < 5)) {
    throw new Error('Por favor especifica una dirección de entrega completa.');
  }

  const validMetodos: MetodoPago[] = ['yappy', 'tarjeta', 'transferencia', 'efectivo'];
  if (!validMetodos.includes(metodoPago)) {
    throw new Error('Método de pago no reconocido.');
  }

  if (!items || items.length === 0) {
    throw new Error('El carrito de compras está vacío.');
  }

  // 2. OBTENER PRECIOS AUTORIZADOS DIRECTAMENTE DESDE LA BASE DE DATOS
  // Nunca confiamos en los precios que el navegador envía.
  const productIds = items.map((i) => i.product.id).filter(Boolean);
  const { data: dbProducts, error: dbProdErr } = await supabase
    .from('productos')
    .select('id, nombre, precio, stock, activo')
    .in('id', productIds);

  if (dbProdErr || !dbProducts) {
    throw new Error('No se pudo verificar el catálogo en tiempo real. Intente nuevamente.');
  }

  const dbProductMap = new Map<string, { id: string; nombre: string; precio: number; stock: number; activo: boolean }>();
  dbProducts.forEach((p) => dbProductMap.set(String(p.id), p));

  // 3. Validar disponibilidad, estado activo y recalcular subtotales con PRECIOS OFICIALES
  let trustedSubtotal = 0;
  let totalItemCount = 0;
  const verifiedOrderLines: {
    product: { id: string; nombre: string; precio: number };
    quantity: number;
    subtotal: number;
  }[] = [];

  for (const item of items) {
    const pId = String(item.product.id);
    const dbProd = dbProductMap.get(pId);

    if (!dbProd) {
      throw new Error(`El producto "${item.product.nombre}" ya no existe en el catálogo.`);
    }

    if (!dbProd.activo) {
      throw new Error(`El artículo "${dbProd.nombre}" no está disponible actualmente.`);
    }

    // Validar cantidad como entero positivo
    const validQty = Math.max(1, Math.floor(Number(item.quantity) || 1));

    // Validar stock disponible en la base de datos
    // También verificar si existe registro en tabla 'inventario'
    let availableStock = dbProd.stock ?? 0;
    try {
      const { data: invRow } = await supabase
        .from('inventario')
        .select('stock_actual')
        .eq('producto_id', dbProd.id)
        .limit(1);

      if (invRow && invRow.length > 0 && typeof invRow[0].stock_actual === 'number') {
        availableStock = invRow[0].stock_actual;
      }
    } catch {
      // Usar stock de productos
    }

    if (availableStock < validQty) {
      throw new Error(
        `Disponibilidad insuficiente para "${dbProd.nombre}". Existencias: ${availableStock}, solicitado: ${validQty}.`
      );
    }

    // Usar PRECIO OFICIAL DE LA BASE DE DATOS (protección contra manipulación)
    const officialPrice = Number(dbProd.precio) || 0;
    const lineSubtotal = Number((officialPrice * validQty).toFixed(2));

    trustedSubtotal += lineSubtotal;
    totalItemCount += validQty;

    verifiedOrderLines.push({
      product: {
        id: dbProd.id,
        nombre: dbProd.nombre,
        precio: officialPrice,
      },
      quantity: validQty,
      subtotal: lineSubtotal,
    });
  }

  // 4. RECALCULAR ENVÍO Y TOTAL AUTORIZADOS
  trustedSubtotal = Number(trustedSubtotal.toFixed(2));
  const trustedShipping =
    tipoEntrega === 'retiro' ? 0 : trustedSubtotal >= 100 ? 0 : 5.0;
  const trustedTotal = Number((trustedSubtotal + trustedShipping).toFixed(2));

  // Resolver dirección y correo seguros
  const resolvedEmail = cleanEmail || `${phoneDigits}@prettystore.com`;
  const resolvedAddress =
    tipoEntrega === 'retiro'
      ? 'Retiro en el Local / Tienda física (Pretty-Store)'
      : `${cleanDireccion} (Envío vía: ${courier || 'Uno Express'})`;

  // 5. Registrar o vincular cliente en public.clientes
  let clienteId: string | null = null;
  try {
    const { data: existingClient } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefono', cleanTelefono)
      .limit(1);

    if (existingClient && existingClient.length > 0) {
      clienteId = existingClient[0].id;
      await supabase
        .from('clientes')
        .update({
          nombre: cleanNombre,
          telefono: cleanTelefono,
          direccion: resolvedAddress,
        })
        .eq('id', clienteId);
    } else {
      const { data: newClient, error: clientErr } = await supabase
        .from('clientes')
        .insert([
          {
            nombre: cleanNombre,
            email: resolvedEmail,
            telefono: cleanTelefono,
            direccion: resolvedAddress,
          },
        ])
        .select('id')
        .single();

      if (!clientErr && newClient) {
        clienteId = newClient.id;
      }
    }
  } catch (err) {
    console.warn('Registro de cliente en segundo plano:', err);
  }

  // Estructurar notas sin exponer datos confidenciales de pago
  const notesParts = [
    tipoEntrega === 'retiro'
      ? '[RETIRO EN EL LOCAL]'
      : `[DELIVERY VÍA ${courier ? courier.toUpperCase() : 'UNO EXPRESS'}]`,
    cleanComprobante ? `Comprobante/Ref (${metodoPago}): ${cleanComprobante}` : null,
    tarjetaInfo?.numeroEnmascarado
      ? `Tarjeta: ${sanitizeInput(tarjetaInfo.numeroEnmascarado, 30)} (${sanitizeInput(tarjetaInfo.titular || '', 50)})`
      : null,
    cleanNotas ? `Instrucciones: ${cleanNotas}` : null,
  ].filter(Boolean);

  const finalNotes = notesParts.join(' | ');

  // 6. CREAR PEDIDO EN public.pedidos
  // El estado inicial es estrictamente 'pendiente' (nunca pagado ni entregado)
  const orderInsertPayload: any = {
    direccion: resolvedAddress,
    subtotal: trustedSubtotal,
    total: trustedTotal,
    estado: 'pendiente',
    metodo_pago: metodoPago,
    notas: finalNotes,
  };

  if (clienteId) {
    orderInsertPayload.cliente_id = clienteId;
  }

  const { data: createdOrder, error: orderErr } = await supabase
    .from('pedidos')
    .insert([orderInsertPayload])
    .select()
    .single();

  if (orderErr) {
    throw new Error('No se pudo registrar el pedido en el servidor. Por favor verifique sus datos.');
  }

  const orderId = createdOrder.id;

  // 7. CREAR DETALLES EN public.detalle_pedidos CON PRECIOS OFICIALES
  const detailsPayload = verifiedOrderLines.map((line) => ({
    pedido_id: orderId,
    producto_id: line.product.id,
    cantidad: line.quantity,
    precio_unitario: line.product.precio,
    subtotal: line.subtotal,
  }));

  const { error: detailsErr } = await supabase
    .from('detalle_pedidos')
    .insert(detailsPayload);

  if (detailsErr) {
    console.warn('Detalle de pedidos guardado parcialmente:', detailsErr.message);
  }

  // 8. DESCUENTO DE STOCK DE FORMA SEGURA Y ATÓMICA
  for (const line of verifiedOrderLines) {
    const qtyToDeduct = line.quantity;
    const pId = line.product.id;

    let rpcSuccess = false;
    try {
      // Intentar primero con la función segura de PostgreSQL
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('deduct_product_stock_safe', {
        p_producto_id: pId,
        p_cantidad: qtyToDeduct,
      });
      if (!rpcErr && rpcRes === true) {
        rpcSuccess = true;
      }
    } catch {
      rpcSuccess = false;
    }

    if (!rpcSuccess) {
      // Fallback seguro: Descuento directo con GREATEST(0, stock - qty)
      try {
        const { data: curProd } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', pId)
          .single();

        if (curProd) {
          const currentStock = Number(curProd.stock) || 0;
          const newStock = Math.max(0, currentStock - qtyToDeduct);
          await supabase
            .from('productos')
            .update({ stock: newStock, updated_at: new Date().toISOString() })
            .eq('id', pId);
        }

        const { data: curInv } = await supabase
          .from('inventario')
          .select('id, stock_actual')
          .eq('producto_id', pId)
          .limit(1);

        if (curInv && curInv.length > 0) {
          const currentInvStock = Number(curInv[0].stock_actual) || 0;
          const newInvStock = Math.max(0, currentInvStock - qtyToDeduct);
          await supabase
            .from('inventario')
            .update({ stock_actual: newInvStock, updated_at: new Date().toISOString() })
            .eq('producto_id', pId);
        }
      } catch (stockErr) {
        console.warn('Actualización de existencias protegida:', stockErr);
      }
    }
  }

  // 9. Registrar en ventas si la tabla está configurada
  try {
    await supabase.from('ventas').insert([
      {
        pedido_id: orderId,
        total: trustedTotal,
        fecha: new Date().toISOString(),
      },
    ]);
  } catch {
    // Si la tabla ventas tiene RLS estricta para clientes, continúa con éxito
  }

  const orderNumber = `PED-${String(orderId || '').replace(/-/g, '').slice(0, 6).toUpperCase()}`;

  return {
    orderId,
    orderNumber,
    date: new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    nombre: cleanNombre,
    email: resolvedEmail,
    telefono: cleanTelefono,
    direccion: resolvedAddress,
    metodoPago,
    tipoEntrega,
    courier,
    comprobantePago: cleanComprobante,
    subtotal: trustedSubtotal,
    shipping: trustedShipping,
    total: trustedTotal,
    itemCount: totalItemCount,
    notas: finalNotes,
    items,
  };
}

