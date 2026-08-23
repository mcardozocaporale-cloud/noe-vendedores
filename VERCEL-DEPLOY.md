# 🚀 GUÍA COMPLETA: Deployar Neo Vendedores en Vercel

## 🎯 OBJETIVO
Tu proyecto Next.js estará **en vivo en internet** en una URL pública como:
```
https://neo-vendedores.vercel.app
```

## ⏱️ TIEMPO TOTAL
- Supabase: 5 minutos
- GitHub: 3 minutos
- Vercel: 2 minutos
- **TOTAL: 10 minutos**

---

## PASO 1: Crear y Configurar Supabase (5 min)

### 1.1 Crear cuenta

1. Abre **https://supabase.com**
2. Haz clic en **"Start your project"** (arriba a la derecha)
3. Selecciona **"Create a new account"**
4. Elige cualquier opción:
   - Email + contraseña
   - GitHub
   - Google
5. Verifica tu email (si elegiste email)

### 1.2 Crear proyecto

1. Haz clic en **"Create new project"** (o similar)
2. Llena el formulario:
   - **Organization name**: `Neo Mercado` (o lo que quieras)
   - **Project name**: `neo-mercado`
   - **Database password**: `TuPassword123!` (cualquiera, pero guárdalo)
   - **Region**: **South America - São Paulo** (más cerca de Argentina)
3. Haz clic en **Create project**
4. ⏳ **Espera 3-5 minutos** a que se inicialice (aparecerá un loading)

### 1.3 Ejecutar SQL (crear tablas + productos)

Una vez que el proyecto esté listo:

1. En el menú izquierdo, busca **"SQL Editor"**
2. Haz clic en **"New Query"**
3. **Abre el archivo** `supabase-productos-reales.sql` en tu carpeta neo-vendedores
4. **Copia TODO el contenido**
5. **Pega en el editor** de Supabase
6. Haz clic en el botón **"Run"** (triángulo azul arriba a la derecha)
7. ✅ Verás un mensaje: "1 queries executed"

### 1.4 Obtener credenciales

1. En Supabase, ve al menú → **Settings** (engranaje abajo a la izquierda)
2. Haz clic en **"API"**
3. Verás algo como esto:

```
Project URL:
https://xyzabc123.supabase.co

anon public key (NEXT_PUBLIC_SUPABASE_ANON_KEY):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsIm...

service_role key (SUPABASE_SERVICE_ROLE_KEY):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsIm...
```

4. **Copia y guarda estas 3 cosas** en un bloc de notas (las necesitarás ya)

---

## PASO 2: Actualizar .env.local (1 min)

1. En tu carpeta `neo-vendedores`, abre el archivo `.env.local`
2. Reemplaza los valores con los que copiaste de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_WHATSAPP_VENDOR=5492494219951
```

3. **Guarda el archivo** (Ctrl+S)

---

## PASO 3: Subir a GitHub (3 min)

### 3.1 Crear repo en GitHub

1. Abre **https://github.com/new**
2. Llena los datos:
   - **Repository name**: `neo-vendedores`
   - **Description**: `Panel de vendedores Neo Mercado`
   - **Public** (para que puedas verlo después)
3. Haz clic en **"Create repository"**

### 3.2 Subir código

1. Abre **PowerShell** en tu carpeta neo-vendedores:
   - Click derecho en la carpeta → "Open PowerShell here"
   
2. Ejecuta estos comandos (uno por uno):

```powershell
git init
git add .
git commit -m "Initial commit: Neo Vendedores MVP"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/neo-vendedores.git
git push -u origin main
```

**⚠️ IMPORTANTE**: 
- Reemplaza `TU_USUARIO` con tu usuario de GitHub
- Si pide contraseña, usa un **Personal Access Token** (https://github.com/settings/tokens)

3. Verifica en GitHub que los archivos están subidos

---

## PASO 4: Deployar en Vercel (2 min)

### 4.1 Conectar Vercel

1. Abre **https://vercel.com**
2. Haz clic en **"Sign Up"** (o login si ya tenés cuenta)
3. Selecciona **"Continue with GitHub"**
4. Autoriza Vercel a acceder a tu GitHub

### 4.2 Importar proyecto

1. Haz clic en **"Add New Project"**
2. Busca tu repo `neo-vendedores`
3. Haz clic en **"Import"**

### 4.3 Configurar variables de entorno

Vercel te pedirá que agregues las variables (como en `.env.local`):

1. En la sección **"Environment Variables"**, agrega:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://xyzabc123.supabase.co`
   - Click **"Add"**

2. Repite para:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJ...`
   - `SUPABASE_SERVICE_ROLE_KEY`: `eyJ...`
   - `NEXT_PUBLIC_WHATSAPP_VENDOR`: `5492494219951`

### 4.4 Deploy

1. Haz clic en **"Deploy"**
2. ⏳ **Espera 1-2 minutos** (verás un progreso)
3. ✅ Cuando termine, dirá **"Congratulations"**
4. Haz clic en **"Visit"** para ver tu app en vivo

---

## ✅ ¡LISTO!

Tu app está en vivo en:
```
https://neo-vendedores.vercel.app
```

### Prueba:

**Catálogo público** (sin login):
- URL: `https://neo-vendedores.vercel.app/`

**Panel vendedor** (con login):
- URL: `https://neo-vendedores.vercel.app/vendedor/login`
- Email: `admin@neomercado.com`
- Password: `admin123456`

---

## 🔄 Hacer cambios después

Si cambias algo del código:

```bash
# En PowerShell, en la carpeta neo-vendedores:
git add .
git commit -m "Tu mensaje del cambio"
git push
```

Vercel **automáticamente** detectará los cambios y hará un nuevo deploy (en ~2 minutos).

---

## 🆘 Errores comunes

### "Cannot find module"
→ Las dependencias no se instalaron. Vercel debería hacerlo automático, pero si falla:
- Ve a Vercel → Settings → Redeploy

### "Database connection error"
→ Las variables de entorno no están correctas
- Verifica en Vercel → Settings → Environment Variables

### "Auth failed"
→ El .env.local en tu máquina está mal
- Copia las credenciales correctas de Supabase

---

## 📞 ¿Necesitas ayuda?

1. Verifica que las 3 credenciales de Supabase estén **exactas** (copiar-pegar, sin espacios)
2. Espera a que Supabase termine de inicializar (~5 min)
3. Verifica que el SQL se ejecutó sin errores en Supabase

¡Listo! Ahora tienes un **panel de vendedores en vivo** 🎉
