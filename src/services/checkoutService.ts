import { getSupabaseClient } from '../lib/supabase';
import { CartItem, MetodoPago } from '../types/database';

export interface CreateOrderParams {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  metodoPago: MetodoPago;
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
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
  notas?: string;
}

/**
 * Validates stock, creates customer if needed, registers order in public.pedidos,
 * registers items in public.detalle_pedidos, and discounts stock in public.inventario and public.productos.
 */
export async function createRealOrder(params: CreateOrderParams): Promise<CreatedOrderResult> {
  const supabase = getSupabaseClient();
  const {
    items,
    subtotal,
    shipping,
    total,
    nombre,
    telefono,
    email,
    direccion,
    metodoPago,
    notas,
  } = params;

  if (!items || items.length === 0) {
    throw new Error('El carrito está vacío.');
  }

  // 1. Validar disponibilidad de stock en tiempo real
  for (const item of items) {
    // Check inventario first
    const { data: invRow } = await supabase
      .from('inventario')
      .select('stock_actual')
      .eq('producto_id', item.product.id)
      .limit(1);

    let available = item.product.stock;
    if (invRow && invRow.length > 0 && typeof invRow[0].stock_actual === 'number') {
      available = invRow[0].stock_actual;
    } else {
      // Check productos table
      const { data: prodRow } = await supabase
        .from('productos')
        .select('stock, activo')
        .eq('id', item.product.id)
        .single();

      if (prodRow) {
        if (!prodRow.activo) {
          throw new Error(`El producto "${item.product.nombre}" ya no está disponible en la tienda.`);
        }
        available = prodRow.stock ?? 0;
      }
    }

    if (available < item.quantity) {
      throw new Error(
        `Stock insuficiente para "${item.product.nombre}". Disponible: ${available} unidad(es), solicitado: ${item.quantity}.`
      );
    }
  }

  // 2. Registrar o buscar cliente en public.clientes
  let clienteId: string | null = null;
  try {
    const { data: existingClient } = await supabase
      .from('clientes')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .limit(1);

    if (existingClient && existingClient.length > 0) {
      clienteId = existingClient[0].id;
      // Actualizar datos del cliente
      await supabase
        .from('clientes')
        .update({
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          direccion: direccion.trim(),
        })
        .eq('id', clienteId);
    } else {
      const { data: newClient, error: clientErr } = await supabase
        .from('clientes')
        .insert([
          {
            nombre: nombre.trim(),
            email: email.trim().toLowerCase(),
            telefono: telefono.trim(),
            direccion: direccion.trim(),
          },
        ])
        .select('id')
        .single();

      if (!clientErr && newClient) {
        clienteId = newClient.id;
      }
    }
  } catch (err) {
    console.warn('Advertencia al registrar cliente:', err);
  }

  // 3. Crear pedido en public.pedidos
  const orderInsertPayload: any = {
    direccion: direccion.trim(),
    subtotal: Number(subtotal),
    total: Number(total),
    estado: 'pendiente',
    metodo_pago: metodoPago,
    notas: notas?.trim() || null,
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
    throw new Error(`Error al registrar pedido en Supabase: ${orderErr.message}`);
  }

  const orderId = createdOrder.id;

  // 4. Crear detalles en public.detalle_pedidos
  const detailsPayload = items.map((item) => ({
    pedido_id: orderId,
    producto_id: item.product.id,
    cantidad: item.quantity,
    precio_unitario: Number(item.product.precio),
    subtotal: Number(item.product.precio) * item.quantity,
  }));

  const { error: detailsErr } = await supabase
    .from('detalle_pedidos')
    .insert(detailsPayload);

  if (detailsErr) {
    console.warn('Error al registrar detalle_pedidos:', detailsErr.message);
  }

  // 5. Descontar stock en public.inventario y public.productos
  for (const item of items) {
    const qtyToDeduct = item.quantity;

    try {
      // Query current
      const { data: currentInv } = await supabase
        .from('inventario')
        .select('id, stock_actual')
        .eq('producto_id', item.product.id)
        .limit(1);

      if (currentInv && currentInv.length > 0) {
        const newStock = Math.max(0, (currentInv[0].stock_actual || 0) - qtyToDeduct);
        await supabase
          .from('inventario')
          .update({
            stock_actual: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq('producto_id', item.product.id);

        await supabase
          .from('productos')
          .update({
            stock: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.product.id);
      } else {
        // Fallback directly on productos
        const { data: curProd } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', item.product.id)
          .single();

        if (curProd) {
          const newStock = Math.max(0, (curProd.stock || 0) - qtyToDeduct);
          await supabase
            .from('productos')
            .update({
              stock: newStock,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.product.id);
        }
      }
    } catch (stockErr) {
      console.warn('Error descontando stock para', item.product.nombre, stockErr);
    }
  }

  // 6. Registrar en ventas si la tabla está disponible
  try {
    await supabase.from('ventas').insert([
      {
        pedido_id: orderId,
        total: Number(total),
        fecha: new Date().toISOString(),
      },
    ]);
  } catch (e) {
    // Silently continue if ventas table is protected
  }

  const orderNumber = `PED-${orderId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;

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
    nombre,
    email,
    telefono,
    direccion,
    metodoPago,
    subtotal,
    shipping,
    total,
    itemCount: items.reduce((acc, i) => acc + i.quantity, 0),
    notas: notas?.trim() || undefined,
  };
}
