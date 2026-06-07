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

- Backend: Python + Django 4.2 + Django REST Framework + SQLite
- Frontend: React 18 + Vite + React Router v6 + Axios
- Auth: JWT via `djangorestframework-simplejwt`
- Herramientas: CodeGraph · Ruflo · Prompt Master · frontend-design

## Proyecto Team Mercenarios — Objetivo permanente

Plataforma integral para Team Mercenarios que combine:

- Gestión financiera, mensualidades y movimientos
- Integrantes y participaciones
- Eventos y campeonatos
- Noticias y galería
- Reportes y administración deportiva

Identidad visual: dark theme táctico, orientado a Airsoft competitivo y clubes deportivos profesionales.

## Roles y permisos

- Permisos en `apps/usuarios/permissions.py`: `IsAdminOrTesorero`, `IsAdmin`
- ROLES_FINANCIEROS = {administrador, tesorero} — acceso a finanzas, dashboard financiero, reportes
- Sidebar filtra items por `user.rol` en `components/Layout/Sidebar.jsx`
- `admin` superusuario debe tener `rol='administrador'` (verificar en Django admin)
- Usuarios de prueba: `tesorero1/tesorero2026`, `integrante1/integrante2026`
- ⚠️ PENDIENTE: `capitan` e `integrante` carecen de guards en backend DRF (solo filtrado frontend)
- ⚠️ PENDIENTE: No existe FK `Integrante.usuario` — bloquea portal personal

## Próximas etapas (Roadmap post-auditoría 2026-06-07)

### ETAPA 2A — Portal del Integrante (CRÍTICO)
- Agregar `usuario = OneToOneField(AUTH_USER_MODEL, null=True)` a modelo Integrante + migración
- Página "Mi Perfil" (nick, estado, foto, equipo)
- Página "Mis Cuotas" (mensualidades propias + deudas)
- Dashboard personalizado por rol (sin mensaje "no tienes permisos")
- Guards de API backend para roles capitan/integrante

### ETAPA 2B — Reclutamiento público
- Nueva app `reclutamiento` + modelo `Postulacion`
- Ruta pública `/postulacion` con formulario completo
- CTA "ÚNETE AL TEAM" en hero, nav y footer de `/inicio`
- Vista admin para gestionar postulaciones

### ETAPA 2C — Eventos + confirmación asistencia
- `POST /api/v1/eventos/:id/confirmar/` (integrante confirma asistencia)
- Vista de confirmados/convocados en detalle evento

### ETAPA 2D — UX premium
- Toast notifications globales (éxito/error en CRUD)
- Modal confirmación antes de eliminar
- Skeleton loaders en lugar de "Cargando..."
- Tablas responsivas en móvil

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
- Apps: `backend/apps/{usuarios,integrantes,finanzas,eventos,noticias,galeria,reportes}/`
- Permisos: `apps/usuarios/permissions.py`
- Frontend API: `frontend/src/api/`
- Frontend pages: `frontend/src/pages/`
- Frontend components: `frontend/src/components/`
- Assets: `frontend/src/assets/banner/banner.png`, `frontend/src/assets/logo/logo_mercenarios.png`

## Modelos clave (finanzas)

- `ConfiguracionCuota` — valor cuota editable, `/api/v1/finanzas/configuracion-cuota/`
- `ConciliacionExcel` — saldo real del Excel, `/api/v1/reportes/conciliacion/`
- Endpoint reincorporacion: `GET /api/v1/integrantes/{id}/reincorporacion/`

## API Base URL

`http://localhost:8001/api/v1/` (puerto 8001 — 8000 ocupado por otro proyecto)

## Datos reales (migración completada)

- 52 integrantes en BD (sincronizados desde MENSUALIDADES 2025 + histórico)
- Fuente oficial de integrantes actuales: hoja "MENSUALIDADES 2025" del Excel
- 1310 mensualidades 2022-2026
- 151 movimientos financieros históricos
- Re-importar datos históricos: `python manage.py importar_excel_historico`
- Sincronizar integrantes actuales: `python manage.py sincronizar_integrantes_2025`
- Re-importar conciliacion: `python manage.py importar_conciliacion`
- Saldo real Excel: $310.176 (formula: P7+P10-P13+L47+M2023.S34+RIFA.N36+M2024.S41+M2025.S35)
- Dashboard usa saldo_excel como valor principal; saldo_sistema disponible como campo separado
- Excel fuente: `C:\Users\cmoscoso\OneDrive - INACAP\Descargas\2025\Mercenarios\datos team Actualizada 2022-2025 REVISADO POR ESTEBAN TL (4).xlsx`

## Comandos de desarrollo

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
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

## Seguridad

- JWT en header `Authorization: Bearer <token>`
- Token guardado en `localStorage` como `tm_access_token`
- `.env` en backend con SECRET_KEY y DEBUG
- NO guardar credenciales bancarias ni tokens de Instagram en código
- CORS permitido para `localhost:3000` y `localhost:5173`

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
