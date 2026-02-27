# Guía de Deployment en Vercel - Task Manager

## ✅ Problema Resuelto: 404 en Recarga de Página

### Causa del Problema:
Cuando tienes una Single Page Application (SPA) con React Router, todas las rutas son manejadas por JavaScript en el cliente. Sin embargo, cuando recargas la página en una ruta como `/board/123`, Vercel intenta buscar ese archivo físicamente en el servidor y devuelve un 404.

### Solución Implementada:
Se creó el archivo `vercel.json` que redirige todas las rutas al `index.html`, permitiendo que React Router maneje la navegación.

---

## 📋 Pasos para Deployment

### 1. **Verificar Archivos Necesarios**

Asegúrate de tener estos archivos en tu repositorio:

✅ **`vercel.json`** (Ya creado)
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

✅ **`.env`** (Variables de entorno locales - NO commitear)
```env
VITE_SUPABASE_URL=https://mcsrqagduiokzyplazop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 2. **Configurar Variables de Entorno en Vercel**

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto "task-manager"
3. Ve a **Settings** → **Environment Variables**
4. Agrega las siguientes variables:

```
Variable Name: VITE_SUPABASE_URL
Value: https://mcsrqagduiokzyplazop.supabase.co

Variable Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jc3JxYWdkdWlva3p5cGxhem9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDUyMDYsImV4cCI6MjA4Nzc4MTIwNn0.g8x972ltwWYhgyjr4ncHxAuNdxoOAlIopJAduDC7z70
```

5. Asegúrate de que estén marcadas para **Production**, **Preview** y **Development**

### 3. **Commit y Push de Cambios**

```bash
# Agregar el archivo vercel.json
git add vercel.json

# Commit
git commit -m "Add vercel.json for SPA routing support"

# Push a tu repositorio
git push origin main
```

### 4. **Re-deploy en Vercel**

Vercel detectará automáticamente los cambios y hará un nuevo deployment. 

O puedes hacer un re-deploy manual:
1. Ve a tu proyecto en Vercel
2. Ve a la pestaña **Deployments**
3. Haz clic en los tres puntos del último deployment
4. Selecciona **Redeploy**

---

## 🧪 Verificar que Funciona

Después del deployment, prueba:

1. ✅ Visita la home: `https://task-manager-umber-two.vercel.app/`
2. ✅ Ve a colaboradores: `https://task-manager-umber-two.vercel.app/collaborators`
3. ✅ Abre un tablero: `https://task-manager-umber-two.vercel.app/board/[id]`
4. ✅ **Recarga la página (F5)** en cada ruta
5. ✅ Todas deberían funcionar sin 404

---

## 📱 Configuración Adicional Recomendada

### Agregar `.gitignore` (si no existe)

```gitignore
# Dependencies
node_modules/

# Build output
dist/
build/

# Environment variables
.env
.env.local
.env.production

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
```

### Agregar `_redirects` (alternativa para otras plataformas)

Si en el futuro usas Netlify u otra plataforma, crea:

**`public/_redirects`**
```
/*    /index.html   200
```

---

## 🔒 Seguridad

### Variables de Entorno:

- ✅ Nunca commitees el archivo `.env` al repositorio
- ✅ Usa el archivo `.env.example` como plantilla
- ✅ Configura las variables en Vercel Dashboard
- ✅ Las variables con prefijo `VITE_` son públicas (se incluyen en el bundle del cliente)

### Políticas RLS en Supabase:

Actualmente tienes acceso público sin autenticación. Si en el futuro necesitas más seguridad:

1. Implementa autenticación (Supabase Auth)
2. Actualiza las políticas RLS
3. Restringe el acceso basado en usuarios autenticados

---

## 🚀 Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build de producción (local)
npm run build

# Preview del build
npm run preview

# Limpiar caché y reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

## 🐛 Troubleshooting

### Problema: Aún veo 404 después del deployment

**Solución:**
1. Verifica que `vercel.json` está en la raíz del proyecto
2. Verifica que el commit incluye el archivo
3. Haz un nuevo deployment desde cero:
   ```bash
   # En Vercel Dashboard
   Settings → General → Delete Project (opcional)
   # Luego importa el proyecto nuevamente
   ```

### Problema: Variables de entorno no funcionan

**Solución:**
1. Verifica que las variables empiezan con `VITE_`
2. Verifica que están configuradas en Vercel
3. Haz un nuevo deployment después de agregar variables
4. En desarrollo local, reinicia el servidor después de cambiar `.env`

### Problema: Build falla en Vercel

**Solución:**
1. Verifica que todas las dependencias están en `package.json`
2. Revisa los logs en Vercel Dashboard
3. Prueba el build localmente: `npm run build`
4. Asegúrate de usar versiones compatibles de Node (16 o superior)

---

## 📊 Configuración de Build en Vercel

Vercel debería detectar automáticamente:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

Si necesitas cambiar algo:
1. Ve a **Settings** → **General** → **Build & Development Settings**

---

## 🎯 Checklist Final

- ✅ `vercel.json` creado y commiteado
- ✅ Variables de entorno configuradas en Vercel
- ✅ `.env` agregado a `.gitignore`
- ✅ Deployment exitoso
- ✅ Todas las rutas funcionan al recargar
- ✅ Colaboradores visibles desde la base de datos
- ✅ Asignación múltiple funciona
- ✅ Exportación a Excel funciona
- ✅ Interfaz móvil responsive

---

¡Tu Task Manager está listo para producción! 🎉
