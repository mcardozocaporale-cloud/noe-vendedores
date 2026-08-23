-- Neo Mercado - SQL Setup para Supabase
-- Copia y pega esto en SQL Editor de Supabase

-- Tabla de Vendedores
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  empresa TEXT,
  telefono TEXT,
  direccion TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Productos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  precio_unitario DECIMAL(10,2),
  precio_bulto DECIMAL(10,2),
  factor_bulto INT DEFAULT 1,
  precio_min DECIMAL(10,2),
  precio_max DECIMAL(10,2),
  stock INT DEFAULT 0,
  imagen_base64 TEXT,
  permite_ajuste_precio BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Órdenes
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  numero_orden TEXT UNIQUE,
  estado TEXT DEFAULT 'pendiente', -- pendiente, aprobada, entregada, cancelada
  total DECIMAL(10,2),
  datos_comprador JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Items de Órdenes
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  cantidad INT,
  precio_unitario DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crear vendor de prueba
-- Password: admin123456 (hash: $2a$10$...)
INSERT INTO vendors (email, password_hash, nombre, empresa, telefono, direccion)
VALUES ('admin@neomercado.com', '$2a$10$0qjfKyXnDSxKcNqQFgAILeaMiXFXKqTjT7OyqjwKB3Jz7OdFKfKuq', 'Admin Neo', 'Neo Mercado S.A.', '5492494219951', 'Tandil, Buenos Aires')
ON CONFLICT (email) DO NOTHING;

-- Insertar productos de prueba (del catálogo actual)
INSERT INTO products (nombre, descripcion, categoria, precio_unitario, precio_bulto, factor_bulto, precio_min, precio_max, stock, permite_ajuste_precio)
VALUES
-- Harinas
('Harina PUREZA 0000 kilo', 'Harina de trigo 0000 ultra refinada, bolsa 1kg', 'Harinas', 1250, 1089, 10, 1100, 1300, 50, FALSE),
('Harina PUREZA leudante kilo', 'Harina leudante ultra refinada para repostería casera, bolsa 1kg', 'Harinas', 1665, 1525, 10, 1500, 1700, 30, FALSE),
('Harina PUREZA pizza kilo', 'Harina especial para pizzas caseras, con levadura, bolsa 1kg', 'Harinas', 1915, 1755, 10, 1700, 2000, 25, FALSE),

-- Fideos
('Fideos SOL PAMPEANO 500g', 'Tallarín o Spaghetti, fideos secos', 'Fideos', 910, 790, 20, 750, 950, 60, FALSE),
('Fideos SOL PAMPEANO moños 500g', 'Moños, fideos secos', 'Fideos', 1325, 1150, 15, 1100, 1400, 40, FALSE),

-- Arroces
('Arroz GALLO l/f 500g', 'Arroz largo fino Gallo, todo uso', 'Arroces', 1145, 1049, 10, 1000, 1200, 45, FALSE),
('Arroz GALLO oro 500g', 'Arroz Gallo Oro Selección, premium', 'Arroces', 999, 915, 10, 900, 1050, 35, FALSE),

-- Salsas
('Puré de tomate OKEY 520g', 'Puré de tomate clásico', 'Salsas', 715, 655, 24, 600, 750, 80, FALSE),
('Puré de tomate MOLTO 520g', 'Libre de gluten, elaborado con kilos de tomate fresco', 'Salsas', 959, 879, 24, 850, 1000, 55, FALSE),

-- Aceites
('Aceite OKEY mezcla 900cc', 'Aceite mezcla', 'Aceites', 2519, 2229, 12, 2100, 2600, 30, TRUE),
('Aceite PAISANO girasol 900cc', 'Aceite de girasol', 'Aceites', 2685, 2499, 12, 2500, 2800, 25, TRUE),

-- Galletitas
('PROVIDENCIA tripack', 'Galletitas dulces, pack x3', 'Galletitas', 1390, 1269, 16, 1200, 1450, 70, FALSE),
('MEDIATARDE tripack', 'Galletitas clásicas, oferta pack x3', 'Galletitas', 1625, 1489, 14, 1400, 1700, 60, FALSE);

-- Índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(categoria);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
