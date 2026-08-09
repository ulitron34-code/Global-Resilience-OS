# Data Requirements Document — Global Resilience OS

## Regla de oro

Un dato que cambie un score o una recomendación debe tener identidad, timestamp,
fuente, licencia, cobertura, freshness, transformación y regla de calidad. Los
seeds actuales son demostrativos y no deben mezclarse silenciosamente con datos
productivos.

## Dominios mínimos del wedge inicial

| Dominio | Entidades | Requisitos mínimos |
|---|---|---|
| Infraestructura digital | cables, landing stations, rutas, capacidad | identidad estable, geometría autorizada, estado y vigencia |
| Marítimo | buques, puertos, chokepoints, rutas | posición/evento con timestamp, cobertura y licencia AIS |
| Comercio | producto, flujo, origen/destino, volumen | unidad, moneda, periodo, metodología y permiso de uso |
| Cliente | activos, proveedores, procesos, regiones | tenant, criticidad, owner, dependencia y evidencia de alta |
| Eventos | interrupciones, degradaciones, reparaciones | externalId, tipo, severidad, impacto observado y resultado real |

## Contrato de calidad

Cada pipeline debe ser idempotente por `sourceId + externalId`, rechazar fechas
imposibles, conservar el payload original y enviar errores a DLQ. Readiness debe
degradarse si una fuente material está fuera de su SLA, sin inventar datos para
completar la vista.

## Historial para calibración

El benchmark objetivo requiere al menos 3–5 eventos históricos con fecha de
inicio, duración, activo afectado, rutas alternativas, impacto observado y
resultado de recuperación. Si un evento carece de evidencia suficiente, se
registra como fixture incompleto y el modelo debe abstenerse.

## Licencias y uso

El registro de catálogo debe conservar proveedor, contrato, territorio, campos
permitidos, retención, redistribución, atribución y contacto de renovación. No
se importará un feed externo hasta completar esa ficha y aprobar el uso en el
tenant correspondiente.

El catálogo local ya expone esa ficha como license y el gate material exige que
esté completa antes de permitir una recomendación; los seeds demo mantienen
deliberadamente la ficha incompleta y por eso el sistema se abstiene.

El endpoint `POST /api/data-catalog/intake-preview` y el panel Operations
permiten validar una nueva fuente sin persistirla. El preview exige identidad,
cobertura no ilustrativa, licencia activa, retención, dependencias y ficha
contractual completa; un resultado positivo sólo autoriza continuar en staging.

Una revisión aprobada localmente queda en la cola de `intake-reviews` con
`activationStatus: blocked_external`. La revisión humana y su nota quedan
auditadas, pero el flujo no activa fuentes, no modifica el catálogo productivo y
no sustituye la aprobación legal o contractual.
