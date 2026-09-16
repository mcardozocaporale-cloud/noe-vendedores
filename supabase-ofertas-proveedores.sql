-- Ofertas de proveedores: el dueño sube la foto o el texto de una oferta que le llegó
-- por WhatsApp y el sistema la deja procesada acá, con los productos/precios detectados.
-- Correr una sola vez en el SQL Editor de Supabase.

CREATE TABLE IF NOT EXISTS ofertas_proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  proveedor TEXT,
  fuente TEXT NOT NULL,                        -- 'foto' | 'texto'
  imagen_base64 TEXT,
  texto_original TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  estado TEXT NOT NULL DEFAULT 'procesando',    -- 'procesando' | 'lista' | 'error'
  error_mensaje TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ofertas_proveedores_vendor ON ofertas_proveedores(vendor_id);
