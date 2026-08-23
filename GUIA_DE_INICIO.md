# 🚀 GUÍA DE INICIO - Neo Mercado Vendedores

## ¿Qué es esto?

Un **panel de vendedores** integrado en el catálogo Neo Mercado. Los vendedores pueden:
- ✅ Loguearse con usuario/contraseña
- ✅ Ver el catálogo de productos
- ✅ Ajustar algunos precios (dentro de un rango)
- ✅ Armar un carrito de compra
- ✅ Confirmar pedidos → se guardan en una BD
- ✅ Ver un remito provisional (imprimir/descargar)
- ✅ Ver historial de pedidos anteriores

## 📋 5 PASOS para deployar

### PASO 1: Crear cuenta en Supabase (GRATIS, 2 min)

1. Abre https://supabase.com
2. Haz clic en **"Start your project"**
3. Crea una cuenta (email + password cualquiera)
4. Crea un proyecto nuevo:
   - **Nombre**: `neo-mercado`
   - **Región**: South America - São Paulo (más cerca)
   - **Password**: cualquiera (para acceso a BD)
5. Espera a que se cree (~3 minutos)

### PASO 2: Crear las tablas en Supabase (2 min)

1. En tu proyecto Supabase, busca **SQL Editor** en el menú izquierdo
2. Haz clic en **New Query**
3. Abre el archivo `supabase.sql` en tu carpeta neo-vendedores
4. Copia TODO el contenido
5. Pega en el editor de Supabase
6. Haz clic en **Run** (triángulo azul arriba a la derecha)
7. ✅ Listo, tablas creadas

### PASO 3: Obtener credenciales de Supabase (2 min)

1. En tu proyecto Supabase, ve a **Settings** (engranaje abajo a la izquierda)
2. Click en **API**
3. Verás algo como:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIs...
   service_role key: eyJhbGciOiJIUzI1NiIs...
   ```
4. Copia estas 3 cosas y péga en el archivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
NEXT_PUBLIC_WHATSAPP_VENDOR=5492494219951
```

**⚠️ IMPORTANTE**: 
- El archivo `.env.local` **NO se sube a GitHub** (está en .gitignore)
- Vercel necesita que agregues estas variables en sus settings (paso 5)

### PASO 4: Subir a GitHub (3 min)

1. Abre terminal en la carpeta `neo-vendedores`
2. Ejecuta:

```bash
git init
git add .
git commit -m "Initial commit: Panel vendedores Neo"
```

3. Crea un repo en GitHub.com (gratis):
   - Entra a github.com/new
   - Nombre: `neo-vendedores`
   - Descripción: "Panel de vendedores Neo Mercado"
   - ✅ Create repository

4. Copia los comandos que te da GitHub y ejecuta en tu terminal:

```bash
git remote add origin https://github.com/TU_USUARIO/neo-vendedores.git
git branch -M main
git push -u origin main
```

### PASO 5: Deploy en Vercel (3 min)

1. Abre https://vercel.com
2. Haz login con GitHub
3. Haz clic en **Add New Project**
4. Selecciona tu repo `neo-vendedores`
5. Configura variables de entorno:
   - **NEXT_PUBLIC_SUPABASE_URL**: [pega de Supabase]
   - **NEXT_PUBLIC_SUPABASE_ANON_KEY**: [pega de Supabase]
   - **SUPABASE_SERVICE_ROLE_KEY**: [pega de Supabase]
   - **NEXT_PUBLIC_WHATSAPP_VENDOR**: `5492494219951`
6. Haz clic en **Deploy**
7. ✅ En 2-3 minutos estará en vivo en: `https://neo-vendedores.vercel.app`

---

## 🧪 Prueba en LOCAL (si quieres probar antes de deployar)

```bash
# 1. Abre terminal en la carpeta neo-vendedores
cd C:\Users\Usuario\Desktop\neo-vendedores

# 2. Instala Node.js si no lo tienes
# Descarga de https://nodejs.org (versión LTS)

# 3. Instala dependencias
npm install

# 4. Ejecuta el servidor
npm run dev

# 5. Abre http://localhost:3000 en el navegador
```

---

## 🔑 Credenciales de prueba

### Catálogo público
- URL: `/` (igual que ahora en Vercel)

### Panel de vendedor
- URL: `/vendedor/login`
- Email: `admin@neomercado.com`
- Password: `admin123456`

---

## 📁 Estructura del proyecto

```
neo-vendedores/
├── app/
│   ├── page.tsx              ← Catálogo público
│   ├── layout.tsx            ← Layout principal
│   └── vendedor/
│       ├── login/page.tsx    ← Login vendedor
│       ├── dashboard/page.tsx ← Dashboard (historial)
│       ├── catalogo/page.tsx ← Catálogo vendedor
│       ├── carrito/page.tsx  ← Carrito + confirmar
│       └── orden/[id]/page.tsx ← Remito provisional
├── lib/
│   ├── supabase.ts           ← Config Supabase
│   └── auth.ts               ← Funciones de auth
├── package.json
├── .env.local                ← Variables secretas (NO subir!)
├── supabase.sql              ← Script de tablas
└── README.md
```

---

## 🎯 Próximos pasos (después de que funcione)

1. **Agregar imágenes**: En Supabase, subir imágenes base64 de productos
2. **Sincronizar con Nuvix**: Actualizar stock y precios automáticamente
3. **Admin dashboard**: Panel para ver/aprobar pedidos
4. **Notificaciones**: Emails cuando hay nuevos pedidos
5. **Descuentos**: Sistema de descuentos por volumen

---

## ❓ Preguntas frecuentes

**P: ¿Por qué Supabase?**
R: Es gratis, seguro, y maneja BD + autenticación. Perfecto para MVP.

**P: ¿Puedo usar la BD actual?**
R: Sí, pero necesitarías cambiar la configuración en `lib/supabase.ts`.

**P: ¿Qué pasa con el catálogo público actual?**
R: Sigue exactamente igual en `/`. Solo vendedores acceden a `/vendedor/*`.

**P: ¿Los clientes pueden ver el panel vendedor?**
R: No, solo si tienen login. El catálogo público es para todos.

---

## 🆘 Si algo falla

1. **"Error de conexión a Supabase"**
   - Revisa que `.env.local` tenga las 3 keys correctas
   - Verifica URLs y keys en Supabase → Settings → API

2. **"Módulos no encontrados"**
   - Ejecuta: `npm install`

3. **"Deploy en Vercel falla"**
   - Chequea que agregaste las env vars en Vercel → Settings → Environment Variables

---

**¡Listo! Ahora tienes un panel de vendedores profesional.** 🎉

Para dudas: mcardozocaporale@gmail.com
