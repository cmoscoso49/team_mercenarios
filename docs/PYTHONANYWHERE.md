# Deploy Backend en PythonAnywhere (Free)

## Requisitos previos
- Cuenta creada en pythonanywhere.com (gratis)
- Repositorio en GitHub: github.com/cmoscoso49/team_mercenarios
- Tu usuario de PythonAnywhere: reemplaza `TU_USUARIO` en todos los comandos

---

## PASO 1 — Crear Web App en PythonAnywhere

1. Dashboard → **Web** → **Add a new web app**
2. Elegir dominio: `TU_USUARIO.pythonanywhere.com` → **Next**
3. Seleccionar **Manual configuration** (no Django automático)
4. Python version: **3.12** → **Next**
5. Guardar — se crea la web app pero sin código todavía

---

## PASO 2 — Clonar repositorio (Bash console)

Dashboard → **Consoles** → **Bash**

```bash
cd ~
git clone https://github.com/cmoscoso49/team_mercenarios.git
```

Resultado: `/home/TU_USUARIO/team_mercenarios/`

---

## PASO 3 — Crear entorno virtual

```bash
cd ~/team_mercenarios/backend
python3.12 -m venv venv
source venv/bin/activate
```

---

## PASO 4 — Instalar dependencias

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Paquetes instalados: Django, DRF, simplejwt, cors-headers, Pillow, python-decouple, openpyxl, whitenoise, django-filter

---

## PASO 5 — Crear archivo .env

```bash
nano ~/team_mercenarios/backend/.env
```

Contenido (reemplaza los valores):

```
SECRET_KEY=genera-una-clave-aqui-minimo-50-caracteres-random
DEBUG=False
ALLOWED_HOSTS=TU_USUARIO.pythonanywhere.com
CORS_ALLOWED_ORIGINS=https://mercenarios.cl,https://www.mercenarios.cl
CSRF_TRUSTED_ORIGINS=https://TU_USUARIO.pythonanywhere.com,https://mercenarios.cl
```

Para generar SECRET_KEY en Python:
```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Guardar: `Ctrl+O` → `Enter` → `Ctrl+X`

---

## PASO 6 — Subir base de datos local (opcional pero recomendado)

Si quieres conservar los datos locales (52 integrantes, 1091 mensualidades, etc.):

**Desde tu PC local (PowerShell):**
```powershell
# Subir via SCP (necesitas contraseña de PythonAnywhere)
scp "c:\Users\cmoscoso\OneDrive - INACAP\Descargas\2026\Proyectos Python\team_mercenarios\backend\db.sqlite3" TU_USUARIO@ssh.pythonanywhere.com:~/team_mercenarios/backend/db.sqlite3
```

Si no tienes SCP configurado, alternativa desde la Bash console de PythonAnywhere:
```bash
# Subir el archivo via File Manager del dashboard de PythonAnywhere
# Dashboard → Files → Navegar a /home/TU_USUARIO/team_mercenarios/backend/
# Subir db.sqlite3 desde tu PC
```

---

## PASO 7 — Migrate y collectstatic

```bash
cd ~/team_mercenarios/backend
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
```

Si subiste la BD local (PASO 6), `migrate` solo aplicará migraciones pendientes y no tocará los datos existentes.

---

## PASO 8 — Verificar

```bash
python manage.py check --deploy
python manage.py shell -c "from apps.integrantes.models import Integrante; print('Integrantes:', Integrante.objects.count())"
```

Resultado esperado: `Integrantes: 52`

---

## PASO 9 — Configurar WSGI

Dashboard → **Web** → tu web app → sección **Code** → clic en el link del archivo WSGI (algo como `/var/www/TU_USUARIO_pythonanywhere_com_wsgi.py`)

Reemplazar todo el contenido con:

```python
import sys
import os

path = '/home/TU_USUARIO/team_mercenarios/backend'
if path not in sys.path:
    sys.path.insert(0, path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'team_mercenarios.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

Guardar.

---

## PASO 10 — Configurar Virtualenv

Dashboard → **Web** → tu web app → sección **Virtualenv**

Escribir la ruta completa:
```
/home/TU_USUARIO/team_mercenarios/backend/venv
```

---

## PASO 11 — Configurar Static Files

Dashboard → **Web** → tu web app → sección **Static files**

| URL | Directory |
|-----|-----------|
| `/static/` | `/home/TU_USUARIO/team_mercenarios/backend/staticfiles` |
| `/media/` | `/home/TU_USUARIO/team_mercenarios/backend/media` |

---

## PASO 12 — Reload y verificar

Dashboard → **Web** → botón verde **Reload TU_USUARIO.pythonanywhere.com**

Abrir en el navegador:
- `https://TU_USUARIO.pythonanywhere.com/api/v1/public/stats/` → debe retornar JSON con integrantes_activos
- `https://TU_USUARIO.pythonanywhere.com/api/v1/public/noticias/` → debe retornar array JSON

---

## Actualizar código (deploys futuros)

```bash
cd ~/team_mercenarios
git pull origin main
cd backend
source venv/bin/activate
pip install -r requirements.txt   # solo si hay nuevas dependencias
python manage.py migrate           # solo si hay nuevas migraciones
python manage.py collectstatic --noinput
```

Luego: Dashboard → **Web** → **Reload**

---

## Backup de base de datos

```bash
# Crear backup con fecha
cp ~/team_mercenarios/backend/db.sqlite3 ~/backups/db_$(date +%Y%m%d).sqlite3

# Ver backups
ls ~/backups/
```

PythonAnywhere también ofrece "Backups" en el dashboard (opción de cuenta).

---

## Createsuperuser (si necesitas acceso al admin Django)

```bash
cd ~/team_mercenarios/backend
source venv/bin/activate
python manage.py createsuperuser
```

Acceder en: `https://TU_USUARIO.pythonanywhere.com/admin/`
