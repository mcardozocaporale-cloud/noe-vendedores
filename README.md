# Neo Mercado - Panel de Vendedores

MVP de catálogo interactivo + panel de vendedores con autenticación y gestión de pedidos.

## 🚀 Características

- ✅ Catálogo público (igual al actual en Vercel)
- ✅ Login de vendedores (usuario/contraseña)
- ✅ Panel de vendedor con dashboard
- ✅ Catálogo para vendedores con precios ajustables
- ✅ Carrito interactivo
- ✅ Confirmación de pedidos → BD
- ✅ Remito provisional (imprimir/descargar)
- ✅ Historial de pedidos

## 🛠️ Stack Técnico

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **BD + Auth**: Supabase (PostgreSQL)
- **Hosting**: Vercel

## 📋 Setup (Guía paso a paso)

### 1. Crear cuenta Supabase (GRATIS)

1. Ve a https://supabase.com
2. Haz clic en "Start your project"
3. Crea una cuenta (email/password)
4. Crea un nuevo proyecto (nombre: `neo-mercado`, región: South America - São Paulo)
5. Espera ~3 minutos a que se inicialize

### 2. Crear tablas en Supabase

1. En tu proyecto Supabase, ve a **SQL Editor**
2. Haz clic en **New Query**
3. Copia y pega el contenido del archivo `supabase.sql` (ver más abajo)
4. Haz clic en **Run**

### 3. Obtener credenciales

1. Ve a **Settings** → **API**
2. Copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

3. Pega en `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_WHATSAPP_VENDOR=5492494219951
```

### 4. Instalar dependencias

```bash
npm install
```

### 5. Ejecutar localmente

```bash
npm run dev
```

Abre http://localhost:3000

### 6. Datos de prueba

**Login vendedor:**
- Email: `admin@neomercado.com`
- Password: `admin123456`

### 7. Deploy en Vercel

```bash
# 1. Inicia repo Git
git init
git add .
git commit -m "Initial commit"

# 2. Sube a GitHub (crea repo en github.com)
git remote add origin https://github.com/tu-user/neo-vendedores.git
git branch -M main
git push -u origin main

# 3. Ve a vercel.com → Import Project
# Selecciona tu repo, agrega las env vars, y ¡deploy!
```

---

## 📊 Estructura Supabase

```sql
-- Vendedores
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  empresa TEXT,
  telefono TEXT,
  direccion TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Productos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  precio_unitario DECIMAL(10,2),
  precio_bulto DECIMAL(10,2),
  factor_bulto INT,
  precio_min DECIMAL(10,2),
  precio_max DECIMAL(10,2),
  stock INT,
  imagen_base64 TEXT,
  permite_ajuste_precio BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Órdenes
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  numero_orden TEXT UNIQUE,
  estado TEXT DEFAULT 'pendiente',
  total DECIMAL(10,2),
  datos_comprador JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Items de Órdenes
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  cantidad INT,
  precio_unitario DECIMAL(10,2),
  subtotal DECIMAL(10,2)
);
```

---

## 🔧 Próximos pasos (Fase 2)

- [ ] Integración con Nuvix (sincronizar stock + precios)
- [ ] Dashboard de admin
- [ ] Reportes de ventas
- [ ] Sistema de descuentos
- [ ] Notificaciones por email

---

## 📞 Contacto

Para dudas o issues, escribe a: mcardozocaporale@gmail.com

---

**Hecho con ❤️ por Claude**
