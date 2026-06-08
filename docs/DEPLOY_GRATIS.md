# Deploy Gratuito — Team Mercenarios

## Arquitectura

```
[Usuario] → https://mercenarios.cl  → Cloudflare Pages (frontend React)
[Usuario] → https://mercenarios.pythonanywhere.com/api/v1 → PythonAnywhere (backend Django)
```

> **Nota sobre api.mercenarios.cl:**
> PythonAnywhere **free tier no soporta custom domains**.
> La API queda en `mercenarios.pythonanywhere.com/api/v1`.
> Para usar `api.mercenarios.cl` necesitas:
> - Plan Hacker de PythonAnywhere (~$5 USD/mes), O
> - Cloudflare Worker que actúe como proxy (ver sección avanzada abajo)

---

## Componentes

| Componente | Servicio | Plan | Costo |
|-----------|----------|------|-------|
| Frontend React | Cloudflare Pages | Free | $0 |
| Backend Django | PythonAnywhere | Free | $0 |
| Base de datos | SQLite (en PythonAnywhere) | Free | $0 |
| Dominio | mercenarios.cl (ya comprado) | — | $0 |
| SSL | Let's Encrypt (automático) | Free | $0 |

---

## Guías detalladas

- [PYTHONANYWHERE.md](PYTHONANYWHERE.md) — deploy backend Django paso a paso
- [CLOUDFLARE_PAGES.md](CLOUDFLARE_PAGES.md) — deploy frontend React paso a paso

---

## Variables de entorno requeridas

### PythonAnywhere (`backend/.env`)
```
SECRET_KEY=clave-aleatoria-50-chars
DEBUG=False
ALLOWED_HOSTS=mercenarios.pythonanywhere.com
CORS_ALLOWED_ORIGINS=https://mercenarios.cl,https://www.mercenarios.cl
CSRF_TRUSTED_ORIGINS=https://mercenarios.pythonanywhere.com,https://mercenarios.cl
```

### Cloudflare Pages (Settings → Environment Variables)
```
VITE_API_BASE_URL=https://mercenarios.pythonanywhere.com/api/v1
```

---

## Opción avanzada: api.mercenarios.cl con Cloudflare Worker (gratis)

Si quieres que la API responda en `api.mercenarios.cl` sin pagar PythonAnywhere Hacker:

1. En Cloudflare DNS: agregar `api` CNAME → `mercenarios.pythonanywhere.com` (proxy ON)
2. Crear un Cloudflare Worker con este código:

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url)
    url.hostname = 'mercenarios.pythonanywhere.com'
    const newRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    })
    return fetch(newRequest)
  }
}
```

3. Asignar ruta: `api.mercenarios.cl/*` → Worker
4. En PythonAnywhere, agregar a ALLOWED_HOSTS: `api.mercenarios.cl`
5. Cambiar `VITE_API_BASE_URL=https://api.mercenarios.cl/api/v1` en Cloudflare Pages

Cloudflare Workers free: 100.000 requests/día — más que suficiente para un club.

---

## Rollback

- Frontend: Cloudflare Pages guarda historial de deploys → revertir en 1 clic
- Backend: `git checkout` a commit anterior + reload en PythonAnywhere
- BD: mantener backup de `db.sqlite3` antes de cada cambio (ver PYTHONANYWHERE.md)
