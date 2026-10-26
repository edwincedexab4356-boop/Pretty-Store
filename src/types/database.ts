export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  activa: boolean;
  created_at?: string;
  total_productos?: number;
}

export interface ProductoOpcion {
  id: string;
  nombre: string;
  precio?: number;
  stock?: number;
}

export interface Producto {
  id: string;
  categoria_id: string | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  costo: number;
  stock: number;
  imagen_url: string | null;
  imagenes?: string[];
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  categoria?: Categoria;
  opciones?: ProductoOpcion[];
}

export interface CartItem {
  product: Producto;
  quantity: number;
  subtotal: number;
  selectedSize?: string;
  selectedOption?: ProductoOpcion;
}

export interface Inventario {
  id: string;
  producto_id: string;
  stock_actual: number;
  stock_minimo: number;
  updated_at?: string;
  producto?: Producto;
}

export type MetodoPago = 'tarjeta' | 'yappy' | 'transferencia' | 'efectivo';
export type TipoEntrega = 'delivery' | 'retiro';
export type CourierOption = 'Uno Express' | 'Ferguson' | 'Servientrega';

export type EstadoPedido =
  | 'pendiente'
  | 'confirmado'
  | 'preparando'
  | 'enviado'
  | 'entregado'
  | 'cancelado';

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  direccion: string | null;
  total_pedidos?: number;
  total_gastado?: number;
  created_at?: string;
}

export interface PedidoItem {
  id?: string;
  pedido_id?: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  producto?: Producto;
  selectedSize?: string;
  selectedOption?: ProductoOpcion;
}

export interface Pedido {
  id: string;
  numero_orden?: string;
  cliente_id?: string | null;
  cliente_nombre?: string | null;
  cliente_telefono?: string | null;
  cliente_email?: string | null;
  total: number;
  subtotal?: number;
  descuento?: number;
  envio?: number;
  metodo_pago: MetodoPago;
  tipo_entrega: TipoEntrega;
  courier?: string | null;
  estado: EstadoPedido;
  notas?: string | null;
  comprobante_pago?: string | null;
  created_at?: string;
  cliente?: Cliente;
  items?: PedidoItem[];
}

export interface ConfiguracionTienda {
  id?: number;
  nombre_tienda: string;
  descripcion: string;
  logo_url: string;
  hero_video_url?: string;
  hero_poster_url?: string;
  catalog_video_url?: string;
  telefono: string;
  whatsapp: string;
  email: string;
  direccion: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  twitter?: string;
  yappy_numero?: string;
  banco_datos?: string;
  pasarela_tarjeta?: string;
  link_pago_tarjeta?: string;
  badge_garantia_titulo?: string;
  badge_garantia_subtitulo?: string;
  updated_at?: string;
}

export interface Novedad {
  id: string;
  titulo?: string | null;
  subtitulo?: string | null;
  descripcion?: string | null;
  badge?: string | null;
  imagen_url: string;
  enlace_url?: string | null;
  orden: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

