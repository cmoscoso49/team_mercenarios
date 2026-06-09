# PROJECT_CONTEXT.md — Team Mercenarios

## Estado del proyecto: Producción operativa (auditoría 2026-06-08)
Fecha: 2026-06-01 | Migración: 2026-06-01 | Deploy: 2026-06-08

### Auditoría producción 2026-06-08 — Pendientes críticos
1. **PUBLIC API hardcoded** — `Home.jsx`, `NoticiaPublica.jsx`, `EventoPublico.jsx`, `Postulacion.jsx` usan `fetch('/api/v1/...')` o `axios.post('/api/v1/...')` sin `VITE_API_BASE_URL`. En Cloudflare Pages toda la web pública (stats, eventos, noticias, instagram, formulario postulacion) apunta al CDN en lugar de PythonAnywhere → **ROTO en producción**.
2. **SECRET_KEY default inseguro** — `settings.py:7` tiene fallback `'django-insecure-dev-key-...'`. Si el `.env` de PA no lo sobreescribe, todos los JWT son vulnerables.
3. **MEDIA files no servidos** — `urls.py:43` usa `static()` que Django desactiva con `DEBUG=False`. Fotos subidas (perfil, galería, Instagram) no son accesibles en producción.

## Decisiones arquitectónicas
- SQLite para desarrollo; preparado para migrar a PostgreSQL cambiando `DATABASES` en settings.py
- JWT con refresh automático en el cliente Axios (`src/api/client.js`)
- `AUTH_USER_MODEL = 'apps.usuarios.Usuario'` — debe estar configurado antes de la primera migración
- Import de Excel usa `openpyxl` y acepta múltiples formatos de columna (flex parsing)
- Dashboard en un solo endpoint para minimizar requests al cargar
- Todos los modelos tienen `fecha_creacion` automático
- `Integrante.rut` es nullable y unique (permite importar datos sin RUT)
- `Usuario.rol` tiene `default='player'` — Django `createsuperuser` no pide el campo y el usuario queda atrapado en el portal. Usar `python manage.py crear_admin --username=admin --password=CLAVE` para crear el superusuario con rol correcto

## Módulos implementados
| Módulo | Backend | Frontend | Estado |
|--------|---------|----------|--------|
| Auth JWT | ✅ | ✅ | Completo |
| **Home pública** | ✅ | ✅ | Conectada a BD — stats/eventos/noticias desde API pública (AllowAny) |
| Integrantes | ✅ | ✅ | Completo — fuente oficial: hoja MENSUALIDADES 2025 |
| Finanzas (Movimientos) | ✅ | ✅ | Completo |
| Finanzas (Mensualidades) | ✅ | ✅ | Completo |
| Finanzas (Deudas) | ✅ | ✅ | Completo |
| Eventos | ✅ | ✅ | Completo |
| Participaciones | ✅ | ✅ | Completo |
| Noticias | ✅ | ✅ | Completo |
| Galería | ✅ | ✅ | Base lista |
| Reportes | ✅ | ✅ | Completo |
| Dashboard | ✅ | ✅ | Completo — saldo Excel + permisos por rol |
| Permisos por rol | ✅ | ✅ | Sidebar filtra por rol, finanzas protegida |
| Reincorporacion | ✅ | ✅ | Calculo cuotas pendientes en ficha integrante |
| ConfiguracionCuota | ✅ | — | Editable via admin o API |
| Importación Excel | ✅ | ⚠️ | Backend OK, UI pendiente |
| Instagram | ✅ | ✅ | Grid público en /inicio y /galeria + CRUD admin en /instagram |
| Reclutamiento | ✅ | ✅ | Formulario público /postulacion + admin /postulaciones |

## Migración histórica (completada 2026-06-01) + Sincronización 2025 (2026-06-06)
Comando histórico: `python manage.py importar_excel_historico`
Comando integrantes actuales: `python manage.py sincronizar_integrantes_2025`
Comando reimportar 2024-2025: `python manage.py reimportar_mensualidades` (unicode-norm, exact matching, idempotente)
Excel: `datos team Actualizada 2022-2025 REVISADO POR ESTEBAN TL (4).xlsx`
Fuente oficial de integrantes actuales: hoja **MENSUALIDADES 2025** (col C=nombre, D=nick, E=estado)
Estado pos_natal agregado a ESTADO_CHOICES (migración 0002_add_pos_natal_estado)
⚠️ **Todos los importadores tienen EXCEL_PATH hardcodeado a ruta Windows local — no ejecutables en PythonAnywhere.**

| Dato | Local (auditado 2026-06-08) | Producción |
|------|-----------------------------|------------|
| Integrantes | 52 (21 activos, 15 inactivos, resto pos natal/otros) | ⚠️ 0 |
| Mensualidades 2022-2025 | 1091 (551 pagadas, 385 pendientes, 155 exentos) | ⚠️ 0 |
| Movimientos financieros | 151 (de H.CONTABLE + GASTOS Y CAJA CHIK) | ⚠️ 0 |
| Participaciones | 41 (partidas + campeonato + reunión) | ⚠️ 0 |
| Eventos | 5 | ⚠️ 0 |
| Noticias | 3 publicadas | ⚠️ 0 |
| Instagram posts | 3 publicadas | ⚠️ 0 |
| Usuarios | 5 | 1 (admin) |
| db.sqlite3 | 428 KB | ~50 KB |
| Errores nicks 2024 (exintegrantes) | 9 — Thelmo/Walls/Arkaess/Y tu/Caronte/Ron/F.B.I/hugo/Shalox | — |

**Para dejar producción con los datos reales:** subir `db.sqlite3` local via SCP a `~/team_mercenarios/backend/db.sqlite3` en PythonAnywhere, luego `python manage.py migrate` + `python manage.py crear_admin --password=CLAVE` + reload web app.

**Regla de negocio 2026:** Mensualidades 2026 NO se generan ni importan. El año base máximo es 2025. El importador histórico fue actualizado para excluir la hoja MENSUALIDADES 2026.

**Saldo real Excel:** $310.176 | **Saldo sistema:** -$3.189.394 | **Diferencia:** $3.499.570
Formula: H.CONTABLE!P7(1053070) + P10(428000) - P13(3835894) + L47(21000) + M2023!S34(830000) + RIFA!N36(320000) + M2024!S41(1064000) + M2025!S35(430000) = 310.176
El dashboard muestra el saldo Excel como valor principal.
Conciliacion disponible: GET /api/v1/reportes/conciliacion/

**Re-importar datos:** `python manage.py importar_excel_historico`
**Re-importar conciliacion:** `python manage.py importar_conciliacion`

## Rediseño Frontend (completado 2026-06-01)
- **Tipografía táctica**: Oswald (display/headers) + Rajdhani (body) via Google Fonts
- **Paleta extendida**: `--accent-red: #cc2222` (CTA/acción), `--accent-gold: #b8952a` (metálico)
- **Logo**: `CrosshairLogo.jsx` — SVG de mira táctica en `components/common/`
- **Assets reales**: `src/assets/banner/banner.png` y `src/assets/logo/logo_mercenarios.png`
- **Routing**: PrivateRoute redirige a `/inicio`; catch-all → `/inicio`
- **Login**: CrosshairLogo, grid pattern de fondo, link de vuelta a `/inicio`
- **Sidebar**: CrosshairLogo, Oswald uppercase, iconos geométricos ASCII
- **Header**: CrosshairLogo pequeño, título `// SECCIÓN`, chip de usuario con rol

## Home pública v2 (completado 2026-06-01)
- **Hero v4 (final)**: banner 100% limpio — sin título, sin logo, sin texto sobre el centro; overlay solo en zona inferior (transparent→#040404 entre 58%→100%); único contenido visible: botones [ACCESO MIEMBROS] + [CONOCE EL TEAM] en `.home-hero-cta-wrap` posicionados sobre el degradado inferior; stats bar al borde inferior (width:100%, backdrop-filter blur); animaciones: CTAs 0.3s, stats 0.5s
- **Secciones** (orden): Quiénes Somos → Airsoft → Eventos → Noticias → Galería → Únete
- **Quiénes somos**: historia + misión + 4 números impacto + grilla valores
- **Noticias**: tarjetas reales desde BD (estado=publicado, visibilidad=publica) o placeholder "exclusivo miembros" si no hay. Requiere `visibilidad='publica'` en el modelo Noticia
- **Galería**: grid 3x2 con hover overlay y link a galería completa (miembros)
- **Únete**: lista requisitos + contacto card con logo
- **Animaciones**: `IntersectionObserver` + clases `.anim`/`.visible`, hover con `translateY`. Bug corregido (2026-06-07): observer separado en segundo `useEffect([eventos, noticias, stats])` para observar elementos dinámicos post-fetch; usa selector `.anim:not(.visible)` para no re-observar ya-visibles
- **Footer**: logo real + nav + copyright + acceso miembros
- Nav usa logo real (36px) en lugar de SVG crosshair
- **Identidad NEGRO + ROJO (2026-06-01)**: `.home {}` redefine `--accent-primary/#light/#secondary` a rojo `#cc2222/#e63333/#991111`. Todos los elementos verdes del frontend público reemplazados. `home-section-tag` con línea roja `::before`. `home-section-sub` mejorado a `#777777`.

## Login rediseño (completado 2026-06-01)
- **Identidad**: rojo Mercenarios reemplaza totalmente el verde en Login. Coincide con identidad de Home pública.
- **Grid background**: `rgba(204,34,34,0.04)` — rojo muy sutil
- **Overlay glows**: rojo dominante izquierda + gold `#b8952a` hint derecha
- **Accent bar**: gradiente `#cc2222` en borde superior de card
- **Corner brackets**: `::before` top-left / `::after` bottom-right — 18px, `rgba(204,34,34,0.55)`, sin border-radius
- **Logo**: 80px, `drop-shadow` rojo `rgba(204,34,34,0.28)`
- **Header divider**: línea gold `#b8952a` via `::after`
- **Inputs focus**: border + glow rojo
- **Botón**: `#cc2222` → hover `#e63333` + box-shadow rojo
- **Back link hover**: `#cc2222`
- **Archivo**: `frontend/src/pages/Login/Login.css` (solo CSS, JSX sin cambios)

## Auditoría completada (2026-06-07)

Estado actual auditado por roles: Arquitecto · UX Senior · Product Owner · Consultor Airsoft.

**Gaps críticos — estado actual:**
1. ~~No existe FK Integrante.usuario~~ → ✅ Resuelto Sprint 3
2. ~~No existe formulario de postulación público~~ → ✅ Resuelto Sprint 2
3. ~~CTA "ÚNETE" ausente en página pública~~ → ✅ Resuelto Sprint 2
4. ~~Guards de API solo en frontend~~ → ✅ IsLiderazgo/IsAdmin en todos los ViewSets (Sprint 4)
5. ~~Dashboard integrante muestra "sin permisos"~~ → ✅ Redirige al portal (player → /portal)
6. ~~Roles desactualizados~~ → ✅ Nuevo esquema v2 (2026-06-07): admin/TL/presidente/vice/secretario/tesorero/player

## Arquitectura v2 implementada (2026-06-07)

Estructura de rutas: PUBLIC `/inicio /postulacion /noticias/:id /eventos/:id` |
PORTAL `/portal` (todos los roles — player exclusivo, liderazgo via "Mi Cuenta" en sidebar) | ADMIN `/` (liderazgo).
Para activar portal: Admin Django → Integrante → campo "Usuario del sistema" → vincular.

### Esquema de roles v2 (2026-06-07)
- `admin` = Administrador (todos los permisos, solo admin puede gestionar postulaciones)
- `TL` = Team Leader (ex-capitan) — panel + portal + finanzas
- `presidente`, `vice`, `secretario` — mismos permisos que TL
- `tesorero` — mismos permisos que TL (ya no permisos financieros exclusivos)
- `player` = Player (ex-integrante) — solo portal personal
- Todos pagan cuotas → todos tienen portal personal con sus estados de cuenta
- `IsLiderazgo` reemplaza a IsAdminOrTesorero/IsRolCompleto/IsCapitanOrAdmin (aliases activos)
- Usuarios de prueba: `tesorero1/tesorero2026`, `style/mercenarios2026@` (TL), `corvo/mercenarios2026@` (player)

## Roadmap Etapa 2 (priorizado post-auditoría)

### 2A — Portal del Integrante ✅ COMPLETADO (2026-06-07)
- [x] FK `Integrante.usuario = OneToOneField(null=True)` + migración 0003
- [x] Guards DRF: IsLiderazgo, IsIntegrante, IsPropioIntegranteOrAdmin
- [x] Endpoints: GET/PATCH portal/me/, GET portal/mis-cuotas/, GET portal/mis-eventos/
- [x] POST portal/cambiar-password/ — cambio contraseña propia (todos los roles)
- [x] PortalLayout.jsx — nav táctica separada del sidebar admin + link Contraseña
- [x] PortalDashboard.jsx — bienvenida + stats cuotas + ficha + deudas
- [x] MisCuotas.jsx — grid visual meses + tabla deudas + selector año
- [x] CambiarPassword.jsx — formulario con validaciones y toast de confirmacion
- [x] MisEventos.jsx — próximos eventos + historial participación
- [x] MiPerfil.jsx — editar nick y teléfono
- [x] Dashboard admin: integrante/readonly redirigen a portal automáticamente
- VINCULAR: Admin Django → Integrante → campo "Usuario del sistema"

### 2B — Reclutamiento público ✅ COMPLETADO (2026-06-07)
- [x] App `reclutamiento` + modelo `Postulacion` + migración BD
- [x] Endpoint público POST `/api/v1/public/postulacion/` (AllowAny)
- [x] Endpoint admin `/api/v1/reclutamiento/postulaciones/` (IsAdmin)
- [x] Página pública `/postulacion` con formulario completo (dark tactical)
- [x] CTA "ÚNETE AL TEAM" en hero, nav, footer de `/inicio`
- [x] Vista admin `/postulaciones` con tabla + modal gestión de estado
- [x] Sidebar item Postulaciones (solo administrador)

### 2C — Sprint 4: Seguridad aplicada + UX Premium ✅ COMPLETADO (2026-06-07)
- [x] IsRolCompleto permission (admin+tesorero+capitan)
- [x] IntegranteViewSet: destroy bloqueado (405), acciones `dar-de-baja` y `reactivar`
- [x] EventoViewSet + NoticiaViewSet: guards por método HTTP (IsCapitanOrAdmin para mutaciones)
- [x] Endpoint portal: confirmar asistencia a evento (`POST /portal/eventos/:id/confirmar/`)
- [x] ToastProvider + useToast: notificaciones globales (4 tipos, auto-dismiss, max 3)
- [x] ConfirmModal + useConfirm: diálogo confirmación reutilizable (rojo/verde)
- [x] Integrantes.jsx: Dar de baja / Reactivar con confirmación (sin eliminar)
- [x] MisEventos.jsx: botones confirmar asistencia con estado reactivo
- [x] Eventos, Noticias, Finanzas, Postulaciones: toast en operaciones CRUD
- [x] common.css: media queries mobile (600px breakpoint, tablas responsivas)
- REGLA DE NEGOCIO: Admin NO puede eliminar integrantes, solo dar de baja (estado inactivo)

### 2D — Pendiente (MEDIO)
- [ ] Skeleton loaders
- [ ] Paginación en frontend (backend ya tiene 20/página)
- [ ] Indicador confirmados/convocados en detalle evento

### Etapa 3 — Funcionalidades avanzadas (post-validación)
- [ ] Ranking anual de participación
- [ ] Ficha Táctica por integrante (estadísticas históricas)
- [ ] Galería con upload real de fotos
- [ ] Calendario visual interactivo
- [ ] Exportar reportes a PDF/Excel
- [ ] Crear movimientos de ingreso desde mensualidades
- [ ] Deploy en servidor (SQLite → PostgreSQL)
- [ ] Módulo Instagram (Etapa 2 del módulo ya modelado)
- [ ] Notificaciones de deudas vencidas
- [ ] Mapa de campos de Airsoft (Arica + Chile)

## Variables de entorno críticas
- `SECRET_KEY`: clave Django (cambiar en producción)
- `DEBUG`: False en producción
- `VITE_API_BASE_URL`: URL base API para frontend en producción
  - Free tier: `https://TU_USUARIO.pythonanywhere.com/api/v1`
  - Con custom domain: `https://api.mercenarios.cl/api/v1` (requiere CF Worker o PA Hacker)
  - Definida en `frontend/.env.production` (local, en .gitignore) y en Cloudflare Pages → Settings → Variables
  - En dev local no se requiere — el proxy Vite redirige `/api` → `localhost:8001` automáticamente
- `CORS_ALLOWED_ORIGINS`: `https://team-mercenarios.pages.dev,https://mercenarios.cl,https://www.mercenarios.cl` — ⚠️ crítico: sin esto el login falla silenciosamente desde Cloudflare Pages (browser bloquea, frontend muestra fallback JS "Credenciales incorrectas")
- `CSRF_TRUSTED_ORIGINS`: `https://mercenarios.pythonanywhere.com,https://mercenarios.cl,https://www.mercenarios.cl`
- Credenciales bancarias: NUNCA guardar en código ni .env
- Instagram tokens: pendiente para Etapa futura — si la cuenta se convierte a Business/Creator, se puede integrar Instagram Graph API (token en variable de entorno INSTAGRAM_ACCESS_TOKEN). La arquitectura actual (PublicacionInstagram + endpoint público) ya es compatible con esa integración sin cambios de modelo.

## Migración VPS + Pagos Online — Plan técnico (2026-06-08)

**Decisión confirmada:** migrar de PythonAnywhere a VPS propio para habilitar pagos online de cuotas.
**Proveedor de pagos elegido:** Flow (flow.cl) — nativo CLP, SDK Python, sandbox, sin contrato previo.

### 1. Auditoría VPS-readiness — estado actual

**Listo (sin cambios):**
- `python-decouple` ya en uso — todas las vars de entorno parametrizadas
- `whitenoise` en requirements — staticfiles manejados en código
- `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` configurables via .env
- Todos los modelos usan Django ORM estándar — 100% compatibles con PostgreSQL sin cambios de código
- Sin queries raw SQL dependientes de SQLite
- Security headers ya presentes en settings.py (`SECURE_BROWSER_XSS_FILTER`, `X_FRAME_OPTIONS`)

**Falta — acciones requeridas antes del VPS:**
- `gunicorn` ausente en requirements.txt (servidor WSGI para VPS — reemplaza mod_wsgi de PA)
- `psycopg2-binary` ausente (adaptador PostgreSQL)
- `dj-database-url` ausente (opcional; permite `DATABASE_URL=postgres://...` en .env)
- `django-ratelimit` ausente (throttling para endpoints AllowAny + pagos)
- `DATABASES` en settings.py hardcodeado a SQLite — debe leer de env var con fallback SQLite para dev
- `BLACKLIST_AFTER_ROTATION=False` — tokens rotados siguen válidos; cambiar a True + agregar `rest_framework_simplejwt.token_blacklist` a INSTALLED_APPS
- Sin app `pagos` (modelo PagoOnline no existe aún)

### 2. Arquitectura VPS recomendada

```
Internet → Nginx (SSL/TLS vía Let's Encrypt)
              ↓
         Gunicorn (3-4 workers, socket Unix)
              ↓
         Django 4.2 + DRF
              ↓
         PostgreSQL 15 (mismo VPS)
              ↓
         Flow API (checkout externo)
```

| Capa | Servicio | Referencia |
|------|----------|------------|
| OS | Ubuntu 22.04 LTS | — |
| WSGI | Gunicorn 21.x | `gunicorn team_mercenarios.wsgi:application -w 3 --bind unix:/run/gunicorn.sock` |
| Proxy | Nginx 1.24 | proxy_pass al socket + location /media/ + location /static/ |
| BD | PostgreSQL 15 | mismo servidor; migrar a BD gestionada en futuro |
| SSL | Let's Encrypt via certbot | `certbot --nginx -d api.mercenarios.cl` |
| Proceso | systemd | `gunicorn_mercenarios.service` — restart on failure |
| Static | Whitenoise (ya activo) | collectstatic → /staticfiles/ |
| Media | Nginx `/media/` → `MEDIA_ROOT` | futuro: Cloudflare R2 |

**VPS mínimo recomendado:** 2 vCPU, 2 GB RAM, 40 GB SSD (~$5-12/mes: Contabo, DigitalOcean, Hostinger VPS)

### 3. Impacto SQLite → PostgreSQL

**Sin impacto (sin cambios de código):**
- Django ORM genera SQL estándar — todos los modelos, migraciones y queries son compatibles
- `CharField`, `DecimalField`, `DateField`, `BooleanField`, `JSONField` — tipos universales
- `select_related`, `prefetch_related`, `update_or_create`, `get_or_create` — iguales
- SearchFilter de DRF usa `ILIKE` internamente — funciona igual en PostgreSQL

**Requiere verificación post-migración:**
- `icontains` en queries manuales: PostgreSQL es case-sensitive en `LIKE` (pero `icontains` usa `ILIKE` automáticamente — OK)
- Unicode en nicks (ñ, tildes): verificar con `reimportar_mensualidades --dry-run` tras loaddata
- `USE_TZ=True` en settings (ya el default Django): PostgreSQL es timezone-aware nativo — verificar fechas de mensualidades/movimientos con `python manage.py shell`

**Proceso de migración de datos:**
```bash
# Local (dump):
python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission > data_full.json

# VPS (carga):
python manage.py migrate          # crea schema vacío en PostgreSQL
python manage.py loaddata data_full.json
python manage.py crear_admin --username=admin --password=CLAVE_SEGURA

# Verificar conteos esperados:
# Integrante: 52 | Mensualidad: 1091 | Movimiento: 151 | Participacion: 41
```

**Alternativa sin Django:** `pgloader sqlite:///db.sqlite3 postgresql://user:pass@localhost/team_mercenarios` — una línea, migra datos y tipos automáticamente.

### 4. Modelos involucrados — cuotas, finanzas y pagos

**Existentes (`apps/finanzas/models.py`):**
| Modelo | Campos clave | Rol en pagos |
|--------|-------------|--------------|
| `Mensualidad` | anio, mes, monto, estado (pagado/pendiente/exento), fecha_pago, integrante FK | Se marca `pagado` al confirmar pago online |
| `Movimiento` | tipo (ingreso/egreso), monto, descripcion, categoria FK, integrante FK, fecha | Se crea ingreso automáticamente al confirmar pago |
| `Deuda` | monto_total, monto_pagado, estado (pendiente/parcial/pagado), integrante FK | Futura: saldar deudas via pago online |
| `ConfiguracionCuota` | valor_cuota, moneda, vigencia_desde, activa | Determina el monto a cobrar por cuota |
| `Categoria` | nombre, tipo | FK de Movimiento — se usará categoría "Mensualidad online" |

**Nuevo modelo — `apps/pagos/models.py` (por crear):**
```python
class PagoOnline(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),('completado', 'Completado'),
        ('fallido', 'Fallido'),('expirado', 'Expirado'),('cancelado', 'Cancelado')
    ]
    integrante     = FK → Integrante
    mensualidades  = ManyToManyField(Mensualidad, blank=True)  # cuotas que cubre
    monto          = DecimalField(max_digits=10, decimal_places=0)
    proveedor      = CharField(max_length=20, default='flow')
    estado         = CharField(max_length=20, choices=ESTADOS, default='pendiente')
    orden_id       = CharField(max_length=100, unique=True)    # ID interno único (uuid4)
    token_proveedor= CharField(max_length=200, blank=True)     # token de Flow
    url_pago       = URLField(blank=True)                      # URL checkout de Flow
    fecha_creacion = DateTimeField(auto_now_add=True)
    fecha_expiracion = DateTimeField()                         # ~10 min desde creación
    fecha_confirmacion = DateTimeField(null=True, blank=True)
    datos_respuesta = JSONField(default=dict)                  # respuesta completa Flow
    movimiento     = FK → Movimiento (null=True)               # creado al confirmar
```

### 5. Proveedor de pagos: Flow (decisión 2026-06-08)

**Comparación:**
| Proveedor | Comisión | SDK Python | Sandbox | Contrato | CLP nativo |
|-----------|---------|------------|---------|----------|------------|
| **Flow** ✅ | ~1.95%+IVA | Sí (oficial) | Sí (sandbox.flow.cl) | No | Sí |
| Transbank Webpay | ~1.45%+IVA | Sí (`transbank-sdk`) | Sí | Sí (proceso largo) | Sí |
| MercadoPago | 1.99-3.49% | Sí (oficial) | Sí | No | Sí (conversión interna) |

**Por qué Flow:** chileno, sin contrato, sandbox completo, API REST simple, SDK Python, integración en 1-2 días. Para Webpay: requiere afiliación a Transbank (semanas) y firma de contrato — viable como alternativa si el team prefiere la marca Webpay en el checkout.

**Integración Flow:** `pip install pyflow` o llamadas directas a `https://sandbox.flow.cl/api` con `FLOW_API_KEY` + firma HMAC-SHA256 de los parámetros.

### 6. Flujo de pago seguro

```
PLAYER (browser)          BACKEND (Django)              FLOW API
      |                         |                           |
      | POST /portal/pagos/crear|                           |
      | {mensualidades:[1,2,3]} |                           |
      |                         | Verificar estado != pagado|
      |                         | PagoOnline(pendiente)     |
      |                         |─── createPayment ────────>|
      |                         |<── {token, paymentURL} ──|
      |<── {url_pago: "..."} ─ |                           |
      |                         |                           |
      |─── REDIRECT → Flow ───>                            |
      |        [usuario paga con tarjeta en Flow]           |
      |                         |                           |
      |                         |<── POST /public/pagos/confirmar/ (confirmURL)
      |                         | 1. Verificar firma HMAC   |
      |                         | 2. flow.getStatus(token)  |
      |                         | 3. Si status=1 (éxito):   |
      |                         |    transaction atómica:   |
      |                         |    - PagoOnline.estado=completado
      |                         |    - Mensualidad.estado=pagado
      |                         |    - Movimiento(tipo=ingreso) crear
      |<── REDIRECT returnURL  |                           |
      |                         |                           |
      | GET /portal/pagos/{id}/estado                       |
      |<── {estado: "completado", mensualidades: [...]} ─  |
```

**Endpoints requeridos (nuevos):**
- `POST /api/v1/portal/pagos/crear/` — `IsIntegrante` — crea PagoOnline, llama Flow, devuelve url_pago
- `GET /api/v1/portal/pagos/` — `IsIntegrante` — historial de pagos propios
- `GET /api/v1/portal/pagos/{orden_id}/estado/` — `IsIntegrante` — polling post-redirección
- `POST /api/v1/public/pagos/confirmar/` — `AllowAny` — webhook de Flow (verificar firma antes de actuar)

**Regla crítica:** NUNCA marcar como pagado solo por el webhook. Siempre re-verificar con `flow.getPaymentStatus(token)` antes de cualquier actualización en BD. Usar `select_for_update()` + transacción atómica para evitar race conditions.

### 7. Variables de entorno requeridas (VPS)

```bash
# BASE
SECRET_KEY=               # mínimo 50 chars random
DEBUG=False
ALLOWED_HOSTS=api.mercenarios.cl

# BASE DE DATOS
DATABASE_URL=postgres://tm_user:PASSWORD@localhost:5432/team_mercenarios

# CORS / CSRF (actualizar cuando el dominio esté activo)
CORS_ALLOWED_ORIGINS=https://mercenarios.cl,https://www.mercenarios.cl,https://team-mercenarios.pages.dev
CSRF_TRUSTED_ORIGINS=https://api.mercenarios.cl,https://mercenarios.cl,https://www.mercenarios.cl

# PAGOS — FLOW (obtener en flow.cl → Mi cuenta → Credenciales)
FLOW_API_KEY=             # ⚠️ NUNCA en código ni git
FLOW_SECRET_KEY=          # ⚠️ NUNCA en código ni git
FLOW_API_URL=https://www.flow.cl/api       # producción
# FLOW_API_URL=https://sandbox.flow.cl/api # desarrollo/testing
FLOW_RETURN_URL=https://mercenarios.cl/portal/pago-resultado/
FLOW_CONFIRM_URL=https://api.mercenarios.cl/api/v1/public/pagos/confirmar/

# FRONTEND (Cloudflare Pages dashboard)
VITE_API_BASE_URL=https://api.mercenarios.cl/api/v1
```

**Regla absoluta:** `FLOW_API_KEY` y `FLOW_SECRET_KEY` NUNCA en código, NUNCA en git, NUNCA en este archivo. Solo en el .env del servidor VPS con permisos `chmod 600`.

### 8. Riesgos de seguridad

| Riesgo | Nivel | Mitigación |
|--------|-------|-----------|
| Webhook sin verificar firma HMAC | ALTO | `hmac.compare_digest(firma_recibida, calcular_firma(body))` antes de cualquier acción |
| Race condition doble-pago | ALTO | `select_for_update()` en Mensualidad + transacción atómica `@transaction.atomic` |
| Token Flow reutilizado | ALTO | Campo `fecha_expiracion` en PagoOnline; verificar siempre con Flow API el estado real |
| FLOW_API_KEY expuesto en logs | ALTO | Nunca loguear headers de requests; usar `logging.getLogger` con nivel WARNING en producción |
| Double-spend (dos pagos mismas cuotas) | MEDIO | Verificar `mensualidad.estado != 'pagado'` al crear PagoOnline |
| Sin rate limiting en /pagos/crear/ | MEDIO | `django-ratelimit`: 10/min por IP, 5/min por usuario autenticado |
| BLACKLIST_AFTER_ROTATION=False | MEDIO | Cambiar a True + `rest_framework_simplejwt.token_blacklist` en INSTALLED_APPS |
| ACCESS_TOKEN_LIFETIME=8h | BAJO | Reducir a 2h en VPS |
| MEDIA sin CDN/backup | BAJO | Configurar backup manual o Cloudflare R2 |
| Unicode en nicks PostgreSQL | BAJO | Verificar con `reimportar_mensualidades --dry-run` tras loaddata |

### 9. Plan de implementación step-by-step

**FASE 0 — Preparación local (1-2 días) — sin deploy**
1. Agregar a `requirements.txt`: `gunicorn==21.2.0`, `psycopg2-binary==2.9.9`, `dj-database-url==2.2.0`, `django-ratelimit==4.1.0`
2. Actualizar `settings.py`: `DATABASES` leer de `DATABASE_URL` con fallback a SQLite (`dj_database_url.config(default='sqlite:///db.sqlite3')`)
3. Cambiar `BLACKLIST_AFTER_ROTATION=True` + agregar `rest_framework_simplejwt.token_blacklist` a INSTALLED_APPS
4. Reducir `ACCESS_TOKEN_LIFETIME` de 8h a 2h
5. Crear app `pagos`: `python manage.py startapp pagos` → agregar a INSTALLED_APPS + urls.py
6. Definir modelo `PagoOnline` + migración inicial
7. Crear `apps/pagos/services.py` con funciones Flow: `crear_pago(orden_id, monto, integrante)`, `verificar_pago(token)`
8. Implementar los 4 endpoints de pagos
9. Probar con sandbox.flow.cl — registrar `FLOW_CONFIRM_URL` en dashboard de Flow sandbox
10. Corregir los 7 URLs hardcodeados (Home.jsx, NoticiaPublica.jsx, EventoPublico.jsx, Postulacion.jsx)
11. Agregar `FotoViewSet.permission_classes = [IsLiderazgo]`

**FASE 1 — Contratar VPS (1 día)**
12. Contratar VPS: 2 vCPU / 2 GB RAM / 40 GB SSD (Contabo ~$5/mes, DigitalOcean ~$12/mes)
13. OS: Ubuntu 22.04 LTS
14. Apuntar DNS `api.mercenarios.cl → IP_VPS` (si se tiene el dominio, sino usar IP directa)

**FASE 2 — Configurar servidor (1 día)**
15. `apt update && apt upgrade -y`
16. `apt install python3.12 python3.12-venv postgresql-15 nginx certbot python3-certbot-nginx -y`
17. PostgreSQL: `sudo -u postgres createdb team_mercenarios && createuser tm_user` + contraseña
18. `git clone https://github.com/cmoscoso49/team_mercenarios.git`
19. `python3.12 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
20. Crear `backend/.env` con todas las variables de la Sección 7
21. `python manage.py migrate && python manage.py collectstatic --noinput`

**FASE 3 — Gunicorn + Nginx (1 día)**
22. Crear `/etc/systemd/system/gunicorn_mercenarios.service` (WorkingDirectory, ExecStart, socket unix, User www-data)
23. `systemctl enable --now gunicorn_mercenarios`
24. Crear `/etc/nginx/sites-available/mercenarios` con proxy_pass al socket + locations para /media/ y /static/
25. `certbot --nginx -d api.mercenarios.cl` — SSL automático
26. `nginx -t && systemctl reload nginx`

**FASE 4 — Migrar datos (2 horas)**
27. Local: `python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission > data_full.json`
28. `scp data_full.json user@IP_VPS:~/team_mercenarios/backend/`
29. VPS: `python manage.py loaddata data_full.json`
30. VPS: `python manage.py crear_admin --username=admin --password=CLAVE_SEGURA`
31. Verificar conteos: 52 integrantes, 1091 mensualidades, 151 movimientos

**FASE 5 — Configurar pagos (2-3 días)**
32. Crear cuenta en flow.cl → sandbox → obtener `FLOW_API_KEY` y `FLOW_SECRET_KEY`
33. Registrar `FLOW_RETURN_URL` y `FLOW_CONFIRM_URL` en dashboard Flow sandbox
34. Agregar las claves al `.env` del VPS (sin commitear)
35. Probar flujo completo sandbox: crear pago → pagar con tarjeta de prueba → webhook → verificar mensualidad `pagado` + movimiento `ingreso` creado
36. Revisar logs Nginx para confirmar que `confirmURL` llega correctamente (`tail -f /var/log/nginx/access.log`)
37. Activar cuenta Flow producción (requiere RUT y datos bancarios del team)

**FASE 6 — Frontend pagos (1-2 días)**
38. Agregar selector de cuotas + botón "Pagar en línea" en `MisCuotas.jsx`
39. Crear `PagoResultado.jsx` en `/portal/pago-resultado/` — muestra resultado tras redirect de Flow
40. Actualizar `VITE_API_BASE_URL` en Cloudflare Pages dashboard → URL del VPS

**FASE 7 — DNS + smoke test (1 día)**
41. Actualizar CORS_ALLOWED_ORIGINS y CSRF_TRUSTED_ORIGINS en VPS .env si cambia dominio
42. Rebuild Cloudflare Pages
43. Smoke test completo: login → portal → mis-cuotas → pago sandbox → verificar BD

**Resumen de tiempo estimado:** 8-12 días incluyendo cuenta Flow y configuración VPS.

## Modelo de datos (relaciones clave)
```
Usuario (AUTH_USER_MODEL)
  └── crea Movimientos, Noticias, ImportacionArchivo

Integrante
  ├── tiene Mensualidades (1:N)
  ├── tiene Deudas (1:N)
  ├── participa en Eventos (M:N via Participacion)
  └── aparece en Fotos (M:N)

Evento
  ├── tiene Participaciones (1:N)
  ├── tiene Album de Galería (1:N)
  └── convocados/asistentes (M:N con Integrante)

Movimiento → Categoria (N:1)
Foto → Album (N:1)
PublicacionInstagram → Noticia (N:1, opcional)
```
