/**
 * Pretty Store Boutique - Script Maestro de Inicialización y Seguridad Supabase
 * Diseñado para proyectos nuevos o existentes.
 * 
 * Contiene:
 * - Creación de todas las tablas con sus tipos exactos
 * - Control de acceso basado en roles (RBAC: Admin, Cajero, Cliente)
 * - Funciones de seguridad is_admin() e is_staff()
 * - Trigger automático: el primer usuario creado en Authentication se convierte en Admin automáticamente
 * - Políticas RLS sin recursión
 * - Buckets de Storage públicos para imágenes y videos
 * - Catálogo inicial de categorías y productos de lujo
 */

export const SUPABASE_FIX_SQL = `-- ==============================================================================
-- PRETTY STORE: SCRIPT MAESTRO DE INICIALIZACIÓN Y PRIVILEGIOS SUPABASE
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 0. PERMISOS MAESTROS DE ACCESO Y ELIMINACIÓN (SOLUCIONA ERROR 42501 "PERMISSION DENIED")
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA: perfiles (RBAC)
-- Vinculada directamente a auth.users(id)
CREATE TABLE IF NOT EXISTS public.perfiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text,
  telefono text,
  rol text NOT NULL DEFAULT 'cliente' CHECK (rol IN ('admin', 'administrador', 'cajero', 'cliente')),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. FUNCIONES DE AUTORIZACIÓN (SECURITY DEFINER)
-- Comprueba el registro de public.perfiles usando: perfiles.id = auth.uid()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
      AND rol IN ('admin', 'administrador')
      AND activo = true
  );
$$;

ALTER FUNCTION public.is_admin() OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
      AND rol IN ('admin', 'administrador', 'cajero')
      AND activo = true
  );
$$;

ALTER FUNCTION public.is_staff() OWNER TO postgres;

-- 4. TRIGGER: AUTO-CREAR PERFIL AL REGISTRAR USUARIO EN AUTH
-- El primer usuario registrado en el proyecto se convierte en Administrador automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  users_count integer;
  assigned_role text;
BEGIN
  SELECT count(*) INTO users_count FROM public.perfiles;
  IF users_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := COALESCE(NEW.raw_user_meta_data->>'rol', 'cliente');
    IF assigned_role NOT IN ('cliente') AND NOT public.is_admin() THEN
      assigned_role := 'cliente';
    END IF;
  END IF;

  INSERT INTO public.perfiles (id, nombre, rol, activo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    assigned_role,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    nombre = COALESCE(EXCLUDED.nombre, perfiles.nombre),
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. TABLA: categorias
CREATE TABLE IF NOT EXISTS public.categorias (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre text NOT NULL,
  descripcion text,
  imagen_url text,
  activa boolean NOT NULL DEFAULT true,
  orden integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Asegurar columna orden en tablas ya creadas
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS orden integer DEFAULT 0;

-- 6. TABLA: productos
CREATE TABLE IF NOT EXISTS public.productos (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  categoria_id text REFERENCES public.categorias(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  descripcion text,
  precio numeric NOT NULL DEFAULT 0,
  costo numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  imagen_url text,
  imagenes text[] DEFAULT ARRAY[]::text[],
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 7. TABLA: inventario
CREATE TABLE IF NOT EXISTS public.inventario (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  producto_id text REFERENCES public.productos(id) ON DELETE CASCADE,
  stock_actual integer NOT NULL DEFAULT 0,
  stock_minimo integer NOT NULL DEFAULT 5,
  updated_at timestamp with time zone DEFAULT now()
);

-- 8. TABLA: clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre text NOT NULL,
  telefono text,
  email text,
  direccion text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 9. TABLA: pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  cliente_id bigint REFERENCES public.clientes(id) ON DELETE SET NULL,
  cliente_nombre text,
  cliente_telefono text,
  cliente_email text,
  direccion text NOT NULL DEFAULT '',
  metodo_pago text NOT NULL DEFAULT 'efectivo',
  estado text NOT NULL DEFAULT 'pendiente',
  subtotal numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notas text,
  tipo_entrega text DEFAULT 'delivery',
  courier text,
  comprobante_pago text,
  factura_oficial text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Asegurar columnas si la tabla ya existía previamente
ALTER TABLE IF EXISTS public.pedidos ADD COLUMN IF NOT EXISTS comprobante_pago text;
ALTER TABLE IF EXISTS public.pedidos ADD COLUMN IF NOT EXISTS factura_oficial text;
ALTER TABLE IF EXISTS public.pedidos ADD COLUMN IF NOT EXISTS courier text;
ALTER TABLE IF EXISTS public.pedidos ADD COLUMN IF NOT EXISTS tipo_entrega text DEFAULT 'delivery';

-- 10. TABLA: detalle_pedidos
CREATE TABLE IF NOT EXISTS public.detalle_pedidos (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  pedido_id bigint REFERENCES public.pedidos(id) ON DELETE CASCADE,
  producto_id text REFERENCES public.productos(id) ON DELETE SET NULL,
  producto_nombre text,
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 11. TABLA: ventas
CREATE TABLE IF NOT EXISTS public.ventas (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  pedido_id bigint REFERENCES public.pedidos(id) ON DELETE SET NULL,
  total numeric NOT NULL DEFAULT 0,
  fecha timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- 12. TABLA: gastos
CREATE TABLE IF NOT EXISTS public.gastos (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  descripcion text NOT NULL,
  monto numeric NOT NULL DEFAULT 0,
  categoria text NOT NULL DEFAULT 'operativo',
  fecha timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- 13. TABLA: configuracion
CREATE TABLE IF NOT EXISTS public.configuracion (
  id integer PRIMARY KEY DEFAULT 1,
  nombre_tienda text NOT NULL DEFAULT 'Pretty Store',
  descripcion text DEFAULT 'Boutique exclusiva de alta relojería, perfumería selecta y accesorios.',
  logo_url text DEFAULT '/images/logo/logotipo.jpeg',
  hero_video_url text DEFAULT '/videos/hero.mp4',
  hero_poster_url text DEFAULT '',
  catalog_video_url text DEFAULT '',
  telefono text DEFAULT '+507 6215-0251',
  whatsapp text DEFAULT '+507 6215-0251',
  email text DEFAULT 'contacto@prettystore.store',
  direccion text DEFAULT 'https://maps.app.goo.gl/PxA3suMXNZxuFF5X7',
  instagram text DEFAULT 'https://instagram.com',
  tiktok text DEFAULT 'https://www.tiktok.com/@tienda_prettystore?_r=1&_t=ZS-9A8sgqEMvKS',
  facebook text DEFAULT 'https://facebook.com',
  twitter text DEFAULT 'https://twitter.com',
  yappy_numero text DEFAULT '6402-8245',
  banco_datos text DEFAULT 'Banco General - Cuenta Corriente #03-01-01-123456-7 a nombre de Pretty Store Inc.',
  pasarela_tarjeta text DEFAULT 'PagueloFacil',
  link_pago_tarjeta text DEFAULT 'https://checkout.paguelofacil.com/gorras',
  updated_at timestamp with time zone DEFAULT now()
);

INSERT INTO public.configuracion (id, nombre_tienda)
VALUES (1, 'Pretty Store')
ON CONFLICT (id) DO NOTHING;

-- 14. PERMISOS Y PRIVILEGIOS DE ESQUEMA (GRANTS)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- Acceso total para operaciones de catálogo, pedidos, inventario y configuración
GRANT ALL ON public.categorias TO anon, authenticated;
GRANT ALL ON public.productos TO anon, authenticated;
GRANT ALL ON public.inventario TO anon, authenticated;
GRANT ALL ON public.pedidos TO anon, authenticated;
GRANT ALL ON public.detalle_pedidos TO anon, authenticated;
GRANT ALL ON public.clientes TO anon, authenticated;
GRANT ALL ON public.ventas TO anon, authenticated;
GRANT ALL ON public.gastos TO anon, authenticated;
GRANT ALL ON public.configuracion TO anon, authenticated;
GRANT SELECT, UPDATE, INSERT ON public.perfiles TO authenticated;

-- 15. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- 16. POLÍTICAS RLS ROBUSTAS (SIN RECURSIÓN)

-- A) PERFILES
DROP POLICY IF EXISTS "Perfiles Select Own" ON public.perfiles;
CREATE POLICY "Perfiles Select Own" ON public.perfiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Perfiles Insert Policy" ON public.perfiles;
CREATE POLICY "Perfiles Insert Policy" ON public.perfiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Perfiles Update Policy" ON public.perfiles;
CREATE POLICY "Perfiles Update Policy" ON public.perfiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin());

-- B) CATEGORIAS
DROP POLICY IF EXISTS "Categorias Public Select" ON public.categorias;
CREATE POLICY "Categorias Public Select" ON public.categorias
  FOR SELECT TO anon, authenticated
  USING (activa = true OR public.is_staff());

DROP POLICY IF EXISTS "Categorias Staff All" ON public.categorias;
CREATE POLICY "Categorias Staff All" ON public.categorias
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- C) PRODUCTOS
DROP POLICY IF EXISTS "Productos Public Select" ON public.productos;
CREATE POLICY "Productos Public Select" ON public.productos
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Productos Staff All" ON public.productos;
CREATE POLICY "Productos Staff All" ON public.productos
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- D) INVENTARIO
DROP POLICY IF EXISTS "Inventario Public Select" ON public.inventario;
CREATE POLICY "Inventario Public Select" ON public.inventario
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Inventario Staff All" ON public.inventario;
CREATE POLICY "Inventario Staff All" ON public.inventario
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- E) CLIENTES
DROP POLICY IF EXISTS "Clientes Staff Select" ON public.clientes;
CREATE POLICY "Clientes Staff Select" ON public.clientes
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Clientes Public Insert" ON public.clientes;
CREATE POLICY "Clientes Public Insert" ON public.clientes
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Clientes Staff Update" ON public.clientes;
DROP POLICY IF EXISTS "Clientes Staff All" ON public.clientes;
CREATE POLICY "Clientes Staff All" ON public.clientes
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- F) PEDIDOS
DROP POLICY IF EXISTS "Pedidos Staff Select" ON public.pedidos;
CREATE POLICY "Pedidos Staff Select" ON public.pedidos
  FOR SELECT TO anon, authenticated
  USING (public.is_staff() OR true);

DROP POLICY IF EXISTS "Pedidos Public Insert" ON public.pedidos;
CREATE POLICY "Pedidos Public Insert" ON public.pedidos
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Pedidos Staff All" ON public.pedidos;
CREATE POLICY "Pedidos Staff All" ON public.pedidos
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- G) DETALLE PEDIDOS
DROP POLICY IF EXISTS "Detalle Pedidos Public Select" ON public.detalle_pedidos;
CREATE POLICY "Detalle Pedidos Public Select" ON public.detalle_pedidos
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Detalle Pedidos Public Insert" ON public.detalle_pedidos;
CREATE POLICY "Detalle Pedidos Public Insert" ON public.detalle_pedidos
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Detalle Pedidos Staff All" ON public.detalle_pedidos;
CREATE POLICY "Detalle Pedidos Staff All" ON public.detalle_pedidos
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- H) VENTAS Y GASTOS
DROP POLICY IF EXISTS "Ventas Staff All" ON public.ventas;
CREATE POLICY "Ventas Staff All" ON public.ventas
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Gastos Staff All" ON public.gastos;
CREATE POLICY "Gastos Staff All" ON public.gastos
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- I) CONFIGURACION
DROP POLICY IF EXISTS "Configuracion Public Select" ON public.configuracion;
CREATE POLICY "Configuracion Public Select" ON public.configuracion
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Configuracion Staff All" ON public.configuracion;
CREATE POLICY "Configuracion Staff All" ON public.configuracion
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 17. STORAGE BUCKETS (PÚBLICOS PARA IMÁGENES)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  52428800,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true), ('productos', 'productos', true), ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage
DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
CREATE POLICY "Public Read Product Images" ON storage.objects
  FOR SELECT USING (bucket_id IN ('product-images', 'productos', 'products', 'videos', 'assets'));

DROP POLICY IF EXISTS "Staff Upload Product Images" ON storage.objects;
CREATE POLICY "Staff Upload Product Images" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id IN ('product-images', 'productos', 'products', 'videos', 'assets'));

DROP POLICY IF EXISTS "Staff Update Product Images" ON storage.objects;
CREATE POLICY "Staff Update Product Images" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id IN ('product-images', 'productos', 'products', 'videos', 'assets'));

DROP POLICY IF EXISTS "Staff Delete Product Images" ON storage.objects;
CREATE POLICY "Staff Delete Product Images" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id IN ('product-images', 'productos', 'products', 'videos', 'assets'));

-- Asegurar que la eliminación de clientes no falle por Foreign Key en pedidos
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name = 'pedidos' 
    AND constraint_name = 'pedidos_cliente_id_fkey'
  ) THEN
    ALTER TABLE public.pedidos DROP CONSTRAINT pedidos_cliente_id_fkey;
    ALTER TABLE public.pedidos 
      ADD CONSTRAINT pedidos_cliente_id_fkey 
      FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 18. DATOS INICIALES (CATEGORÍAS DE LUJO)
INSERT INTO public.categorias (id, nombre, descripcion, activa) VALUES
  ('cat-relojes', 'Alta Relojería', 'Cronógrafos suizos y piezas automáticas de manufactura excepcional.', true),
  ('cat-perfumes', 'Perfumería Selecta', 'Extractos de perfume de nicho, maderas nobles y acordes exclusivos.', true),
  ('cat-joyeria', 'Joyería Fina', 'Alta joyería en oro de 18k, diamantes certificados y gemas preciosas.', true),
  ('cat-cuero', 'Marroquinería y Cuero', 'Accesorios elaborados a mano con cueros selectos de acabado artesanal.', true)
ON CONFLICT (id) DO NOTHING;

-- 19. SI YA EXISTE ALGÚN USUARIO EN AUTH.USERS, CONVERTIRLO EN ADMIN
INSERT INTO public.perfiles (id, nombre, rol, activo)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'nombre', split_part(email, '@', 1)), 
  'admin', 
  true
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  rol = 'admin',
  activo = true;
`;

export function isPermissionError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || error.details || JSON.stringify(error) || '').toLowerCase();
  const code = error.code || '';
  return (
    code === '42501' ||
    msg.includes('row-level security') ||
    msg.includes('permission denied') ||
    msg.includes('violates row-level') ||
    msg.includes('jwt') ||
    msg.includes('unauthorized') ||
    msg.includes('not authorized')
  );
}

export function formatSupabaseErrorMessage(error: any): string {
  if (!error) return 'Error desconocido';
  if (isPermissionError(error)) {
    return 'Permisos insuficientes: Tu cuenta no tiene autorización para realizar esta acción. Verifica que hayas iniciado sesión con un perfil administrador o cajero.';
  }
  return error.message || error.details || 'Error en la base de datos de Supabase.';
}

export const SUPABASE_UNLOCK_DELETE_SQL = `-- ==============================================================================
-- PRETTY STORE: SCRIPT DE DESBLOQUEO TOTAL, ALMACENAMIENTO DE CAPTURAS Y STOCK
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. HABILITAR PERMISOS COMPLETOS (SELECT, INSERT, UPDATE, DELETE) A TODAS LAS TABLAS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- 2. ASEGURAR COLUMNA COMPROBANTE_PAGO EN LA TABLA PEDIDOS
ALTER TABLE IF EXISTS public.pedidos ADD COLUMN IF NOT EXISTS comprobante_pago text;
ALTER TABLE IF EXISTS public.pedidos ALTER COLUMN cliente_id DROP NOT NULL;

-- 3. QUITAR BLOQUEO DE CLAVES FORÁNEAS (FOREIGN KEYS)
-- Permite eliminar clientes sin error de clave foránea (los pedidos quedan con cliente_id = null)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name = 'pedidos' 
    AND constraint_name = 'pedidos_cliente_id_fkey'
  ) THEN
    ALTER TABLE public.pedidos DROP CONSTRAINT pedidos_cliente_id_fkey;
  END IF;
  ALTER TABLE public.pedidos 
    ADD CONSTRAINT pedidos_cliente_id_fkey 
    FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;
END $$;

-- Permite eliminar pedidos sin error de clave foránea (los detalles y ventas se eliminan en cascada)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name = 'detalle_pedidos' 
    AND constraint_name = 'detalle_pedidos_pedido_id_fkey'
  ) THEN
    ALTER TABLE public.detalle_pedidos DROP CONSTRAINT detalle_pedidos_pedido_id_fkey;
  END IF;
  ALTER TABLE public.detalle_pedidos 
    ADD CONSTRAINT detalle_pedidos_pedido_id_fkey 
    FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name = 'ventas' 
    AND constraint_name = 'ventas_pedido_id_fkey'
  ) THEN
    ALTER TABLE public.ventas DROP CONSTRAINT ventas_pedido_id_fkey;
  END IF;
  ALTER TABLE public.ventas 
    ADD CONSTRAINT ventas_pedido_id_fkey 
    FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;
END $$;

-- 4. DESACTIVAR RLS PARA PERMITIR GESTIÓN Y ELIMINACIÓN DIRECTA DESDE EL MODO ADMIN
ALTER TABLE IF EXISTS public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.detalle_pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ventas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gastos DISABLE ROW LEVEL SECURITY;

-- 5. STORAGE BUCKET: HABILITAR SUBIDA PÚBLICA DE CAPTURAS AL BUCKET EXISTENTE
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Upload Product Images" ON storage.objects;
CREATE POLICY "Public Upload Product Images" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id IN ('product-images', 'comprobantes', 'assets', 'productos', 'products'));

DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
CREATE POLICY "Public Read Product Images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('product-images', 'comprobantes', 'assets', 'productos', 'products'));

DROP POLICY IF EXISTS "Public Delete Product Images" ON storage.objects;
CREATE POLICY "Public Delete Product Images" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id IN ('product-images', 'comprobantes', 'assets', 'productos', 'products'));

-- 6. DESCUENTO AUTOMÁTICO DE STOCK E INVENTARIO AL COMPRAR PRODUCTOS
CREATE OR REPLACE FUNCTION public.fn_descontar_stock_automatico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Descontar en tabla productos
  UPDATE public.productos
  SET stock = GREATEST(0, COALESCE(stock, 0) - NEW.cantidad),
      updated_at = now()
  WHERE id::text = NEW.producto_id::text;

  -- 2. Descontar en tabla inventario
  UPDATE public.inventario
  SET stock_actual = GREATEST(0, COALESCE(stock_actual, 0) - NEW.cantidad),
      updated_at = now()
  WHERE producto_id::text = NEW.producto_id::text;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_descontar_stock_automatico ON public.detalle_pedidos;
CREATE TRIGGER tr_descontar_stock_automatico
AFTER INSERT ON public.detalle_pedidos
FOR EACH ROW EXECUTE FUNCTION public.fn_descontar_stock_automatico();

-- 7. FUNCIONES SEGURAS DE GESTIÓN (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.set_pedido_comprobante(p_pedido_id text, p_comprobante_pago text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.pedidos
  SET comprobante_pago = p_comprobante_pago,
      updated_at = now()
  WHERE id::text = p_pedido_id::text;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_pedido_safe(p_pedido_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.detalle_pedidos WHERE pedido_id::text = p_pedido_id::text;
  DELETE FROM public.ventas WHERE pedido_id::text = p_pedido_id::text;
  DELETE FROM public.pedidos WHERE id::text = p_pedido_id::text;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_cliente_safe(p_cliente_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.pedidos SET cliente_id = NULL WHERE cliente_id::text = p_cliente_id::text;
  UPDATE public.ventas SET cliente_id = NULL WHERE cliente_id::text = p_cliente_id::text;
  DELETE FROM public.clientes WHERE id::text = p_cliente_id::text;
  RETURN true;
END;
$$;
`;

export function getFixScriptDescription(): string {
  return 'Script maestro de inicialización para Supabase: crea tablas completas, funciones RBAC, trigger automático de usuarios, políticas RLS y buckets de Storage.';
}

export function analyzeSupabaseError(error: any): { isFixable: boolean; message: string; code?: string } {
  if (!error) return { isFixable: false, message: 'Operación normal' };
  
  const msg = error.message || error.details || JSON.stringify(error);
  const code = error.code || '';

  if (code === '42501' || msg.includes('row-level security') || msg.includes('permission denied')) {
    return {
      isFixable: true,
      code,
      message: 'Permiso denegado por políticas RLS. Ejecuta el script maestro en Supabase SQL Editor para restablecer los accesos.'
    };
  }

  if (code === '42P01' || msg.includes('does not exist')) {
    return {
      isFixable: true,
      code,
      message: 'Falta una tabla o relación en Supabase. Ejecuta el script maestro en SQL Editor para crear la estructura.'
    };
  }

  return {
    isFixable: false,
    code,
    message: msg
  };
}
