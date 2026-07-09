# Auditoría de pagos en producción – Team Mercenarios

**Fecha:** 2026-06-24  
**Auditor:** Claude Sonnet 4.6 (ingeniero senior Django/React/Flow)  
**Rama auditada:** `main`  
**Commit auditado:** `9fcd91e`

---

## 1. Resumen ejecutivo

El sistema Team Mercenarios tiene una arquitectura correcta y un módulo de pagos Flow bien diseñado en su núcleo (modelo idempotente, verificación HMAC, monto desde BD). Sin embargo, existen 5 blockers que impiden el uso en producción hoy:

1. El bundle de frontend publicado en mercenarios.cl apuntaba al backend antiguo (PythonAnywhere), no a Render — **corregido en esta auditoría**.
2. El backend en Render no responde (servicio caído o en cold start permanente).
3. Las variables `FLOW_CONFIRM_URL` y `FLOW_RETURN_URL` no están configuradas en Render, lo que deja todos los pagos en estado `pendiente`.
4. `FLOW_API_URL` apunta a sandbox — correcto para pruebas, pero debe cambiarse antes de cobros reales.
5. El webhook de Flow podía ser bypasseado si `FLOW_SECRET_KEY` estaba vacío — **corregido en esta auditoría**.

---

## 2. Veredicto

**NO LISTO PARA PRODUCCIÓN**

---

## 3. Nivel de confianza

**Medio**

La auditoría cubre análisis estático completo del código fuente, ejecución de checks locales y pruebas de conectividad al servidor de producción. El nivel de confianza no alcanza "alto" porque el backend en Render no respondió durante la auditoría, impidiendo la ejecución de pruebas funcionales end-to-end y de seguridad en el entorno de producción real.

---

## 4. Alcance revisado

| Capa | Módulos / archivos auditados |
|---|---|
| Backend configuración | `settings.py`, `urls.py`, `render.yaml`, `requirements.txt` |
| Pagos | `apps/pagos/models.py`, `views.py`, `services.py`, `urls.py`, `serializers.py` |
| Finanzas | `apps/finanzas/models.py`, `views.py` |
| Usuarios | `apps/usuarios/models.py`, `permissions.py` |
| Comandos de gestión | `crear_usuarios_jugadores.py`, `cargar_datos_iniciales.py` |
| Frontend | `MisCuotas.jsx`, `PagoResultado.jsx`, `client.js`, `vite.config.js`, `.env.production` |
| Infraestructura | `render.yaml`, conexión TCP/HTTPS a Render |
| Tests | `manage.py check`, `check --deploy`, `makemigrations --check`, `npm run build`, `npm audit`, `pip check` |

---

## 5. Arquitectura actual

```
Usuario (mercenarios.cl)
  └─ Frontend React/Vite
       ├─ Cloudflare Pages (mercenarios.cl)  ← build local → subir a Webuzo manualmente
       └─ VITE_API_BASE_URL → https://team-mercenarios.onrender.com/api/v1

Backend Django 4.2 + DRF
  └─ Render (free tier)
       ├─ Gunicorn 2 workers
       ├─ PostgreSQL 15 (Render free — expira 90 días)
       └─ Whitenoise para statics

Proveedor pagos
  └─ Flow.cl (Khipu activo, WebPay desactivado)
       ├─ API sandbox: https://sandbox.flow.cl/api  ← configurado
       └─ API producción: https://www.flow.cl/api   ← pendiente cambiar
```

---

## 6. Estado de la base de datos

| Aspecto | Estado |
|---|---|
| Motor producción | PostgreSQL 15 (Render managed) |
| Persistencia | Sí — persiste entre deploys. **Expira en 90 días (plan free)** |
| SQLite en producción | No — `DATABASE_URL` env var selecciona PostgreSQL |
| Fallback SQLite | Sí — si `DATABASE_URL` no está configurado, Django usa SQLite efímero. Riesgo si la variable se pierde |
| Datos tras deploy | Persisten (PostgreSQL externo) |
| Migraciones | Se ejecutan en `buildCommand` (`python manage.py migrate`) |
| Estado actual BD | 1 integrante (missed). Los 52 del fixture no se cargaron — causa probable: fixture encontró 1 integrante previo y omitió la carga |
| `cargar_datos_iniciales` | Idempotente — no borra datos. Solo carga si `Integrante.objects.exists()` es False |
| Riesgo idempotencia | Si hay ≥1 integrante (aunque sea de prueba), el fixture de datos reales nunca se aplicará automáticamente |
| `crear_usuarios_jugadores` | No está en el start command de Render (correcto). Resetea claves de TODOS los integrantes activos si se ejecuta |
| Respaldo | Ninguno documentado |

---

## 7. Estado del módulo financiero

| Aspecto | Estado |
|---|---|
| Modelo `Mensualidad` | `unique_together(integrante, anio, mes)` — previene duplicados |
| Monto | `DecimalField` — correcto para CLP |
| Estado cuota | `pendiente` / `pagada` / `exento` — estados bien definidos |
| Saldo calculado | Desde BD (suma de mensualidades pendientes). No se almacena como campo redundante |
| Acceso por integrante | `IsPropioIntegranteOrAdmin` en endpoints de portal — correcto |
| Historial | `Movimiento` registrado al confirmar pago — trazabilidad completa |
| Consistencia actual | **Inconsistente** — BD tiene solo 1 integrante. Sin datos financieros reales cargados |

---

## 8. Estado de Flow

| Aspecto | Estado |
|---|---|
| Integración | Implementada y funcional en código |
| Sandbox probado | Sí — en sesión anterior (2026-06-23) flujo completo funcionó en localhost → Render sandbox |
| Webhook | Implementado con `AllowAny` + verificación HMAC |
| Validación monto | Correcto — desde BD, no del cliente |
| Idempotencia webhook | Correcto — `select_for_update()` + `transaction.atomic` |
| HMAC bypass | **Corregido en esta auditoría** — antes retornaba `True` si `FLOW_SECRET_KEY` estaba vacío |
| `FLOW_API_KEY` | Sin configurar en Render (modo mock activo) |
| `FLOW_SECRET_KEY` | Sin configurar en Render |
| `FLOW_CONFIRM_URL` | Sin configurar — Flow llama a `localhost` (timeout) |
| `FLOW_RETURN_URL` | Sin configurar — usuario redirigido a `localhost` |
| `FLOW_API_URL` | Sandbox configurado — correcto para pruebas, cambiar para producción real |
| Conciliación | `PagoOnline.datos_respuesta` (JSONField) almacena respuesta completa de Flow |
| Estados manejados | `pendiente`, `pagado`, `rechazado`, `anulado` |

---

## 9. Pruebas realizadas

| Prueba | Resultado | Evidencia | Observaciones |
|---|---|---|---|
| `manage.py check` | APROBADA | 0 issues | Local |
| `manage.py check --deploy` | APROBADA CON WARNINGS | 6 warnings de seguridad | HSTS, SSL redirect, cookies seguras. Ver hallazgo #8 |
| `makemigrations --check --dry-run` | APROBADA | "No changes detected" | Local |
| `showmigrations` (pendientes) | APROBADA | Sin migraciones pendientes | Local |
| `pip check` | APROBADA | No broken requirements | Local |
| `npm run build` | APROBADA | 150 módulos, sin errores | Local |
| `npm audit` | FALLIDA | 3 vulnerabilidades | 1 moderate esbuild, 2 high form-data CRLF |
| TCP `team-mercenarios.onrender.com:443` | APROBADA | Puerto abierto, SSL OK | Render responde a nivel TCP |
| `GET /api/v1/public/stats/` Render | FALLIDA | Timeout >2 min | Servicio no responde a nivel HTTP |
| Login en Render | BLOQUEADA | Servicio caído | Requiere que el servicio responda |
| `/portal/mis-cuotas/` en Render | BLOQUEADA | Servicio caído | — |
| `POST /portal/pagos/crear/` en Render | BLOQUEADA | Servicio caído | — |
| Webhook `/public/pagos/confirmar/` | BLOQUEADA | Servicio caído | Análisis estático: HMAC bypass corregido |
| Test IDOR cuotas ajenas | BLOQUEADA | Servicio caído | Análisis estático: `IsPropioIntegranteOrAdmin` correcto |
| Idempotencia webhook (doble envío) | BLOQUEADA | Servicio caído | Código correcto: `select_for_update` implementado |
| Monto manipulado desde frontend | BLOQUEADA | Servicio caído | Análisis estático: monto calculado desde BD |

---

## 10. Hallazgos

| ID | Severidad | Hallazgo | Riesgo | Módulo / Archivo | Corrección |
|---|---|---|---|---|---|
| F01 | CRÍTICO | Backend Render no responde HTTP | Sistema completamente no disponible | Render service | Revisar logs de deploy en dashboard Render |
| F02 | CRÍTICO | `FLOW_CONFIRM_URL` sin configurar en Render | Todos los pagos quedan en `pendiente` permanentemente | `render.yaml`, Render dashboard | Configurar en Render: `https://team-mercenarios.onrender.com/api/v1/public/pagos/confirmar/` |
| F03 | CRÍTICO | `FLOW_RETURN_URL` sin configurar en Render | Usuario redirigido a `localhost` tras pagar | `render.yaml`, Render dashboard | Configurar en Render: `https://mercenarios.cl/portal/pago-resultado/` |
| F04 | CRÍTICO | `frontend/.env.production` apuntaba a PythonAnywhere | Frontend producción llama backend incorrecto | `frontend/.env.production` | **CORREGIDO** — cambiado a URL de Render |
| F05 | CRÍTICO | Webhook HMAC bypasseable con `FLOW_SECRET_KEY` vacío | Fraude: marcar cuotas como pagadas sin pagar | `apps/pagos/services.py:100-102` | **CORREGIDO** — ahora lanza excepción |
| F06 | ALTO | BD PostgreSQL free expira en 90 días | Pérdida total de datos de producción | Render PostgreSQL free | Upgrade a plan Starter ($7/mes) antes de pagos reales |
| F07 | ALTO | `FLOW_API_KEY` y `FLOW_SECRET_KEY` sin configurar | Modo mock activo — pagos no se procesan realmente | Render dashboard | Configurar con credenciales reales de Flow |
| F08 | ALTO | Clave `Mercenarios2026!` hardcodeada en código y git | Cualquier persona con acceso al repo conoce la clave de todos | `crear_usuarios_jugadores.py` | Flujo de activación de cuenta con clave temporal única |
| F09 | ALTO | `SECRET_KEY` con fallback inseguro hardcodeado | Si variable se pierde, signing de tokens inseguro | `settings.py:8` | Eliminar `default=` para fallo explícito |
| F10 | ALTO | Cero tests automatizados para pagos | Regresiones no detectadas | `apps/pagos/tests.py` (inexistente) | Crear tests mínimos para webhook y crear_pago |
| F11 | ALTO | Render free tier: cold start 30-60s | Webhooks de Flow pueden expirar durante cold start | Render configuración | Upgrade a Starter para eliminar cold start |
| F12 | MEDIO | `crear_pago` sin `transaction.atomic` + `select_for_update` | Race condition: dos pagos simultáneos crean PagoOnline duplicado | `apps/pagos/views.py:45-66` | Envolver bloque en `with transaction.atomic()` |
| F13 | MEDIO | `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` no activados | Cookies transmisibles en HTTP | `settings.py` | Activar en bloque `if not DEBUG:` |
| F14 | MEDIO | Dos implementaciones de pantalla de resultado de pago | Comportamiento inconsistente según `FLOW_RETURN_URL` | `PagoResultado.jsx` + `pago_retorno_html` | Definir cuál es la URL de retorno y eliminar ambigüedad |
| F15 | MEDIO | `sessionStorage` para `orden_id` se pierde si el usuario recarga | Pantalla de resultado muestra timeout sin información | `PagoResultado.jsx:14` | Pasar `orden_id` como query param en URL de retorno |
| F16 | MEDIO | `FLOW_API_URL` en sandbox | No se cobran pagos reales | `render.yaml:23` | Cambiar a `https://www.flow.cl/api` en producción |
| F17 | BAJO | `npm audit`: 2 high (form-data CRLF) + 1 moderate (esbuild) | CRLF injection en FormData (riesgo bajo en este proyecto) | `frontend/package.json` | `npm audit fix` |
| F18 | BAJO | `SECURE_HSTS_SECONDS`, `SECURE_SSL_REDIRECT` no configurados | Sin HSTS, usuarios pueden acceder por HTTP | `settings.py` | Activar en bloque `if not DEBUG:` |
| F19 | BAJO | `FLOW_PORTAL_URL` apunta a `localhost` en `render.yaml` | URL incorrecta para redireccionamiento post-pago | `render.yaml` | Cambiar a `https://mercenarios.cl/portal` |

---

## 11. Correcciones realizadas

| Archivo | Corrección |
|---|---|
| `frontend/.env.production` | `VITE_API_BASE_URL` cambiado de PythonAnywhere a `https://team-mercenarios.onrender.com/api/v1` |
| `backend/apps/pagos/services.py:100-102` | `verificar_firma_webhook` ahora lanza `ValueError` si `FLOW_SECRET_KEY` está vacío (antes retornaba `True` = bypass total) |

---

## 12. Correcciones pendientes

### Obligatorias antes de activar pagos en producción

1. **[F01]** Diagnosticar y corregir el error de startup en Render (revisar logs del último deploy)
2. **[F02]** Configurar en Render dashboard: `FLOW_CONFIRM_URL=https://team-mercenarios.onrender.com/api/v1/public/pagos/confirmar/`
3. **[F03]** Configurar en Render dashboard: `FLOW_RETURN_URL=https://mercenarios.cl/portal/pago-resultado/`
4. **[F07]** Configurar en Render dashboard: `FLOW_API_KEY` y `FLOW_SECRET_KEY` con credenciales reales de Flow
5. **[F08]** Resolver las claves compartidas antes de que integrantes usen el sistema
6. **[F12]** Envolver `crear_pago` en `transaction.atomic()` con `select_for_update` en mensualidades

### Recomendadas

7. **[F06]** Upgrade a Render Starter ($7/mes) — PostgreSQL expira en 90 días
8. **[F11]** Upgrade a Render Starter — eliminar cold start que afecta webhooks
9. **[F09]** Eliminar `default=` en `SECRET_KEY` para fallo explícito
10. **[F13/F18]** Activar `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SECURE_HSTS_SECONDS`, `SECURE_SSL_REDIRECT` en `settings.py`
11. **[F10]** Escribir tests mínimos para webhook (firma válida/inválida, idempotencia)
12. **[F15]** Pasar `orden_id` como query param en URL de retorno de Flow
13. **[F17]** Ejecutar `npm audit fix` en frontend
14. **[F19]** Cambiar `FLOW_PORTAL_URL` a `https://mercenarios.cl/portal` en Render

### Mejoras futuras

15. **[F14]** Consolidar las dos pantallas de resultado (React + Django HTML) en una sola
16. Implementar flujo de activación de cuenta para integrantes (en lugar de clave compartida)
17. Configurar alertas de logs en Render para errores de pago
18. Documentar procedimiento de respaldo y restauración de PostgreSQL
19. Agregar `FLOW_PORTAL_URL` y `FLOW_CONFIRM_URL` al `render.yaml` para que el equipo no dependa solo del dashboard

---

## 13. Variables de entorno requeridas

Las siguientes variables deben estar configuradas en **Render → Environment**. Nunca deben aparecer en código ni en git.

```
SECRET_KEY
DEBUG
DATABASE_URL
ALLOWED_HOSTS
CORS_ALLOWED_ORIGINS
CSRF_TRUSTED_ORIGINS
FLOW_API_KEY
FLOW_SECRET_KEY
FLOW_API_URL
FLOW_RETURN_URL
FLOW_CONFIRM_URL
FLOW_PORTAL_URL
```

---

## 14. Procedimiento de despliegue

### Backend (Render)

```bash
# 1. Asegurarse de que todas las variables de entorno estén configuradas en Render dashboard

# 2. Push a main dispara auto-deploy
git push origin main

# Render ejecuta automáticamente:
# buildCommand: cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
# startCommand: cd backend && gunicorn team_mercenarios.wsgi:application --bind 0.0.0.0:$PORT --workers 2

# 3. Primera vez (BD vacía): ejecutar desde Render Shell:
python manage.py crear_admin --username=admin --password=CLAVE_SEGURA_AQUI
python manage.py cargar_datos_iniciales
python manage.py crear_usuarios_jugadores  # SOLO en setup inicial

# 4. Verificar health:
curl https://team-mercenarios.onrender.com/api/v1/public/stats/
```

### Frontend (Webuzo / administrable.cl)

```bash
# 1. En la máquina local (Windows):
cd frontend
npm run build
# Produce: frontend/dist/

# 2. Subir contenido de frontend/dist/ al File Manager de Webuzo
# Destino: public_html/
# Reemplazar todos los archivos existentes

# 3. Verificar en https://mercenarios.cl
```

---

## 15. Plan de rollback

### Si el backend falla en producción:

```bash
# 1. Identificar el commit anterior estable
git log --oneline -10

# 2. Crear rama de rollback
git checkout -b rollback/YYYY-MM-DD <commit-hash>
git push origin rollback/YYYY-MM-DD

# 3. En Render: cambiar la rama del servicio a rollback/YYYY-MM-DD
# Render → Settings → Branch → seleccionar la rama de rollback

# 4. Manual Deploy desde el dashboard de Render
```

### Si la BD tiene datos corruptos:

```bash
# Render Shell:
# NO hay respaldo automático en plan free — esta es una limitación crítica
# En plan Starter: Render hace backups automáticos diarios
# Para restaurar: Render Dashboard → PostgreSQL → Backups → Restore
```

### Si Flow no confirma pagos:

```bash
# Render Shell:
python manage.py shell
# Consultar estado directamente a Flow:
from apps.pagos.services import verificar_pago
verificar_pago('TOKEN_DEL_PAGO')
# Si status=2, marcar manualmente:
from apps.pagos.models import PagoOnline
pago = PagoOnline.objects.get(token_flow='TOKEN_DEL_PAGO')
# Seguir el flujo manual de conciliación
```

---

## 16. Prueba manual final (sandbox)

Ejecutar ANTES de habilitar pagos reales con integrantes:

1. [ ] Acceder a `https://mercenarios.cl/login` — verificar que carga correctamente
2. [ ] Ingresar con un usuario de rol `player` (ej. `corvo` / `Mercenarios2026!`)
3. [ ] Verificar que redirige al portal (`/portal`) y NO al panel admin
4. [ ] Navegar a "Mis Cuotas" — verificar que muestra cuotas pendientes con montos correctos
5. [ ] Seleccionar 1 cuota y hacer clic en "Pagar"
6. [ ] Verificar que el botón no permite doble clic
7. [ ] Verificar redirección a `sandbox.flow.cl` (o `www.flow.cl` en producción)
8. [ ] Completar el pago de prueba con datos de sandbox de Flow
9. [ ] Verificar que Flow redirige de vuelta a `https://mercenarios.cl/portal/pago-resultado/`
10. [ ] Verificar que la pantalla muestra "PAGO CONFIRMADO" con el monto correcto
11. [ ] Navegar de vuelta a "Mis Cuotas" — verificar que la cuota aparece como `PAGADA`
12. [ ] Verificar en el panel admin (tesorero) que el pago aparece en el historial financiero
13. [ ] Intentar volver a pagar la misma cuota — verificar que está bloqueada
14. [ ] Verificar en Render logs que el webhook fue recibido y procesado (sin errores)
15. [ ] Intentar pagar la cuota de otro integrante modificando la URL — verificar error 403

---

## 17. Checklist de salida

- [ ] Base de datos PostgreSQL persistente (Render Starter — **pendiente, actual es free que expira**)
- [x] Migraciones aplicadas (buildCommand las ejecuta automáticamente)
- [ ] Datos conservados después del deploy (**parcial** — BD tiene solo 1 integrante, falta cargar fixture)
- [ ] Credenciales de Flow configuradas en Render (**pendiente** — no configuradas)
- [ ] Sandbox aprobado (**parcial** — probado en sesión anterior con localhost, falta validar en mercenarios.cl)
- [x] Webhook idempotente (código correcto: `select_for_update` implementado)
- [x] HMAC webhook validado (**corregido en esta auditoría** — antes bypasseable)
- [x] Permisos por integrante comprobados (análisis estático: `IsPropioIntegranteOrAdmin` correcto)
- [x] Montos calculados en backend (desde BD, no del cliente)
- [ ] Pruebas automatizadas aprobadas (**pendiente** — no existen tests para pagos)
- [x] Build frontend aprobado (`npm run build` exitoso)
- [x] HTTPS activo (SSL en Render y en Webuzo/Cloudflare)
- [ ] Logs revisados (**bloqueado** — backend no respondió durante auditoría)
- [ ] Respaldo disponible (**no** — plan free sin backups automáticos)
- [ ] Rollback documentado (sí — ver sección 15)
- [x] `FLOW_CONFIRM_URL` / `FLOW_RETURN_URL` documentadas (**falta configurar en Render**)
- [x] `frontend/.env.production` corregido (PythonAnywhere → Render)
- [x] Webhook HMAC bypass corregido

---

*Informe generado el 2026-06-24. Próxima revisión recomendada: tras resolver blockers F01–F07.*
