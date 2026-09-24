/**
 * Supabase SQL Repair Script & Permission Helpers
 * 
 * Soluciona el error PostgreSQL 42501: "permission denied for table ...",
 * otorgando permisos de esquema (GRANT) y configurando políticas RLS
 * para lectura pública y administración.
 */

export const SUPABASE_FIX_SQL = `-- ==========================================================
-- SCRIPT DE REPARACIÓN DE PERMISOS SUPABASE (Error 42501)
-- Copia este script completo y pégalo en:
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==========================================================

-- 1. CONCEDER PERMISOS BÁSICOS DE ESQUEMA A LOS ROLES DE SUPABASE
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Privilegios automáticos para tablas y secuencias futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 2. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
ALTER TABLE IF EXISTS public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.detalle_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gastos ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS PARA: categorias
-- Permite ver categorías activas en la tienda y gestionar todo en el Admin
DROP POLICY IF EXISTS "Categorias Public Select" ON public.categorias;
CREATE POLICY "Categorias Public Select" ON public.categorias 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Categorias Admin Insert" ON public.categorias;
CREATE POLICY "Categorias Admin Insert" ON public.categorias 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Categorias Admin Update" ON public.categorias;
CREATE POLICY "Categorias Admin Update" ON public.categorias 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Categorias Admin Delete" ON public.categorias;
CREATE POLICY "Categorias Admin Delete" ON public.categorias 
  FOR DELETE TO anon, authenticated USING (true);

-- 4. POLÍTICAS PARA: productos
-- Permite ver productos en la tienda y crearlos/editarlos en el Admin
DROP POLICY IF EXISTS "Productos Public Select" ON public.productos;
CREATE POLICY "Productos Public Select" ON public.productos 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Productos Admin Insert" ON public.productos;
CREATE POLICY "Productos Admin Insert" ON public.productos 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Productos Admin Update" ON public.productos;
CREATE POLICY "Productos Admin Update" ON public.productos 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Productos Admin Delete" ON public.productos;
CREATE POLICY "Productos Admin Delete" ON public.productos 
  FOR DELETE TO anon, authenticated USING (true);

-- 5. POLÍTICAS PARA: inventario
-- Permite consultar existencias y actualizarlas desde Admin y checkout
DROP POLICY IF EXISTS "Inventario Public Select" ON public.inventario;
CREATE POLICY "Inventario Public Select" ON public.inventario 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Inventario Admin Insert" ON public.inventario;
CREATE POLICY "Inventario Admin Insert" ON public.inventario 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Inventario Admin Update" ON public.inventario;
CREATE POLICY "Inventario Admin Update" ON public.inventario 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Inventario Admin Delete" ON public.inventario;
CREATE POLICY "Inventario Admin Delete" ON public.inventario 
  FOR DELETE TO anon, authenticated USING (true);

-- 6. POLÍTICAS PARA: pedidos
-- Permite a clientes crear pedidos y al Admin consultarlos y cambiar estados
DROP POLICY IF EXISTS "Pedidos Public Select" ON public.pedidos;
CREATE POLICY "Pedidos Public Select" ON public.pedidos 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Pedidos Public Insert" ON public.pedidos;
CREATE POLICY "Pedidos Public Insert" ON public.pedidos 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Pedidos Admin Update" ON public.pedidos;
CREATE POLICY "Pedidos Admin Update" ON public.pedidos 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Pedidos Admin Delete" ON public.pedidos;
CREATE POLICY "Pedidos Admin Delete" ON public.pedidos 
  FOR DELETE TO anon, authenticated USING (true);

-- 7. POLÍTICAS PARA: detalle_pedidos
-- Permite registrar líneas del carrito en la compra y leerlas en el Admin
DROP POLICY IF EXISTS "Detalle Pedidos Public Select" ON public.detalle_pedidos;
CREATE POLICY "Detalle Pedidos Public Select" ON public.detalle_pedidos 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Detalle Pedidos Public Insert" ON public.detalle_pedidos;
CREATE POLICY "Detalle Pedidos Public Insert" ON public.detalle_pedidos 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Detalle Pedidos Admin Update" ON public.detalle_pedidos;
CREATE POLICY "Detalle Pedidos Admin Update" ON public.detalle_pedidos 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 8. POLÍTICAS PARA: clientes
-- Permite registrar clientes en checkout y consultarlos en el directorio
DROP POLICY IF EXISTS "Clientes Public Select" ON public.clientes;
CREATE POLICY "Clientes Public Select" ON public.clientes 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Clientes Public Insert" ON public.clientes;
CREATE POLICY "Clientes Public Insert" ON public.clientes 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Clientes Admin Update" ON public.clientes;
CREATE POLICY "Clientes Admin Update" ON public.clientes 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 9. TABLA DE CONFIGURACIÓN (Si no existe, se crea para guardar video y datos)
CREATE TABLE IF NOT EXISTS public.configuracion (
  id integer PRIMARY KEY DEFAULT 1,
  nombre_tienda text NOT NULL DEFAULT 'Luxury Store',
  descripcion text DEFAULT 'Exclusividad y elegancia en cada detalle',
  logo_url text DEFAULT '/images/logo/logotipo.jpeg',
  hero_video_url text DEFAULT '/videos/WhatsApp Video 2026-09-23 at 23.53.18.mp4',
  telefono text DEFAULT '+507 6890-1234',
  whatsapp text DEFAULT '+507 6890-1234',
  email text DEFAULT 'contacto@aura.com',
  direccion text DEFAULT 'Boulevard Costa del Este, Torre Financial Park, Nivel 14',
  instagram text DEFAULT 'https://instagram.com',
  facebook text DEFAULT 'https://facebook.com',
  twitter text DEFAULT 'https://twitter.com',
  updated_at timestamp with time zone DEFAULT now()
);

-- Asegurar registro inicial de configuración
INSERT INTO public.configuracion (id, nombre_tienda) 
VALUES (1, 'AURA')
ON CONFLICT (id) DO NOTHING;

GRANT ALL ON TABLE public.configuracion TO postgres, anon, authenticated, service_role;

DROP POLICY IF EXISTS "Configuracion Public Select" ON public.configuracion;
CREATE POLICY "Configuracion Public Select" ON public.configuracion 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Configuracion Admin All" ON public.configuracion;
CREATE POLICY "Configuracion Admin All" ON public.configuracion 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
`;

export function isPermissionError(errMessage?: string | null): boolean {
  if (!errMessage) return false;
  const lower = errMessage.toLowerCase();
  return (
    lower.includes('permission denied') ||
    lower.includes('violates row-level security') ||
    lower.includes('row-level security policy') ||
    lower.includes('42501') ||
    lower.includes('not have permission')
  );
}
