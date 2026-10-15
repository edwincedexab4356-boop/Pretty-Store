-- ==============================================================================
-- PRETTY STORE - SUPABASE DATABASE CONFIGURATION SCRIPT
-- Ejecuta este script completo en tu panel de Supabase:
-- 1. Ve a tu panel de Supabase: https://supabase.com/dashboard
-- 2. Entra a tu proyecto (jlxlbdyerlphrcjxhros)
-- 3. Abre el menú "SQL Editor" en la barra lateral izquierda
-- 4. Crea una "New Query", pega este código completo y presiona "Run"
-- ==============================================================================

-- 1. Asegurar columnas necesarias en la tabla 'pedidos'
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS cliente_nombre TEXT;
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS cliente_telefono TEXT;
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS cliente_email TEXT;
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS metodo_pago TEXT DEFAULT 'transferencia';
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'confirmado';
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS tipo_entrega TEXT DEFAULT 'retiro';
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS courier TEXT;
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS descuento NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS envio NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS comprobante_pago TEXT;
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS factura_oficial TEXT;
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS pedidos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Asegurar columnas necesarias en la tabla 'productos'
ALTER TABLE IF EXISTS productos ADD COLUMN IF NOT EXISTS costo NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS productos ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 10;
ALTER TABLE IF EXISTS productos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS productos ADD COLUMN IF NOT EXISTS imagenes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS productos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Habilitar Row Level Security (RLS) y permitir operaciones para la tienda y administración
ALTER TABLE IF EXISTS categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS configuracion ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores para evitar duplicados
DROP POLICY IF EXISTS "Public full access on categorias" ON categorias;
DROP POLICY IF EXISTS "Public full access on productos" ON productos;
DROP POLICY IF EXISTS "Public full access on clientes" ON clientes;
DROP POLICY IF EXISTS "Public full access on pedidos" ON pedidos;
DROP POLICY IF EXISTS "Public full access on configuracion" ON configuracion;

-- Políticas universales para permitir lectura y escritura desde la tienda y el panel de administración
CREATE POLICY "Public full access on categorias" ON categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on productos" ON productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on pedidos" ON pedidos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on configuracion" ON configuracion FOR ALL USING (true) WITH CHECK (true);

-- 4. Crear buckets de almacenamiento público para fotos de productos y comprobantes de pago
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de almacenamiento para permitir subir y ver comprobantes e imágenes
DROP POLICY IF EXISTS "Public Access Comprobantes" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Product Images" ON storage.objects;

CREATE POLICY "Public Access Comprobantes" ON storage.objects
FOR ALL USING (bucket_id IN ('comprobantes', 'product-images'))
WITH CHECK (bucket_id IN ('comprobantes', 'product-images'));
