# CLAUDE.md — Team Mercenarios

## Flujo de trabajo obligatorio

Antes de realizar cualquier modificación:

1. Leer CLAUDE.md.
2. Leer PROJECT_CONTEXT.md.
3. Consultar CodeGraph (`.codegraph`) antes de leer archivos completos.
4. Utilizar memoria existente (Ruflo) cuando esté disponible.
5. Optimizar el prompt mediante Prompt Master antes de ejecutar tareas complejas.
6. Evitar releer el proyecto completo salvo que sea estrictamente necesario.
7. Leer únicamente los archivos afectados por la tarea solicitada.
8. Mantener el consumo de contexto al mínimo posible.

## Orden de prioridad

1. CLAUDE.md
2. PROJECT_CONTEXT.md
3. CodeGraph
4. Ruflo / memoria existente
5. Prompt Master
6. Lectura parcial de archivos
7. Lectura completa de archivos (solo último recurso)

## Reglas de ahorro de tokens

- No analizar nuevamente módulos ya documentados.
- No volver a generar resúmenes extensos del proyecto.
- No reindexar el proyecto completo.
- No releer frontend y backend completos para tareas pequeñas.
- Utilizar CodeGraph para localizar rápidamente: modelos, serializers, views, rutas, componentes React, servicios, comandos Django.

## Frontend

Cuando una tarea afecte interfaz:

1. Utilizar `frontend-design`.
2. Mantener consistencia visual.
3. No rehacer páginas completas si solo se requiere modificar una sección.
4. Priorizar componentes reutilizables.

## Documentación

- Actualizar CLAUDE.md y PROJECT_CONTEXT.md únicamente en las secciones afectadas.
- No regenerar documentos completos.

## Formato estándar de sesión

Al iniciar una nueva sesión:

1. Leer CLAUDE.md.
2. Leer PROJECT_CONTEXT.md.
3. Consultar CodeGraph.
4. Utilizar Ruflo si existe memoria disponible.
5. Optimizar mediante Prompt Master si la tarea es compleja.
6. Resumir el estado actual en máximo 5 líneas.
7. Ejecutar únicamente la tarea solicitada.

---

## Stack

- Backend: Python + Django 4.2 + Django REST Framework + SQLite (dev) / PostgreSQL 15 (VPS)
- Frontend: React 18 + Vite + React Router v6 + Axios
- Auth: JWT via `djangorestframework-simplejwt`
- Pagos: Flow (flow.cl) — CLP nativo, webhook confirmación, SDK Python
- Herramientas: CodeGraph · Ruflo · Prompt Master · frontend-design

## Proyecto Team Mercenarios — Objetivo permanente

Plataforma integral para Team Mercenarios que combine:

- Gestión financiera, mensualidades y movimientos
- Integrantes y participaciones
- Eventos y campeonatos
- Noticias y galería
- Reportes y administración deportiva

Identidad visual: dark theme táctico, orientado a Airsoft competitivo y clubes deportivos profesionales.

## Roles y permisos (v2 — 2026-06-07)

| Rol sistema  | Cargo real        | Panel admin | Portal | Finanzas |
|-------------|-------------------|-------------|--------|----------|
| `admin`      | Administrador     | SI (total)  | SI     | SI       |
| `TL`         | Team Leader       | SI          | SI     | SI       |
| `presidente` | Presidente        | SI          | SI     | SI       |
| `vice`       | Vice Presidente   | SI          | SI     | SI       |
| `secretario` | Secretario        | SI          | SI     | SI       |
| `tesorero`   | Tesorero          | SI          | SI     | SI       |
| `player`     | Player/Integrante | NO (portal) | SI     | —        |

- Permisos en `apps/usuarios/permissions.py`: `IsAdmin`, `IsLiderazgo`, `IsIntegrante`, `IsPropioIntegranteOrAdmin`
- `ROLES_LIDERAZGO = {'admin','TL','presidente','vice','secretario','tesorero'}` — panel + finanzas
- `IsAdminOrTesorero`, `IsRolCompleto`, `IsCapitanOrAdmin` son aliases de `IsLiderazgo` (compatibilidad backward)
- `player` redirigido al portal al hacer login (ROLES_PORTAL_ONLY = ['player'])
- Liderazgo: panel admin + "Mi Cuenta" en sidebar + boton Panel en portal
- Todos los roles pagan cuotas y ven su estado de cuenta en el portal personal
- Usuarios de prueba: `tesorero1/tesorero2026`, `integrante1/integrante2026`, `style/mercenarios2026@` (TL), `corvo/mercenarios2026@` (player)
- ⚠️ `createsuperuser` crea usuarios con `rol='player'` (default del modelo) → quedan atrapados en el portal. Usar siempre `crear_admin` para el usuario administrador

## Arquitectura v2 — Decisiones clave (2026-06-07)

### Estructura de rutas v2 (implementada)
- PUBLIC: `/inicio`, `/postulacion`, `/noticias/:id`, `/eventos/:id`, `/login`
- PORTAL: `/portal/*` — PortalLayout separado (todos los roles — player exclusivo, liderazgo via sidebar "Mi Cuenta")
- PANEL ADMIN: `/` — Layout actual (solo liderazgo: admin, TL, presidente, vice, secretario, tesorero)

### Guards DRF (implementados)
- `IsLiderazgo` → todos los endpoints de gestión (integrantes, eventos, noticias, finanzas, reportes)
- `IsAdmin` → postulaciones, operaciones admin puras
- `IsIntegrante` → endpoints `/api/v1/portal/*` (todos los roles)
- `IsPropioIntegranteOrAdmin` → object-level: solo datos propios o admin

### Endpoints portal personal
- `GET/PATCH /api/v1/portal/me/` → ficha del integrante autenticado (edita nick/telefono/foto)
- `GET /api/v1/portal/mis-cuotas/` → mensualidades + deudas propias
- `GET /api/v1/portal/mis-eventos/` → próximos + historial propios
- `POST /api/v1/portal/eventos/:id/confirmar/` → confirmar asistencia
- `POST /api/v1/portal/cambiar-password/` → cambio de contraseña propia (IsIntegrante — todos los roles)
- `POST /api/v1/public/postulacion/` → enviar postulación (AllowAny)
- `GET /api/v1/reclutamiento/postulaciones/` → lista admin (IsAdmin)

### Decisiones confirmadas pendientes
- Portal integrante en `/portal/*` separado (recomendado)
- Integrante edita: nick, foto, teléfono — no nombre ni estado
- Formulario postulación: solo BD (sin email por ahora)
- Galería pública: fotos desde BD (admin las sube)

## Roadmap v2 priorizado (post-propuesta-arquitectónica 2026-06-07)

### SPRINT 1 — Base estructural (3-5 días)
- FK `Integrante.usuario = OneToOneField(null=True)` + migración
- `PortalRoute` en App.jsx (wrapper sin Layout admin)
- Guards DRF: `IsCapitanOrAdmin`, `IsIntegrante`, `IsPropioIntegrante`

### SPRINT 2 — Reclutamiento público (3-4 días) ← PRIMERA IMPLEMENTACIÓN
- App `reclutamiento` + modelo `Postulacion` + migración
- Endpoint `POST /api/v1/public/postulacion/` (AllowAny + rate limit)
- Página `/postulacion`: hero, beneficios, requisitos, timeline, FAQ, formulario
- CTA "ÚNETE AL TEAM" en hero + nav + footer de `/inicio`
- Vista admin de postulaciones en Sidebar (solo administrador)

### SPRINT 3 — Portal del Integrante (5-7 días)
- `PortalLayout.jsx` — nav táctica sin sidebar admin
- `PortalDashboard.jsx` — bienvenida + stats propias + cuotas pendientes
- `MiPerfil.jsx` — editar nick, foto, teléfono
- `MisCuotas.jsx` — mensualidades propias + deudas
- `EventosPortal.jsx` — confirmar asistencia a eventos

### SPRINT 4 — UX Premium (2-3 días)
- Toast notifications globales
- Modal confirmación eliminar
- Skeleton loaders
- Tablas responsivas móvil
- Paginación frontend

### SPRINT 5 — Visual avanzado (3-5 días)
- Galería pública con fotos reales
- Línea de tiempo histórica en `/inicio`
- Estadísticas públicas ampliadas (campeonatos, años)
- Foto perfil en sidebar

### SPRINT 6 — VPS + Pagos Online (8-12 días) ← EN PROGRESO

**Fase 0 completada (2026-06-08):**
- [x] requirements.txt: `dj-database-url`, `django-ratelimit`, `requests`
- [x] requirements-vps.txt: `gunicorn`, `psycopg2-binary` (Linux VPS only)
- [x] settings.py: DATABASES desde DATABASE_URL (fallback SQLite), token_blacklist, BLACKLIST_AFTER_ROTATION=True, ACCESS_TOKEN_LIFETIME=2h, Flow env vars
- [x] Frontend: 7 URLs hardcodeadas corregidas (Home.jsx, NoticiaPublica.jsx, EventoPublico.jsx, Postulacion.jsx)
- [x] galeria/views.py: FotoViewSet.permission_classes = [IsLiderazgo]
- [x] App `pagos`: modelo PagoOnline + serializer + services Flow (HMAC) + 4 endpoints + admin + migración
- [x] urls.py: `include('apps.pagos.urls')` en `api/v1/`

**Pendiente:**
- [ ] Contratar VPS + configurar Ubuntu/Nginx/Gunicorn/PostgreSQL
- [ ] Frontend: selector cuotas en MisCuotas.jsx + PagoResultado.jsx
- [ ] Registrar en flow.cl sandbox → obtener FLOW_API_KEY + FLOW_SECRET_KEY → agregar a .env local
- [ ] Migrar datos: dumpdata local → loaddata VPS
- Plan completo: `PROJECT_CONTEXT.md` → "Migración VPS + Pagos Online"

## Endpoints públicos (AllowAny — sin auth)

- `GET /api/v1/public/stats/` → `{ integrantes_activos, eventos_proximos }`
- `GET /api/v1/public/eventos/` → próximos 5 eventos programados
- `GET /api/v1/public/eventos/<id>/` → detalle de evento (cualquier estado)
- `GET /api/v1/public/noticias/` → últimas 3 noticias estado=publicado visibilidad=publica
- `GET /api/v1/public/noticias/<id>/` → detalle noticia (solo publicado+publica)
- Implementado en: `backend/apps/reportes/views_public.py`

## Páginas públicas de detalle (sin auth)

- `/noticias/:id` → `NoticiaPublica.jsx` — título, resumen, contenido completo, imagen, fecha
- `/eventos/:id`  → `EventoPublico.jsx`  — título, tipo, fecha, hora, lugar, descripción, imagen
- CSS compartido: `frontend/src/pages/Home/Publica.css` (dark theme, no afecta dashboard)
- Favicon: `frontend/public/favicon.svg` — crosshair rojo sobre fondo negro
- Título navegador: "Team Mercenarios" (definido en `frontend/index.html`)

## Rutas clave

- Backend: `backend/` — Django project
- Frontend: `frontend/` — React/Vite app
- Django settings: `backend/team_mercenarios/settings.py`
- Django URLs root: `backend/team_mercenarios/urls.py`
- Apps: `backend/apps/{usuarios,integrantes,finanzas,eventos,noticias,galeria,reportes,reclutamiento,pagos}/`
- Permisos: `apps/usuarios/permissions.py`
- Frontend API: `frontend/src/api/`
- Frontend pages: `frontend/src/pages/`
- Frontend components: `frontend/src/components/`
- Assets: `frontend/src/assets/banner/banner.png`, `frontend/src/assets/logo/logo_mercenarios.png`

## Modelos clave (finanzas)

- `ConfiguracionCuota` — valor cuota editable, `/api/v1/finanzas/configuracion-cuota/`
- `ConciliacionExcel` — saldo real del Excel, `/api/v1/reportes/conciliacion/`
- Endpoint reincorporacion: `GET /api/v1/integrantes/{id}/reincorporacion/`

## Reglas de negocio — Mensualidades (2026-06-07)

- **ANIO_MAX = 2025** — ningún endpoint ni frontend genera o muestra deudas de 2026
- Importador histórico excluye hoja MENSUALIDADES 2026
- **reimportar_mensualidades**: comando para reimportar 2024-2025 con unicode-normalization; usa nick_exacto + nombre_exacto (sin partial matching); idempotente (`update_or_create`); `--dry-run` y `--solo-anio` disponibles
- `portal_mis_cuotas`: tope máximo de año = 2025 (backend + frontend)
- `IntegranteFicha`: muestra 2024 y 2025 por separado; no genera cajas para años sin datos
- `resumen` action: totales históricos 2022-2025 solamente
- `reincorporacion` action: calcula pendientes hasta 2025-12, no extiende a 2026
- **Ene-May 2025 condonados**: los meses 1-5 del 2025 fueron perdonados por el team — estado `exento` en BD, no cuentan como deuda en ningún cálculo
- Dashboard KPIs cuotas: `ANIO_MIN=2024, ANIO_MAX=2025`, solo integrantes activos (`integrante__estado='activo'`), evita negativos por deudas históricas de inactivos
- Integrantes list: filtro por defecto = activo (botones Activos | Inactivos | Todos)

## API Base URL

- **Local (dev):** `http://localhost:8001/api/v1/` — Vite proxy redirige `/api` → `localhost:8001`
- **Producción:** `https://mercenarios.pythonanywhere.com/api/v1` (free) o `https://api.mercenarios.cl/api/v1` (con CF Worker)
- `client.js` usa `import.meta.env.VITE_API_BASE_URL || '/api/v1'` — fallback local automático

## Deploy — Arquitectura gratuita (implementada)

| Capa | Servicio | URL |
|------|----------|-----|
| Frontend | Cloudflare Pages (free) | https://mercenarios.cl |
| Backend | PythonAnywhere (free) | https://mercenarios.pythonanywhere.com |
| BD | SQLite en PythonAnywhere | — |

### Frontend (Cloudflare Pages)
- Build: `cd frontend && npm run build` → genera `frontend/dist/`
- Root directory: `frontend` | Build command: `npm run build` | Output: `dist`
- Env var en Cloudflare dashboard: `VITE_API_BASE_URL=https://mercenarios.pythonanywhere.com/api/v1`
- Guía completa: `docs/CLOUDFLARE_PAGES.md`

### Backend (PythonAnywhere)
- settings.py: CORS/CSRF configurables por env var (python-decouple)
- Whitenoise activo en MIDDLEWARE para staticfiles
- `python manage.py check` → 0 issues ✅
- Guía completa: `docs/PYTHONANYWHERE.md`
- WSGI: manual configuration → apuntar a `backend/team_mercenarios/wsgi.py`
- `.env` producción **debe** incluir:
  - `CORS_ALLOWED_ORIGINS=https://team-mercenarios.pages.dev,https://mercenarios.cl,https://www.mercenarios.cl`
  - `CSRF_TRUSTED_ORIGINS=https://mercenarios.pythonanywhere.com,https://mercenarios.cl,https://www.mercenarios.cl`
  - Sin CORS el login falla silenciosamente: el browser bloquea la respuesta y el frontend muestra el fallback JS "Credenciales incorrectas" en lugar del error real

### ⚠️ PythonAnywhere free NO soporta custom domains
- La API queda en `mercenarios.pythonanywhere.com/api/v1`
- Para usar `api.mercenarios.cl`: Plan Hacker ($5/mes) O Cloudflare Worker proxy
- Detalles: `docs/DEPLOY_GRATIS.md`

### VPS — Arquitectura objetivo (decisión 2026-06-08)

Migración a VPS para habilitar pagos online. Stack: **Django + Gunicorn + Nginx + PostgreSQL 15**.

```
Internet → Nginx (SSL Let's Encrypt) → Gunicorn (3 workers) → Django → PostgreSQL
                                                                      → Flow API (pagos)
```

**Proveedor pagos: Flow** — nativo CLP, sin contrato, sandbox disponible, SDK Python.
Ver plan completo en `PROJECT_CONTEXT.md` → "Migración VPS + Pagos Online".

**Cambios pendientes en requirements.txt:** agregar `gunicorn==21.2.0`, `psycopg2-binary==2.9.9`, `dj-database-url==2.2.0`, `django-ratelimit==4.1.0`

**Nueva app:** `backend/apps/pagos/` — modelo `PagoOnline` + endpoints + integración Flow

**Endpoints nuevos:**
- `POST /api/v1/portal/pagos/crear/` — IsIntegrante — inicia pago en Flow
- `GET /api/v1/portal/pagos/` — IsIntegrante — historial de pagos propios
- `GET /api/v1/portal/pagos/{orden_id}/estado/` — IsIntegrante — polling de estado
- `POST /api/v1/public/pagos/confirmar/` — AllowAny — webhook Flow (verificar firma HMAC antes de actuar)

**Vars de entorno adicionales para VPS + pagos:**
- `DATABASE_URL=postgres://user:pass@localhost:5432/team_mercenarios`
- `FLOW_API_KEY=` — ⚠️ NUNCA en código ni git
- `FLOW_SECRET_KEY=` — ⚠️ NUNCA en código ni git
- `FLOW_API_URL=https://www.flow.cl/api` (sandbox: `https://sandbox.flow.cl/api`)
- `FLOW_RETURN_URL=https://mercenarios.cl/portal/pago-resultado/`
- `FLOW_CONFIRM_URL=https://api.mercenarios.cl/api/v1/public/pagos/confirmar/`

### ⚠️ Bugs críticos de producción detectados (auditoría 2026-06-08)
1. **Public API hardcoded**: `Home.jsx`, `NoticiaPublica.jsx`, `EventoPublico.jsx`, `Postulacion.jsx` usan `fetch('/api/v1/...')` sin `VITE_API_BASE_URL` → toda la web pública rota en Cloudflare Pages. Fix: reemplazar con `import.meta.env.VITE_API_BASE_URL || '/api/v1'`
2. **MEDIA no servido en producción**: `urls.py:43` usa `static()` — inactivo con `DEBUG=False`. Fix: configurar `/media/` en Static Files de PythonAnywhere dashboard
3. **SECRET_KEY insecuro**: `settings.py:7` tiene fallback hardcodeado. Fix: verificar que `.env` en PA tiene `SECRET_KEY` real
4. **FotoViewSet sin permission_classes**: hereda `IsAuthenticated` global → players pueden escribir en galería. Fix: agregar `permission_classes = [IsLiderazgo]`
5. **Sin rate limiting**: endpoints `AllowAny` (postulacion, stats, noticias) no tienen throttling

## Datos reales — BD local (auditada 2026-06-08)

| Modelo | Local | Producción (PA) |
|--------|-------|-----------------|
| Integrantes | 52 (21 activos) | ⚠️ 0 — vacío |
| Mensualidades | 1091 (551 pag / 385 pend / 155 exento), 2022-2025 | ⚠️ 0 |
| Movimientos financieros | 151 | ⚠️ 0 |
| Eventos | 5 | ⚠️ 0 |
| Participaciones | 41 | ⚠️ 0 |
| Noticias | 3 publicadas | ⚠️ 0 |
| Instagram posts | 3 publicadas | ⚠️ 0 |
| Usuarios | 5 | 1 (admin) |
| db.sqlite3 | 428 KB | ~50 KB (solo schema + admin) |

- Fuente oficial de integrantes actuales: hoja "MENSUALIDADES 2025" del Excel
- Saldo real Excel: $310.176 (formula: P7+P10-P13+L47+M2023.S34+RIFA.N36+M2024.S41+M2025.S35)
- Dashboard usa saldo_excel como valor principal; saldo_sistema disponible como campo separado
- Excel fuente: `C:\Users\cmoscoso\OneDrive - INACAP\Descargas\2025\Mercenarios\datos team Actualizada 2022-2025 REVISADO POR ESTEBAN TL (4).xlsx`

### ⚠️ Importadores Excel NO funcionan en PythonAnywhere
`EXCEL_PATH` hardcodeado a ruta Windows local en: `importar_excel_historico`, `reimportar_mensualidades`, `sincronizar_integrantes_2025`, `importar_conciliacion`. Para llevar datos a producción: **subir `db.sqlite3` via SCP** (ver `docs/PYTHONANYWHERE.md` paso 6). Después de subir: `python manage.py crear_admin --username=admin --password=CLAVE` para resetear la contraseña del admin.

### Comandos importación (solo válidos en local)
- `python manage.py importar_excel_historico` — movimientos + mensualidades históricas
- `python manage.py sincronizar_integrantes_2025` — integrantes actuales
- `python manage.py reimportar_mensualidades` — re-importa 2024-2025 con unicode-norm
- `python manage.py importar_conciliacion` — saldo real del Excel

## Comandos de desarrollo

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py crear_admin --username=admin --password=CLAVE  # ⚠️ NO usar createsuperuser — rol queda en 'player'
python manage.py seed_data   # datos de prueba
python manage.py runserver 8001  # puerto 8001 (8000 ocupado por otro proyecto)
python manage.py sincronizar_integrantes_2025  # sincroniza integrantes desde MENSUALIDADES 2025
python manage.py sincronizar_integrantes_2025 --dry-run  # previsualizar sin guardar

# Frontend
cd frontend
npm install
npm run dev
```

## Modelo AUTH_USER_MODEL

`apps.usuarios.Usuario` (extiende AbstractUser, agrega `rol` y `telefono`)

## Patrones de código

- Todos los ViewSets usan `ModelViewSet` de DRF
- Filtros con `django-filter` + `SearchFilter` + `OrderingFilter`
- Paginación default: 20 items por página
- Dashboard: `GET /api/v1/dashboard/` retorna todo en una llamada
- Reportes: `GET /api/v1/reportes/{financiero|integrantes|participaciones}/?anio=YYYY`

## Módulo Instagram (2026-06-07)

- Modelo: `PublicacionInstagram` en `apps/galeria/models.py` — campos: titulo, texto, imagen, estado (borrador/lista/publicada/error), destacado, url_publicacion, fecha_creacion
- `estado='publicada'` = visible públicamente. `destacado=True` = aparece primero en el grid.
- Endpoint público: `GET /api/v1/public/instagram/` (AllowAny) — devuelve hasta 9 publicadas, orden `-destacado, -fecha_creacion`
- CRUD admin: `GET/POST/PATCH/DELETE /api/v1/galeria/instagram/` (IsLiderazgo)
- Frontend público: `InstagramSection.jsx` en `components/common/` — grid 3 cols, hover overlay rojo, CTA si vacío
- Frontend admin: `/instagram` (lista), `/instagram/nueva`, `/instagram/:id/editar`
- Handle por defecto: `@team_mercenarios_arica` — constante en `InstagramSection.jsx`
- Futura integración Instagram Graph API: usar `INSTAGRAM_ACCESS_TOKEN` en variables de entorno. Arquitectura ya compatible sin cambio de modelo.
- NO usar scraping, NO Meta API sin token, NO mocks en frontend

## Seguridad

- JWT en header `Authorization: Bearer <token>`
- Token guardado en `localStorage` como `tm_access_token`
- `.env` en backend con SECRET_KEY y DEBUG
- NO guardar credenciales bancarias ni tokens de Instagram en código
- CORS permitido para `localhost:3000` y `localhost:5173`
- `FLOW_API_KEY` y `FLOW_SECRET_KEY`: NUNCA en código, NUNCA en git, NUNCA en CLAUDE.md/PROJECT_CONTEXT.md — solo en `.env` del servidor VPS con `chmod 600`
- Webhook Flow: verificar firma HMAC-SHA256 ANTES de cualquier acción en BD
- PagoOnline: usar `select_for_update()` + `@transaction.atomic` para evitar doble registro
- Rate limiting en `/pagos/crear/`: max 10/min por IP, 5/min por usuario (django-ratelimit)

## Diseño UI

- Dark theme táctico/militar — Oswald (display) + Rajdhani (body) via Google Fonts
- Paleta: fondo `#080808`, cards `#131313`, verde militar `#3d7a3d`/`#52a852`, rojo `#cc2222`, grafito `#3a3a3a`
- `--radius: 2px` (sharp/táctico)
- No usar CSS frameworks externos — CSS puro en archivos `.css`
- Variables CSS en `frontend/src/index.css`
- Clases comunes en `frontend/src/components/common/common.css`
- Logo SVG: `frontend/src/components/common/CrosshairLogo.jsx`
- Home pública: `/inicio` — banner protagonista, sin elementos sobre el centro
- Login `/login` — identidad rojo Mercenarios: grid rojo, glow rojo, accent bar rojo, corner brackets CSS, logo 80px con drop-shadow rojo, botón `#cc2222`. Sin verde. Mismo idioma visual que Home.
