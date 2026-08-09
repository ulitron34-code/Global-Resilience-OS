# Ejecución de los primeros 30 días

Este tablero convierte la sección “Primeros 30 días de ejecución” de
`GLOBALRESILIENCE_PLAN_MAESTRO.md` en tareas verificables. Las tareas que
requieren clientes, licencias o infraestructura externa permanecen abiertas y
no se consideran completadas por tener un fixture local.

## Días 1–5: foco y baseline

| Tarea | Evidencia local | Estado | Bloqueo externo |
|---|---|---|---|
| Congelar wedge inicial | `docs/COMMERCIAL_WEDGE.md` | Completada como hipótesis | Validación con prospectos |
| Separar demo, fixtures y productivo | `docs/DATA_CONTRACTS.md`, `backend/config/runtimeConfig.js` | Completada localmente | Fuente licenciada |
| PRD y DRD | `docs/PRODUCT_REQUIREMENTS.md`, `docs/DATA_REQUIREMENTS.md` | Completada | — |
| Definir 10 eventos históricos | `docs/PILOT_READINESS.md`, `docs/BACKTESTING.md` | Preparada | Eventos autorizados y revisados |

## Días 6–10: grafo, fuentes y modelo

| Tarea | Evidencia local | Estado | Bloqueo externo |
|---|---|---|---|
| Esquema temporal del Impact Graph | `docs/TEMPORAL_IMPACT_GRAPH.md` | Completada localmente | Cobertura real |
| Contrato de freshness, licencia y calidad | `docs/DATA_CONTRACTS.md`, `docs/SOURCE_HEALTH_SWEEP.md` | Completada localmente | SLA del proveedor |
| Umbrales de abstención | `docs/UNCERTAINTY_PANEL.md`, `docs/BACKTESTING.md` | Completada localmente | Calibración independiente |
| Guion de entrevistas | `docs/COMMERCIAL_WEDGE.md`, `/api/pilots/interview-guide` | Preparada | Cinco entrevistas reales |

## Días 11–20: pipeline y decisión

| Tarea | Evidencia local | Estado | Bloqueo externo |
|---|---|---|---|
| Pipeline contractual e idempotente | `backend/domain/batchIngestion.js`, `docs/BATCH_INGESTION.md` | Completada localmente | Conector autorizado |
| Resolución mínima de entidades | `backend/domain/entityResolution.js` | Completada localmente | Identificadores reales |
| Linaje y procedencia por relación | `backend/domain/impactGraph.js`, `backend/domain/eventContract.js`, `docs/EVIDENCE_CLASSIFICATION.md` | Completada localmente | Datos productivos |
| Paquete de decisión con escenario y acción | `docs/DECISION_PACKAGE.md` | Completada localmente | Revisión de usuario piloto |

## Días 21–30: validación y decisión go/no-go

| Tarea | Evidencia local | Estado | Bloqueo externo |
|---|---|---|---|
| Backtesting inicial | `backend/domain/backtesting.js`, `/api/models/backtest` | Motor preparado; evidencia demo abstinente | 3–10 eventos históricos autorizados |
| Revisión de falsos positivos y error | `docs/OPERATIONAL_SCORECARD.md` | Instrumentada localmente | Observaciones reales |
| Feedback de prospectos | `/api/pilots/feedback` | Flujo preparado | Prospectos y sponsor |
| Decisión de wedge | `docs/COMMERCIAL_WEDGE.md` | Criterios definidos | Evidencia comercial |
| Presupuesto P0 de datos | `docs/DATA_REQUIREMENTS.md` | Requisitos definidos | Cotizaciones y aprobación |

## Gate de salida

El tablero local está preparado cuando `npm.cmd run verify` termina en `PASS`.
El gate de producto real requiere además datos licenciados, eventos
históricos revisados, cinco entrevistas estructuradas, un sponsor y una prueba
de valor. Estos elementos no se simulan dentro de la USB.
