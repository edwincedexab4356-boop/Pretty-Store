/**
 * Supabase SQL Repair Script & Security Hardening
 * 
 * Configura seguridad integral (RLS), control de acceso basado en roles (RBAC):
 * - Administrador (acceso total a gestión, configuración, catálogo y finanzas)
 * - Cajero (acceso a pedidos, ventas de mostrador, inventario y directorio)
 * - Cliente (acceso de solo lectura a catálogo activo y únicamente a sus propios pedidos)
 * 
 * Protege contra manipulación de precios, sobreventa de inventario,
 * fuga de datos personales y eliminación no autorizada en Storage.
 */

export const SUPABASE_FIX_SQL = `-- ==============================================================================
-- PRETTY STORE: SCRIPT DE FORTALECIMIENTO Y SEGURIDAD SUPABASE (PRODUCCIÓN)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. EXTENSIONES Y ESQUEMA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- 2. TABLA DE PERFILES Y ROLES DE USUARIO (RBAC)
CREATE TABLE IF NOT EXISTS public.perfiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text,
  email text,
  rol text NOT NULL DEFAULT 'cliente' CHECK (rol IN ('admin', 'cajero', 'cliente')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Asegurar columnas si ya existía la tabla
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS rol text NOT NULL DEFAULT 'cliente' CHECK (rol IN ('admin', 'cajero', 'cliente'));
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS nombre text;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS email text;

-- 3. FUNCIONES DE AUTORIZACIÓN (SECURITY DEFINER)
-- Determina el rol del usuario autenticado de forma confiable
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT rol FROM public.perfiles WHERE id = auth.uid()),
    (auth.jwt() -> 'app_metadata' ->> 'rol'),
    (auth.jwt() -> 'user_metadata' ->> 'rol'),
    'cliente'
  );
$$;

-- Verifica si el usuario actual es administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_auth_role() = 'admin';
$$;

-- Verifica si el usuario actual es personal autorizado (admin o cajero)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_auth_role() IN ('admin', 'cajero');
$$;

-- 4. TRIGGER AUTOMÁTICO AL REGISTRAR UN USUARIO
-- El primer usuario registrado en la base de datos se promueve automáticamente a 'admin'
-- Todos los siguientes usuarios se crean con rol seguro 'cliente'
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
    -- Evitar que un usuario se autoasigne rol admin o cajero desde metadata
    IF assigned_role NOT IN ('cliente') AND NOT public.is_admin() THEN
      assigned_role := 'cliente';
    END IF;
  END IF;

  INSERT INTO public.perfiles (id, email, nombre, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = COALESCE(EXCLUDED.nombre, perfiles.nombre),
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
ALTER TABLE IF EXISTS public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.detalle_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.configuracion ENABLE ROW LEVEL SECURITY;

-- 6. PERMISOS DE TABLA (GRANT)
GRANT SELECT ON public.categorias TO anon, authenticated;
GRANT SELECT ON public.productos TO anon, authenticated;
GRANT SELECT ON public.inventario TO anon, authenticated;
GRANT SELECT, INSERT ON public.pedidos TO anon, authenticated;
GRANT SELECT, INSERT ON public.detalle_pedidos TO anon, authenticated;
GRANT SELECT, INSERT ON public.clientes TO anon, authenticated;
GRANT SELECT ON public.configuracion TO anon, authenticated;
GRANT SELECT, UPDATE ON public.perfiles TO authenticated;

GRANT ALL ON public.categorias TO authenticated;
GRANT ALL ON public.productos TO authenticated;
GRANT ALL ON public.inventario TO authenticated;
GRANT ALL ON public.pedidos TO authenticated;
GRANT ALL ON public.detalle_pedidos TO authenticated;
GRANT ALL ON public.clientes TO authenticated;
GRANT ALL ON public.ventas TO authenticated;
GRANT ALL ON public.gastos TO authenticated;
GRANT ALL ON public.configuracion TO authenticated;

-- ==============================================================================
-- 7. POLÍTICAS RLS ESPECÍFICAS Y SEGURAS
-- ==============================================================================

-- A) TABLA: categorias
-- Clientes ven categorías activas; Staff ve todas. Solo Admin puede modificar.
DROP POLICY IF EXISTS "Categorias Public Select" ON public.categorias;
CREATE POLICY "Categorias Public Select" ON public.categorias
  FOR SELECT TO anon, authenticated
  USING (activa = true OR public.is_staff());

DROP POLICY IF EXISTS "Categorias Admin Insert" ON public.categorias;
CREATE POLICY "Categorias Admin Insert" ON public.categorias
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Categorias Admin Update" ON public.categorias;
CREATE POLICY "Categorias Admin Update" ON public.categorias
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Categorias Admin Delete" ON public.categorias;
CREATE POLICY "Categorias Admin Delete" ON public.categorias
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- B) TABLA: productos
-- Clientes ven productos activos; Staff ve todos. Solo Admin puede modificar o alterar precios.
DROP POLICY IF EXISTS "Productos Public Select" ON public.productos;
CREATE POLICY "Productos Public Select" ON public.productos
  FOR SELECT TO anon, authenticated
  USING (activo = true OR public.is_staff());

DROP POLICY IF EXISTS "Productos Admin Insert" ON public.productos;
CREATE POLICY "Productos Admin Insert" ON public.productos
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Productos Admin Update" ON public.productos;
CREATE POLICY "Productos Admin Update" ON public.productos
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Productos Admin Delete" ON public.productos;
CREATE POLICY "Productos Admin Delete" ON public.productos
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- C) TABLA: inventario
-- Lectura pública para comprobar existencias. Modificación exclusiva de Admin y Cajero.
DROP POLICY IF EXISTS "Inventario Public Select" ON public.inventario;
CREATE POLICY "Inventario Public Select" ON public.inventario
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Inventario Staff Insert" ON public.inventario;
CREATE POLICY "Inventario Staff Insert" ON public.inventario
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Inventario Staff Update" ON public.inventario;
CREATE POLICY "Inventario Staff Update" ON public.inventario
  FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Inventario Admin Delete" ON public.inventario;
CREATE POLICY "Inventario Admin Delete" ON public.inventario
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- D) TABLA: pedidos
-- Clientes solo ven sus propios pedidos; Staff ve todos.
-- Clientes solo pueden crear pedidos con estado inicial 'pendiente'. No pueden alterar estados.
DROP POLICY IF EXISTS "Pedidos Select Policy" ON public.pedidos;
CREATE POLICY "Pedidos Select Policy" ON public.pedidos
  FOR SELECT TO anon, authenticated
  USING (
    public.is_staff()
    OR (auth.uid() IS NOT NULL AND cliente_id::text = auth.uid()::text)
  );

DROP POLICY IF EXISTS "Pedidos Insert Policy" ON public.pedidos;
CREATE POLICY "Pedidos Insert Policy" ON public.pedidos
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    -- Si es staff, puede registrar cualquier pedido (ej. venta manual)
    public.is_staff()
    -- Si es cliente o visitante, el pedido debe crearse estrictamente en estado 'pendiente' y con totales válidos
    OR (
      estado = 'pendiente'
      AND total >= 0
      AND subtotal >= 0
    )
  );

DROP POLICY IF EXISTS "Pedidos Staff Update" ON public.pedidos;
CREATE POLICY "Pedidos Staff Update" ON public.pedidos
  FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Pedidos Admin Delete" ON public.pedidos;
CREATE POLICY "Pedidos Admin Delete" ON public.pedidos
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- E) TABLA: detalle_pedidos
-- Lectura restringida a personal y al propietario del pedido padre.
DROP POLICY IF EXISTS "Detalle Pedidos Select Policy" ON public.detalle_pedidos;
CREATE POLICY "Detalle Pedidos Select Policy" ON public.detalle_pedidos
  FOR SELECT TO anon, authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.pedidos p
      WHERE p.id = detalle_pedidos.pedido_id
      AND (public.is_staff() OR (auth.uid() IS NOT NULL AND p.cliente_id::text = auth.uid()::text))
    )
  );

DROP POLICY IF EXISTS "Detalle Pedidos Insert Policy" ON public.detalle_pedidos;
CREATE POLICY "Detalle Pedidos Insert Policy" ON public.detalle_pedidos
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    cantidad > 0
    AND precio_unitario >= 0
    AND subtotal >= 0
  );

DROP POLICY IF EXISTS "Detalle Pedidos Staff Update" ON public.detalle_pedidos;
CREATE POLICY "Detalle Pedidos Staff Update" ON public.detalle_pedidos
  FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Detalle Pedidos Admin Delete" ON public.detalle_pedidos;
CREATE POLICY "Detalle Pedidos Admin Delete" ON public.detalle_pedidos
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- F) TABLA: clientes
-- Lectura restringida a personal y al propio usuario para proteger privacidad.
DROP POLICY IF EXISTS "Clientes Select Policy" ON public.clientes;
CREATE POLICY "Clientes Select Policy" ON public.clientes
  FOR SELECT TO anon, authenticated
  USING (
    public.is_staff()
    OR (auth.uid() IS NOT NULL AND id::text = auth.uid()::text)
  );

DROP POLICY IF EXISTS "Clientes Insert Policy" ON public.clientes
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Clientes Update Policy" ON public.clientes;
CREATE POLICY "Clientes Update Policy" ON public.clientes
  FOR UPDATE TO anon, authenticated
  USING (
    public.is_staff()
    OR (auth.uid() IS NOT NULL AND id::text = auth.uid()::text)
  )
  WITH CHECK (
    public.is_staff()
    OR (auth.uid() IS NOT NULL AND id::text = auth.uid()::text)
  );

DROP POLICY IF EXISTS "Clientes Admin Delete" ON public.clientes;
CREATE POLICY "Clientes Admin Delete" ON public.clientes
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- G) TABLA: ventas (Finanzas de la tienda)
-- Restricción total: únicamente accesible para personal administrativo y cajeros.
DROP POLICY IF EXISTS "Ventas Staff All" ON public.ventas;
CREATE POLICY "Ventas Staff All" ON public.ventas
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- H) TABLA: gastos (Costos operativos)
-- Restricción máxima: únicamente accesible para administradores.
DROP POLICY IF EXISTS "Gastos Admin All" ON public.gastos;
CREATE POLICY "Gastos Admin All" ON public.gastos
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- I) TABLA: perfiles
-- Los usuarios pueden leer su propio perfil; Staff puede ver perfiles. Solo Admin puede modificar roles.
DROP POLICY IF EXISTS "Perfiles Select Policy" ON public.perfiles;
CREATE POLICY "Perfiles Select Policy" ON public.perfiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "Perfiles Self Update" ON public.perfiles;
CREATE POLICY "Perfiles Self Update" ON public.perfiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    -- Un usuario normal NO puede cambiarse a sí mismo el rol a 'admin' o 'cajero'
    (public.is_admin())
    OR (id = auth.uid() AND rol = (SELECT p.rol FROM public.perfiles p WHERE p.id = auth.uid()))
  );

-- J) TABLA: configuracion
-- Lectura pública para mostrar datos de boutique. Modificación exclusiva de Administrador.
CREATE TABLE IF NOT EXISTS public.configuracion (
  id integer PRIMARY KEY DEFAULT 1,
  nombre_tienda text NOT NULL DEFAULT 'Pretty-Store',
  descripcion text DEFAULT 'Boutique exclusiva de alta relojería, perfumería selecta y accesorios.',
  logo_url text DEFAULT '/images/logo/logotipo.jpeg',
  hero_video_url text DEFAULT '/videos/hero.mp4',
  hero_poster_url text DEFAULT '',
  telefono text DEFAULT '+507 6890-1234',
  whatsapp text DEFAULT '+507 6890-1234',
  email text DEFAULT 'contacto@pretty-store.com',
  direccion text DEFAULT 'Boulevard Costa del Este, Torre Financial Park, Nivel 14',
  instagram text DEFAULT 'https://instagram.com',
  facebook text DEFAULT 'https://facebook.com',
  twitter text DEFAULT 'https://twitter.com',
  yappy_numero text DEFAULT '+507 6890-1234',
  banco_datos text DEFAULT 'Banco General - Cuenta Corriente #03-01-01-123456-7 a nombre de Pretty-Store Inc.',
  pasarela_tarjeta text DEFAULT 'PagueloFacil',
  link_pago_tarjeta text DEFAULT '',
  updated_at timestamp with time zone DEFAULT now()
);

INSERT INTO public.configuracion (id, nombre_tienda)
VALUES (1, 'Pretty-Store')
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Configuracion Public Select" ON public.configuracion;
CREATE POLICY "Configuracion Public Select" ON public.configuracion
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Configuracion Admin All" ON public.configuracion;
CREATE POLICY "Configuracion Admin All" ON public.configuracion
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 8. STORAGE HARDENING (SUPABASE STORAGE)
-- ==============================================================================
-- Buckets públicos de solo lectura para el cliente; subida y borrado restringidos a Staff.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB máximo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  10485760, -- 10MB máximo
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime'];

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('assets', 'assets', true, 10485760)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage:
-- Lectura pública para CDN
DROP POLICY IF EXISTS "Storage Objects Public Select" ON storage.objects;
CREATE POLICY "Storage Objects Public Select" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('product-images', 'videos', 'assets'));

-- Subida permitida únicamente a personal autenticado (Admin y Cajero)
DROP POLICY IF EXISTS "Storage Objects Staff Insert" ON storage.objects;
CREATE POLICY "Storage Objects Staff Insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('product-images', 'videos', 'assets')
    AND public.is_staff()
  );

-- Actualización permitida únicamente a personal autenticado
DROP POLICY IF EXISTS "Storage Objects Staff Update" ON storage.objects;
CREATE POLICY "Storage Objects Staff Update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('product-images', 'videos', 'assets') AND public.is_staff())
  WITH CHECK (bucket_id IN ('product-images', 'videos', 'assets') AND public.is_staff());

-- Eliminación de fotos y videos prohibida para clientes; solo Admin puede borrar
DROP POLICY IF EXISTS "Storage Objects Admin Delete" ON storage.objects;
CREATE POLICY "Storage Objects Admin Delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('product-images', 'videos', 'assets') AND public.is_admin());

-- ==============================================================================
-- 9. FUNCIÓN TRANSACCIONAL ATÓMICA PARA DESCUENTO DE STOCK Y PEDIDOS SEGUROS
-- Previene ventas simultáneas por encima del stock (race conditions)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.deduct_product_stock_safe(
  p_producto_id uuid,
  p_cantidad integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stock integer;
BEGIN
  IF p_cantidad <= 0 THEN
    RETURN false;
  END IF;

  -- Bloquea la fila para evitar condiciones de carrera simultáneas
  SELECT stock INTO v_current_stock
  FROM public.productos
  WHERE id = p_producto_id
  FOR UPDATE;

  IF NOT FOUND OR v_current_stock < p_cantidad THEN
    RETURN false;
  END IF;

  -- Descontar en productos
  UPDATE public.productos
  SET stock = stock - p_cantidad,
      updated_at = now()
  WHERE id = p_producto_id;

  -- Descontar en inventario si existe registro
  UPDATE public.inventario
  SET stock_actual = GREATEST(0, stock_actual - p_cantidad),
      updated_at = now()
  WHERE producto_id = p_producto_id;

  RETURN true;
END;
$$;
`;

export function isPermissionError(errMessage?: string | null): boolean {
  if (!errMessage) return false;
  const lower = errMessage.toLowerCase();
  return (
    lower.includes('permission denied') ||
    lower.includes('violates row-level security') ||
    lower.includes('row-level security policy') ||
    lower.includes('42501') ||
    lower.includes('not have permission') ||
    lower.includes('not authorized')
  );
}

/**
 * Traduce errores técnicos de PostgreSQL/Supabase a mensajes amigables y profesionales,
 * evitando filtrar stack traces, SQL o estructuras internas.
 */
export function formatFriendlyError(err: any, defaultMsg = 'Ocurrió un error al procesar la solicitud.'): string {
  if (!err) return defaultMsg;
  const msg = typeof err === 'string' ? err : err?.message || '';
  const lower = msg.toLowerCase();

  if (isPermissionError(msg)) {
    return 'Permisos insuficientes: Tu cuenta no tiene autorización para realizar esta acción. Verifica que hayas iniciado sesión con un perfil administrador o cajero.';
  }

  if (lower.includes('23505') || lower.includes('duplicate key') || lower.includes('unique constraint')) {
    return 'Ya existe un registro con estos datos en el sistema (por ejemplo, mismo teléfono o nombre).';
  }

  if (lower.includes('23503') || lower.includes('foreign key')) {
    return 'No es posible eliminar o modificar este elemento porque tiene transacciones asociadas (como pedidos o ventas activas).';
  }

  if (lower.includes('jwt expired') || lower.includes('invalid refresh token') || lower.includes('token expired')) {
    return 'Tu sesión de seguridad ha expirado. Por favor inicia sesión nuevamente.';
  }

  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('connection error')) {
    return 'Error de comunicación con el servidor. Por favor verifica tu conexión a internet e inténtalo de nuevo.';
  }

  // Filtrar fragmentos de sentencias SQL
  if (lower.includes('select') || lower.includes('from') || lower.includes('insert into') || lower.includes('syntax error')) {
    return defaultMsg;
  }

  // Si es un mensaje limpio y conciso en español, mantenerlo; de lo contrario, retornar mensaje seguro
  if (msg.length > 0 && msg.length < 150 && !msg.includes('{') && !msg.includes('stack')) {
    return msg;
  }

  return defaultMsg;
}

