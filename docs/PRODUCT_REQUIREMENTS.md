# Product Requirements - Impact Graph y Scenario-to-Action

## Propósito

Convertir Global Resilience OS de una demo de simulación en un sistema local de decisión explicable. Este bloque no introduce datos de mercado ni predice eventos reales: establece el contrato de producto para conectar datos, modelos, evidencia y acciones cuando lleguen las integraciones externas.

## Capacidades implementadas

- `GET /api/graph`: nodos y relaciones de cables, chokepoints y verticales.
- `GET /api/graph/paths`: trayectoria explicable entre un cable y una vertical.
- `GET /api/playbooks`: playbooks operativos versionados.
- `GET /api/playbooks/:id`: detalle de un playbook.
- `POST /api/action-plans/preview`: plan económico y auditable en borrador.
- `GET /api/action-plans` y `GET /api/action-plans/:id`: consulta planes guardados.
- `POST /api/action-plans`: persiste un plan local versionado.
- `PATCH /api/action-plans/:id`: actualiza aprobación, owner u outcome.

## Reglas de producto

- El runtime productivo no puede arrancar como `demo` ni con datos `illustrative`.
- Las acciones externas permanecen desactivadas hasta que exista un worker y aprobación formal.
- Cada fuente mantiene estado de licencia y cobertura antes de ser considerada para un score material.

1. Toda relación tiene tipo, confianza, procedencia y vigencia.
2. Una relación demo no se presenta como causalidad validada.
3. Un plan siempre empieza en `draft_for_human_approval`.
4. Ningún endpoint local ejecuta una acción externa.
5. La recomendación muestra pérdida por espera, costo de mitigación, valor protegido, confianza y supuestos.
6. Si no hay evidencia suficiente, el motor debe poder abstenerse.

## Criterios de aceptación

- El grafo contiene nodos únicos y relaciones con esquema estable.
- Un cable y una vertical existentes producen una trayectoria explicable.
- Un cable o vertical desconocidos producen `404`.
- El plan calcula valor neto y ROI sin aceptar valores negativos.
- Los playbooks contienen responsable, SLA, pasos y requisitos de evidencia.
- Se conservan los gates existentes de pruebas, lint, build y smoke.

## Siguiente extensión

Reemplazar los seed records por entidades temporales con `sourceId`, `licenseRef`, `observedAt`, `validFrom`, `validTo`, `confidence` y `reviewStatus`. Después conectar los nodos a Supabase/Postgres y añadir RLS.
