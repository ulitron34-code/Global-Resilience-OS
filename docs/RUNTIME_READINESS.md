# Runtime and Data Readiness

## Endpoints

- `/api/runtime/readiness` valida modo, secrets, CORS, modo de datos y que las acciones externas estén desactivadas por defecto.
- `/api/data-catalog` expone las fuentes, cobertura, clase de fuente, SLA y estado de licencia.
- `/api/data-catalog/readiness` indica si las fuentes necesarias pueden usarse para scores materiales.

## Regla de producción

Producción debe iniciar con `APP_MODE=production`, `AUTH_REQUIRED=true`, un
`AUTH_SECRET` de al menos 32 caracteres, `CORS_ORIGIN` explícito y
`DATA_MODE` distinto de `illustrative`. Los seed records permanecen separados
hasta que exista una fuente autorizada y validada.

En `APP_MODE=production` el login de usuarios demo queda bloqueado y el listado
de usuarios demo no se expone. La autenticación productiva debe llegar desde el
proveedor de identidad externo previsto para la fase de integración.
