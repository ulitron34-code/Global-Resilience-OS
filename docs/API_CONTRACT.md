# Contrato API local

El esquema OpenAPI resumido está en `docs/openapi.local.json`.

## Operación

- `GET /api/health` — estado y versión del servicio.
- `GET /api/health/readiness` — persistencia, registro de fuentes y estado de conectores.
- `GET /api/compliance/readiness` — controles locales y dependencias externas; no es certificación legal.
- `GET /api/quality/report` — integridad de referencias, deduplicación y valores del estado local.
- `GET /api/ops/snapshot` — snapshot JSON del estado del tenant autenticado; con `AUTH_REQUIRED=true` requiere admin.
- `POST /api/ops/restore` — restaura un snapshot validado sólo dentro del tenant autenticado, preservando otras organizaciones; requiere admin en modo protegido.
- `POST /api/ops/control-plane/projection` — genera una proyección determinista y validada de notificaciones, webhooks, entregas y jobs para backfill hacia el esquema normalizado; requiere admin en modo protegido.
- `GET /api/ops/metrics` — solicitudes, errores, latencia por ruta (promedio,
  p50, p95 y máximo sobre una ventana local acotada) y memoria del proceso,
  acotadas a la organización del administrador autenticado; requiere admin en
  modo protegido.
- `GET /api/ops/sla` — estado de ventanas SLA por caso (`on_track`, `at_risk`, `overdue`, `closed`).
- `GET /api/ops/source-health` — salud de fuentes por latencia, estado del conector y frescura del último evento; aislada por tenant y protegida por rol en modo autenticado.
- `GET /api/metrics/overview` — exposición, alertas, casos y fuentes del tenant autenticado.

Los endpoints de alertas, casos y métricas aceptan `vertical` como filtro. Las alertas también aceptan `region`, `status` y `severity`. El frontend conserva este contexto en la barra superior y lo aplica a las vistas operativas.

## Inteligencia operativa

- `GET /api/alerts?status=open&severity=critical` — alertas filtradas.
- `PATCH /api/alerts/:id` — triage local de una alerta (`acknowledged`, `in_progress`, `resolved` o `suppressed`) con nota opcional y auditoría.
- `GET /api/alerts?q=SMW&limit=50&offset=0` — búsqueda y paginación; devuelve `x-total-count`, `x-limit` y `x-offset`.
- `POST /api/ingest/events` — ingesta de una señal normalizada; usa `externalId` para deduplicación.
- `GET /api/ingest/dead-letters?status=queued` — señales rechazadas conservadas para diagnóstico.
- `POST /api/ingest/dead-letters/:id/retry` — reintenta una señal fallida; admite `payload` corregido.
- `POST /api/alerts/:id/convert-to-case` — convierte una alerta en caso de forma idempotente.
- `GET /api/cases` — cola de casos.
- `GET /api/cases?q=Ormuz&status=open&priority=P1&owner=Risk&sort=sla_urgent&limit=50&offset=0` — búsqueda, filtros operativos, orden y paginación de casos con los mismos headers de conteo.
- `PATCH /api/cases/:id` — actualiza owner, status o validación humana.
- `GET /api/cases/:id/audit` — bitácora de cambios del caso.
- `GET /api/cases/:id/decision-package?format=json|markdown` — exporta el paquete auditable en JSON técnico o Markdown legible para comité/operador.
- `GET /api/pilots/package?format=json|markdown` — exporta el paquete consolidado de preparación de piloto.
- `GET /api/shares/:token?format=json|markdown` — consulta o descarga un paquete compartido de solo lectura.
- `GET /api/cases/:id/shares` — lista enlaces temporales de decisión sin exponer tokens.
- `POST /api/cases/:id/shares` — crea un enlace de solo lectura; entrega el token claro una sola vez.
- `POST /api/cases/:caseId/shares/:shareId/revoke` — revoca un enlace de decisión.
- `GET /api/shares/:token` — consulta pública controlada del paquete; requiere token válido y no usa caché.
- `GET /api/audit/export?entityId=RS-0827&format=json|csv` — exporta auditoría global o de una entidad.
- `GET /api/audit/integrity` — verifica la cadena hash local, entradas selladas e inconsistencias.
- `GET /api/scenarios` — escenarios guardados.
- `GET /api/sources/:id` — detalle de una fuente.
- `GET /api/models` — registro de modelos, versiones, supuestos y limitaciones.
- `GET /api/models/profiles?region=...&vertical=...` — perfil local de contexto regional/vertical, datos requeridos y decisión explícita de abstención productiva.
- `POST /api/pilots/value-case` — estima valor protegido y neto del primer año con supuestos explícitos; exige evidencia y no valida willingness-to-pay.
- `POST /api/scenarios` — crea un escenario validado.
- `GET /api/briefs/latest` — brief ejecutivo generado desde el estado operativo del tenant autenticado; abstiene si no existe escenario.

## Evento de ingesta

```json
{
  "externalId": "ais-2026-08-07-001",
  "sourceId": "ais-demo",
  "eventType": "ais_gap",
  "title": "AIS gap detectado",
  "severity": "high",
  "impactUsd": 310000,
  "location": "Estrecho de Ormuz",
  "payload": { "vesselCount": 12 }
}
```

En producción, este contrato será el punto de entrada común para AIS, cables, puertos, commodities y NLP geopolítico. Cada respuesta incluye `x-request-id`.

## Colaboración y operación local

- `GET /api/cases/:id/comments` y `POST /api/cases/:id/comments` — comentarios de un caso.
- `GET /api/webhooks` — destinos registrados; con `AUTH_REQUIRED=true` requiere admin.
- `POST /api/webhooks` — registra `{ "url": "https://...", "events": ["alert.created"] }`.
- `GET /api/webhooks/:id/deliveries` — entregas encoladas localmente; esta fase no hace llamadas externas.
- `POST /api/webhooks/:id/deliveries/:deliveryId/retry` — vuelve a encolar una entrega y aumenta su contador de intento.
- `POST /api/webhooks/deliveries/process-local` — procesa la outbox sin red y marca entregas como `simulated_success`; sirve para demo y pruebas, no sustituye un worker productivo.
- `GET /api/jobs` — historial de jobs locales.
- `POST /api/jobs/demo-ingest` — ejecuta dos señales demo, crea alertas y actualiza fuentes.
- `POST /api/jobs/sla-sweep` — revisa SLA local y genera notificaciones deduplicadas para casos en riesgo o vencidos.
- `GET /api/briefs/latest/export?format=json|csv` — exportación local del brief.

## Seguridad local

El endpoint `POST /api/webhooks/deliveries/process` ejecuta el worker HTTP local. Con `dryRun: false` realiza POST firmado con timeout, backoff exponencial y paso a dead-letter después de cinco intentos.

`POST /api/auth/logout` revoca la sesión mediante su identificador de token; borrar el token del navegador ya no es la única protección local.

`GET /api/health/readiness` agrega persistencia, registro de fuentes, calidad de datos, integridad de auditoría y salud/frescura de fuentes; devuelve `503` si alguno de esos gates falla.

## Impact Graph y Scenario-to-Action

- `GET /api/runtime/readiness` - valida modo, secrets, CORS, modo de datos y que las acciones externas estén desactivadas por defecto.
- `GET /api/data-catalog` y `GET /api/data-catalog/readiness` - catálogo de fuentes, cobertura, SLA de frescura y estado de licenciamiento.
- `GET /api/connectors` y `GET /api/connectors/:id` - registro de adaptadores disponibles y sus campos esperados; todos permanecen en `dry_run_only` hasta integrar proveedores.
- `POST /api/ingest/validate` - valida el envelope común sin persistirlo.

- `GET /api/graph?cableId=seamewe3&verticalId=petroleo` - devuelve nodos y aristas explicables con confianza, procedencia y vigencia local.
- `GET /api/graph/paths?cableId=seamewe3&verticalId=petroleo` - devuelve la trayectoria entre infraestructura, chokepoints y vertical.
- `GET /api/playbooks` y `GET /api/playbooks/:id` - catálogo de playbooks con owner, SLA, triggers y pasos.
- `POST /api/action-plans/preview` - calcula pérdida por espera, costo de mitigación, valor protegido, ROI, supuestos y requisitos de evidencia. El estado inicial siempre es `draft_for_human_approval`.
- `GET /api/action-plans` y `GET /api/action-plans/:id` - consulta planes guardados localmente.
- `POST /api/action-plans` - guarda un plan como artefacto local versionado.
- `PATCH /api/action-plans/:id` - actualiza estado de aprobación, owner u outcome.
- `GET /api/action-plans/timing` - expone tiempos locales de asignación y decisión a partir del historial de estados; no inventa tiempos de detección o explicación sin timestamps de fuente.
- Las transiciones de planes son controladas: `draft_for_human_approval` requiere aprobación humana explícita antes de `approved`; `completed` requiere `outcome` verificable.
- `GET /api/tenancy/context` - expone la organización activa y el límite local de aislamiento.
- `POST /api/entities/resolve` - normaliza y resuelve aliases locales de cables, verticales y chokepoints.

El grafo y los planes actuales son locales y demo. No ejecutan acciones externas ni prueban causalidad de mercado.

## Gobernanza local

- `GET /api/governance/provenance` — expone el linaje, clasificación, limitaciones y estado de licencia de fuentes y modelos locales, aislados por tenant.
- `GET /api/governance/retention` — genera una revisión de retención no destructiva; no elimina datos y deja la política legal para la fase productiva.
- `GET /api/models/validation` — ejecuta invariantes locales del motor y declara explícitamente si existe calibración histórica (actualmente no).
- `GET /api/models/calibration?modelId=...` — consulta métricas de error y fixtures registrados.
- `GET /api/models/calibration/benchmark?modelId=...` - compara el modelo contra baseline de media observada y se abstiene si faltan fixtures o no demuestra mejora.
- `POST /api/models/calibration/fixtures` — registra fixtures históricos validados por el operador; requiere `admin` o `risk_analyst` cuando la autenticación está activa.

Los webhooks locales generan un secreto HMAC de 256 bits. El secreto se entrega únicamente al crear o rotar (`POST /api/webhooks/:id/rotate-secret`), nunca en listados ni snapshots; cada entrega incluye firma, timestamp, delivery id, versión de firma y hash SHA-256 del cuerpo.

Con `AUTH_REQUIRED=true`, las mutaciones exigen `Authorization: Bearer <token>` y roles `admin` o `risk_analyst`; registrar webhooks exige `admin`. El backend asigna `x-request-id`, expone `x-api-version`, aplica headers HTTP de seguridad, restringe CORS si se configura `CORS_ORIGIN`, aplica un límite básico por IP y devuelve errores con `requestId`. La persistencia local está en `backend/storage/state.json` y debe sustituirse por Supabase antes de producción.
El scorecard también expone `timeToDetectionMinutes` y
`timeToExplanationMinutes` cuando existen timestamps explícitos y comparables;
sin esa evidencia ambos valores permanecen en `null`.
