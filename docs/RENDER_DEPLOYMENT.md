# Render: backend de staging

El repositorio incluye `render.yaml` para crear el backend como un Web Service
de Render. El Blueprint configura un entorno de staging seguro:

- raíz del servicio: `backend`;
- instalación: `npm ci`;
- arranque: `npm start`;
- healthcheck: `/api/health`;
- `AUTH_REQUIRED=true`;
- `ALLOW_EXTERNAL_ACTIONS=false`;
- `APP_MODE=staging` y `DATA_MODE=illustrative` hasta conectar datos y
  persistencia autorizados;
- `PERSISTENCE_MODE=supabase` con organización explícita y clave privada
  gestionada por Render.

## Variables de Render

El Blueprint deja como secretos no versionados `AUTH_SECRET`, `CORS_ORIGIN` y
`SUPABASE_SERVICE_ROLE_KEY`. También declara `SUPABASE_URL`,
`SUPABASE_ORGANIZATION_SLUG` y `SUPABASE_TIMEOUT_MS`. La clave de servicio no
debe colocarse en Vercel ni exponerse al navegador.

`DATA_FILE` permanece como fallback efímero de staging y no sustituye
Supabase/Postgres.

Después de crear o actualizar el servicio, comprobar:

```text
GET https://<render-host>/api/health
GET https://<render-host>/api/health/readiness
GET https://<render-host>/api/runtime/supabase/persistence
```

La URL de Render se configura después como `VITE_BACKEND_URL` en Vercel. El
Blueprint no crea una base de datos ni habilita proveedores externos.
