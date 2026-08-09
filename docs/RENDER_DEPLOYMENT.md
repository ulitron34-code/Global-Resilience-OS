# Render: backend de staging

El repositorio incluye `render.yaml` para crear el backend como un Web Service
de Render. El Blueprint configura únicamente un entorno de staging seguro:

- raíz del servicio: `backend`;
- instalación: `npm ci`;
- arranque: `npm start`;
- healthcheck: `/api/health`;
- `AUTH_REQUIRED=true`;
- `ALLOW_EXTERNAL_ACTIONS=false`;
- `APP_MODE=staging` y `DATA_MODE=illustrative` hasta conectar datos y
  persistencia autorizados.

## Variables que Render debe recibir como secretos/configuración

- `AUTH_SECRET`: mínimo 32 caracteres, generado fuera del repositorio;
- `CORS_ORIGIN`: origen HTTPS exacto del frontend de Vercel, sin comodines;
- `DATA_FILE`: sólo sirve como almacenamiento efímero de staging y no sustituye
  Supabase/Postgres.

Después de crear el servicio, comprobar:

```text
GET https://<render-host>/api/health
GET https://<render-host>/api/health/readiness
```

La URL de Render se configura después como `VITE_BACKEND_URL` en Vercel. El
Blueprint no crea una base de datos ni habilita proveedores externos.
