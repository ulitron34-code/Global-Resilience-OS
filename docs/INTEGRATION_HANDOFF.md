# Integration handoff

Este documento concentra el trabajo que se ejecutará cuando estén disponibles
GitHub, Supabase, Vercel y los proveedores de datos. Las integraciones no se
activan desde el entorno local.

## Orden de ejecución

1. Crear repositorio privado y copiar el proyecto sin `node_modules`, `dist`,
   `backend/storage/state.json` ni `backend/storage/action-plans.json`. Los
   archivos `.env.example` sí deben conservarse; los `.env` reales nunca.
   El workflow `.github/workflows/ci.yml` ya queda preparado para ejecutar
   pruebas backend, lint y build frontend en Node 20 y 22.
2. Ejecutar `docs/supabase/001_initial_schema.sql` y después
   `docs/supabase/002_enterprise_extensions.sql` en un proyecto nuevo.
3. Crear organización inicial, perfil administrador y claims JWT con
   `organization_id`.
4. Implementar el adaptador de persistencia Supabase conservando los contratos
   de `docs/API_CONTRACT.md`.
5. Configurar `APP_MODE=production`, `DATA_MODE=licensed`,
   `AUTH_REQUIRED=true`, `AUTH_SECRET` seguro, CORS explícito y
   `ALLOW_EXTERNAL_ACTIONS=false`.
6. Conectar primero una fuente autorizada de cables y una fuente marítima; no
   activar scores materiales hasta verificar licencia, frescura y cobertura.
7. Configurar frontend con `VITE_BACKEND_URL` y backend Node separado.
8. Ejecutar la prueba de humo completa y comprobar aislamiento entre dos
   organizaciones antes de aceptar datos de clientes.

## Contrato local ampliado

El contrato OpenAPI local incluye tambien:

- `/api/tenancy/context` para el contexto de organizacion activa.
- `/api/action-plans/metrics` y `/api/action-plans/{id}/outcome` para el feedback loop.
- `/api/regulatory/frameworks`, `/api/regulatory/frameworks/{id}` y `/api/regulatory/evidence-map`.
- `/api/recovery/profile` para contrafactuales de recuperacion.

Estas rutas siguen siendo locales y no implican certificacion, cumplimiento legal,
datos licenciados ni ejecucion de acciones externas.

## Gates de salida

- CI ejecuta backend tests, frontend lint y build.
- RLS impide leer o modificar datos de otra organización.
- Runtime readiness pasa en staging y producción.
- Un evento autorizado llega con procedencia y licencia.
- El modelo conserva incertidumbre y abstención cuando faltan fixtures.
- Backups y restauración fueron probados.
- Un caso real genera alerta, caso, plan, aprobación, outcome y auditoría.
