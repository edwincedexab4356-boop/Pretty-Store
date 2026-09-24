/**
 * Supabase Database Schemas and Types
 * Exactly mirrors existing database tables:
 * - categorias
 * - productos
 * - inventario
 * - pedidos
 * - detalle_pedidos
 * - ventas
 * - gastos
 * - perfiles
 * - clientes
 */

export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url?: string | null;
  activa: boolean;
  created_at?: string;
  // Campos calculados para admin
  total_productos?: number;
}

export interface Producto {
  id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  costo: number;
  stock: number;
  imagen_url: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  // Relación opcional para joins
  categoria?: Categoria;
}

export interface CartItem {
  product: Producto;
  quantity: number;
  subtotal: number;
}

export interface Inventario {
  id: string;
  producto_id: string;
  stock_actual: number;
  stock_minimo: number;
  updated_at?: string;
  producto?: Producto;
}

export type MetodoPago = 'efectivo' | 'tarjeta' | 'yappy' | 'transferencia';

export type EstadoPedido = 
  | 'pendiente'
  | 'confirmado'
  | 'preparando'
  | 'enviado'
  | 'entregado'
  | 'cancelado';

export interface Pedido {
  id: string;
  cliente_id: string | null;
  direccion: string;
  subtotal: number;
  total: number;
  estado: EstadoPedido;
  metodo_pago: MetodoPago;
  notas: string | null;
  created_at?: string;
  updated_at?: string;
  // Relaciones
  cliente?: Cliente;
  detalles?: DetallePedido[];
}

export interface DetallePedido {
  id: string;
  pedido_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at?: string;
  producto?: Producto;
}

export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string | null;
  created_at?: string;
  // Campos calculados
  pedidos_count?: number;
  total_gastado?: number;
  ultimo_pedido?: string;
}

export interface Venta {
  id: string;
  pedido_id: string;
  total: number;
  fecha?: string;
  created_at?: string;
  pedido?: Pedido;
}

export interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  categoria: string;
  fecha?: string;
  created_at?: string;
}

export interface Perfil {
  id: string;
  nombre: string | null;
  rol: 'admin' | 'cajero' | 'cliente';
  created_at?: string;
}

export interface StoreConfig {
  nombre_tienda: string;
  descripcion: string;
  logo_url: string;
  hero_video_url: string;
  hero_poster_url?: string;
  catalog_video_url?: string;
  telefono: string;
  whatsapp: string;
  email: string;
  direccion: string;
  instagram: string;
  facebook: string;
  twitter: string;
}

export interface DashboardStats {
  ventas_hoy: number;
  ventas_mes: number;
  pedidos_hoy: number;
  pedidos_pendientes: number;
  total_productos: number;
  productos_agotados: number;
  productos_stock_bajo: number;
}
