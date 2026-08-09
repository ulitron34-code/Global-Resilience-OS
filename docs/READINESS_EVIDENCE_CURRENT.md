# Evidencia actual de readiness

Fecha de corte: 2026-08-08.

## Verificaciones ejecutadas

- Backend: `npm.cmd test` — 51 pruebas correctas.
- Frontend: `npm.cmd run lint` — correcto.
- OpenAPI: 139 rutas auditadas, 139 documentadas, sin duplicados.
- Readiness empresarial: bloquea cuando faltan las evidencias explícitas de
  esquema y release; pasa esos dos checks únicamente con sus flags en `true`.
- Configuración de ejemplo: los flags `LOCAL_SCHEMA_AUDIT_VERIFIED` y
  `LOCAL_RELEASE_GATE_VERIFIED` quedan documentados en
  `backend/.env.example` con valor seguro `false`.
- El arnés `npm.cmd run verify` inyecta ambos flags únicamente en el proceso
  aislado del smoke test, para validar el handoff después de reunir la
  evidencia local; no modifica el entorno persistente.

## Pendiente de repetir fuera del entorno restringido

El build frontend debe repetirse en una PowerShell normal. En este entorno
local, esbuild devuelve `Acceso denegado` al resolver el directorio del
proyecto; por eso no se marca artificialmente como PASS.

Los flags de evidencia son controles de release, no un sustituto de ejecutar
las auditorías. En Render no deben dejarse permanentemente en `true`.
