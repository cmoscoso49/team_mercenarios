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
| Instagram | ✅ modelo | ⚠️ | Solo estructura, sin UI |

## Migración histórica (completada 2026-06-01) + Sincronización 2025 (2026-06-06)
Comando histórico: `python manage.py importar_excel_historico`
Comando integrantes actuales: `python manage.py sincronizar_integrantes_2025`
Excel: `datos team Actualizada 2022-2025 REVISADO POR ESTEBAN TL (4).xlsx`
Fuente oficial de integrantes actuales: hoja **MENSUALIDADES 2025** (col C=nombre, D=nick, E=estado)
Estado pos_natal agregado a ESTADO_CHOICES (migración 0002_add_pos_natal_estado)

| Dato | Cantidad |
|------|----------|
| Integrantes en BD | 52 (36 activos, 15 inactivos, 1 pos natal) |
| Mensualidades 2022-2026 | 1310 registros |
| Movimientos financieros | 151 (de H.CONTABLE + GASTOS Y CAJA CHIK) |
| Participaciones | 41 (partidas + campeonato + reunión) |
| Errores (nicks no encontrados) | 74 — exintegrantes en mensualidades sin ficha en datos del team |

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

**Gaps críticos identificados:**
1. No existe FK `Integrante.usuario` → integrante no tiene portal personal (cuotas, perfil)
2. No existe formulario de postulación público → reclutamiento por WhatsApp
3. CTA "ÚNETE" ausente en página pública
4. Guards de API para rol `capitan`/`integrante` solo en frontend, no en backend DRF
5. Dashboard integrante muestra "sin permisos" — mala bienvenida

## Roadmap Etapa 2 (priorizado post-auditoría)

### 2A — Portal del Integrante (CRÍTICO · ~1.5 semanas)
- [ ] FK `Integrante.usuario = OneToOneField(null=True)` + migración
- [ ] Página "Mi Perfil" para integrante
- [ ] Página "Mis Cuotas" (mensualidades + deudas propias)
- [ ] Dashboard bienvenida personalizado por rol
- [ ] Guards backend DRF para capitan/integrante

### 2B — Reclutamiento público (ALTO · ~1.5 semanas)
- [ ] App `reclutamiento` + modelo `Postulacion`
- [ ] Página pública `/postulacion` con formulario completo
- [ ] CTA "ÚNETE AL TEAM" en hero, nav, footer de `/inicio`
- [ ] Vista admin de postulaciones recibidas

### 2C — Eventos interactivos (ALTO · ~1 semana)
- [ ] Confirmación de asistencia desde portal integrante
- [ ] Indicador confirmados/convocados en detalle evento

### 2D — UX premium (MEDIO · ~1 semana)
- [ ] Toast notifications globales (éxito/error CRUD)
- [ ] Modal confirmación antes de eliminar
- [ ] Skeleton loaders
- [ ] Tablas responsivas en móvil
- [ ] Paginación en frontend (backend ya tiene 20/página)

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
- Credenciales bancarias: NUNCA guardar en código ni .env
- Instagram tokens: pendiente para Etapa 2, usar variables de entorno

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
