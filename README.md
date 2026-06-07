# Team Mercenarios — Sistema de Gestión

Sistema web integral para el club de airsoft **Team Mercenarios**.

## Tecnologías

- **Backend**: Python 3.10+ · Django 4.2 · Django REST Framework · SQLite
- **Frontend**: React 18 · Vite · React Router v6 · Axios
- **Auth**: JWT (djangorestframework-simplejwt)

---

## Instalación y ejecución

### Backend

```bash
cd backend

# 1. Crear entorno virtual
python -m venv venv

# 2. Activar entorno (Windows)
venv\Scripts\activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Aplicar migraciones
python manage.py migrate

# 5. Crear superusuario
python manage.py createsuperuser

# 6. (Opcional) Cargar datos de prueba
python manage.py seed_data

# 7. Iniciar servidor
python manage.py runserver
```

El backend queda disponible en: **http://localhost:8000**

Admin Django: **http://localhost:8000/admin**

---

### Frontend

```bash
cd frontend

# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev
```

El frontend queda disponible en: **http://localhost:5173**

---

## Módulos del sistema

| Módulo | Descripción |
|--------|-------------|
| Dashboard | Resumen general: saldo, eventos, noticias, movimientos |
| Integrantes | CRUD de integrantes con ficha individual |
| Finanzas | Movimientos, mensualidades y deudas |
| Eventos | Calendario y registro de eventos del team |
| Participaciones | Registro de asistencia por evento/integrante |
| Noticias | Comunicados y noticias internas/públicas |
| Galería | Álbumes y fotos asociados a eventos |
| Reportes | Reportes financieros, de integrantes y participación |

---

## API

Base URL: `http://localhost:8000/api/v1/`

Autenticación: `Authorization: Bearer <access_token>`

Documentación de endpoints principales: ver `CLAUDE.md`

---

## Importación de datos Excel

Para migrar datos del Excel histórico:

1. Ir a `http://localhost:5173/finanzas`
2. O usar directamente: `POST /api/v1/importacion/excel/`
3. Tipos soportados: `integrantes`, `mensualidades`, `movimientos`, `conciliacion`

El sistema acepta archivos `.xlsx`, `.xls` y `.csv`.

---

## Seguridad

- JWT con expiración de 8 horas (refresh: 7 días)
- CORS configurado solo para localhost en desarrollo
- `.env` local (no subir al repositorio)
- Sin almacenamiento de credenciales bancarias
- Instagram y Coopeuch: solo mediante variables de entorno externas

---

## Estructura del proyecto

```
team_mercenarios/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── team_mercenarios/     # Configuración Django
│   └── apps/
│       ├── usuarios/         # Auth y permisos
│       ├── integrantes/      # Integrantes del team
│       ├── finanzas/         # Movimientos, mensualidades, deudas
│       ├── eventos/          # Eventos y participaciones
│       ├── noticias/         # Noticias y comunicados
│       ├── galeria/          # Fotos y álbumes
│       └── reportes/         # Reportes + comando seed_data
├── frontend/
│   ├── package.json
│   └── src/
│       ├── api/              # Clientes HTTP por módulo
│       ├── context/          # AuthContext
│       ├── components/       # Layout, Badge, StatCard
│       └── pages/            # Páginas por módulo
├── CLAUDE.md
├── PROJECT_CONTEXT.md
└── README.md
```
