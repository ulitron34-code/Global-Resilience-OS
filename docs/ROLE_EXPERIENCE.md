# Role experience local

## Brief por audiencia

`GET /api/briefs/latest` entrega el brief ejecutivo por defecto. El mismo
artefacto puede solicitarse con `?audience=operator` para incluir casos abiertos,
alertas principales, aprobaciones pendientes y requisitos de evidencia. Ambas
vistas comparten el mismo escenario y cadena de evidencia; solo cambia el nivel
de detalle de presentaciÃ³n.

## Viewer

Puede consultar Command Center, red, escenarios, casos y brief. No se muestra
Operations porque contiene acciones operativas, jobs, webhooks y controles que
requieren un rol de operación.

## Risk analyst

Puede consultar todos los módulos locales y trabajar con casos, comentarios,
playbooks, planes de acción y evidencia regulatoria. Las mutaciones siguen
requiriendo autenticación y quedan sujetas a aprobación humana.

## Admin

Tiene la misma experiencia operativa del risk analyst más los controles de
administración, webhooks, snapshots, restore y usuarios protegidos por RBAC.

La navegación frontend es sólo una capa de experiencia. La autorización real
continúa en el backend mediante `AUTH_REQUIRED=true`, roles y aislamiento por
organización; ocultar un módulo no se considera un control de seguridad.
