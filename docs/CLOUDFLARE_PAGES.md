# Deploy Frontend en Cloudflare Pages (Free)

## Requisitos previos
- Cuenta en Cloudflare (gratis)
- Repositorio en GitHub: github.com/cmoscoso49/team_mercenarios
- Dominio mercenarios.cl ya apuntando a Cloudflare (o listo para transferir)
- Backend Django corriendo en PythonAnywhere (`TU_USUARIO.pythonanywhere.com`)

---

## PASO 1 — Crear proyecto en Cloudflare Pages

1. Ir a **dash.cloudflare.com** → login
2. Sidebar izquierdo → **Workers & Pages** → **Pages**
3. Clic **Create a project**
4. Elegir **Connect to Git**
5. Autorizar acceso a GitHub → seleccionar repositorio `team_mercenarios`
6. Clic **Begin setup**

---

## PASO 2 — Configurar build

En la pantalla de configuración:

| Campo | Valor |
|-------|-------|
| Project name | `team-mercenarios` |
| Production branch | `main` |
| Framework preset | **Vite** |
| Root directory | `frontend` |
| Build command | `npm run build` |
| Build output directory | `dist` |

---

## PASO 3 — Variables de entorno

En la misma pantalla, sección **Environment variables** → **Add variable**:

| Variable | Value (Production) |
|----------|--------------------|
| `VITE_API_BASE_URL` | `https://TU_USUARIO.pythonanywhere.com/api/v1` |

> Si usas Cloudflare Worker para `api.mercenarios.cl`, usar:
> `VITE_API_BASE_URL=https://api.mercenarios.cl/api/v1`

---

## PASO 4 — Deploy inicial

Clic **Save and Deploy**

Cloudflare:
1. Clona el repositorio
2. Instala dependencias (`npm install`)
3. Ejecuta `npm run build` con la variable de entorno embebida
4. Despliega en `team-mercenarios.pages.dev`

Tiempo estimado: 2-3 minutos.

---

## PASO 5 — Verificar deploy

Abrir `https://team-mercenarios.pages.dev` en el navegador:
- La página `/inicio` debe cargar
- Los stats públicos deben aparecer (se conecta a PythonAnywhere)
- El login debe funcionar

---

## PASO 6 — Conectar dominio mercenarios.cl

### Si el dominio ya está en Cloudflare:

1. Cloudflare Pages → tu proyecto → **Custom domains** → **Add custom domain**
2. Escribir: `mercenarios.cl`
3. Cloudflare agrega automáticamente el registro DNS → **Activate domain**
4. Repetir para: `www.mercenarios.cl`

### Si el dominio NO está en Cloudflare todavía:

**Opción A — Transferir a Cloudflare (recomendado):**
1. dash.cloudflare.com → **Add site** → escribir `mercenarios.cl`
2. Elegir plan Free → Cloudflare muestra los nameservers a configurar
3. En el panel de administrable.cl → DNS → cambiar nameservers a los de Cloudflare
4. Esperar propagación (hasta 24h)
5. Luego hacer el PASO 6 normal

**Opción B — Solo cambiar registros DNS (sin transferir):**
1. En administrable.cl → DNS Manager
2. Agregar registro: `CNAME www → team-mercenarios.pages.dev`
3. Para el apex (`mercenarios.cl`) necesitas un registro A o usar Cloudflare

---

## PASO 7 — SSL (automático)

Cloudflare Pages genera el certificado SSL automáticamente.
No necesitas hacer nada — el dominio ya estará en HTTPS.

---

## Deploys automáticos (Continuous Deployment)

Cada `git push origin main` dispara automáticamente un nuevo build en Cloudflare Pages.

Para ver el estado: dash.cloudflare.com → Workers & Pages → tu proyecto → **Deployments**

---

## Actualizar variable de entorno (si cambia la URL de la API)

1. Cloudflare Pages → tu proyecto → **Settings** → **Environment variables**
2. Editar `VITE_API_BASE_URL`
3. **Save**
4. Ir a **Deployments** → **Retry deployment** (el último build) o hacer un nuevo push

> La variable se embebe en el bundle durante el build — cambiarla requiere un rebuild.

---

## Rollback a versión anterior

1. Cloudflare Pages → tu proyecto → **Deployments**
2. Buscar el deploy anterior que funcionaba
3. Clic en los 3 puntos → **Rollback to this deployment**

Instantáneo — sin downtime.

---

## Checklist final pre-producción

- [ ] `https://mercenarios.cl` carga el frontend ✅
- [ ] `https://www.mercenarios.cl` redirige correctamente ✅
- [ ] `/inicio` muestra stats desde la API ✅
- [ ] `/login` con credenciales reales funciona ✅
- [ ] Panel admin carga en `/` (usuarios con rol liderazgo) ✅
- [ ] `/portal` carga para usuarios player ✅
- [ ] SSL certificado válido (candado verde en el browser) ✅
