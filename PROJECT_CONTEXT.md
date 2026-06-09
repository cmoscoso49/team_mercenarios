# PROJECT_CONTEXT.md — Team Mercenarios

## Estado del proyecto: Etapa 1 Completada + Migración Histórica
Fecha: 2026-06-01 | Migración: 2026-06-01

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

| Dato | Cantidad |
|------|----------|
| Integrantes en BD | 52 (21 activos, 15 inactivos, resto pos natal/otros) |
| Mensualidades 2022-2025 | 1091 registros (548 pagadas, 517 pendientes, 26 exentos — 2026 excluidos) |
| Movimientos financieros | 151 (de H.CONTABLE + GASTOS Y CAJA CHIK) |
| Participaciones | 41 (partidas + campeonato + reunión) |
| Errores nicks 2024 (exintegrantes) | 9 — Thelmo/Walls/Arkaess/Y tu/Caronte/Ron/F.B.I/hugo/Shalox |

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
