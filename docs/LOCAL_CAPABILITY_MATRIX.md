# Matriz de capacidades locales

Estado verificable de la copia `GLOBALRESILIENCE-platform`. Las integraciones
externas se mantienen fuera de alcance por decisión del proyecto.

| Área | Capacidad local | Evidencia | Estado |
|---|---|---|---|
| Producto | Command Center, red, escenarios, casos y Brief | Vistas React y API v1 | Implementado |
| Producto | Simulación de ruptura y cascada económica | `engine/impactEngine.js` + smoke test | Implementado |
| Producto | Comparación y persistencia local de escenarios | `/api/scenarios` | Implementado |
| Operación | Ingesta deduplicada y conversión alerta → caso | `/api/ingest/events` + pruebas | Implementado |
| Operación | Jobs demo y readiness de fuentes | `/api/jobs`, `/api/health/readiness` | Implementado |
| Operación | Webhooks, outbox, retry y éxito simulado | `/api/webhooks` | Implementado |
| Operación | Búsqueda, paginación y exportación de auditoría | query params + JSON/CSV | Implementado |
| Operación | Snapshot de respaldo local | `/api/ops/snapshot` | Implementado |
| Seguridad | Roles admin, risk analyst y viewer | auth local + pruebas 401/403 | Implementado |
| Seguridad | Headers HTTP, CORS, rate limit y request IDs | `backend/server.js` | Implementado |
| Seguridad | Guard de `AUTH_SECRET` en modo protegido | `startServer()` + prueba manual | Implementado |
| Seguridad | Readiness explícito de controles | `/api/compliance/readiness` + panel Operación | Implementado local |
| UX | Contexto de vertical, región y horizonte | `ContextBar` y vistas | Implementado |
| UX | Estados de error, carga y estados vacíos | componentes operativos | Implementado |
| UX | Exportación PDF, Brief, auditoría y snapshot | controles de UI | Implementado |
| Calidad | Pruebas API y smoke test E2E | `backend/test/api.test.js`, `scripts/local-smoke-test.js` | Implementado |
| Calidad | Lint y build frontend | `npm run lint`, `npm run build` | Implementado |
| Documentación | API, OpenAPI, arquitectura, límites y checklist | `docs/` | Implementado |
| Integración | Repositorio GitHub | `docs/INTEGRATION_CHECKLIST.md` | Pendiente externo |
| Persistencia | Supabase, RLS y Auth productivo | `docs/supabase/` + checklist | Pendiente externo |
| Despliegue | Vercel y backend productivo | `docs/DEPLOYMENT.md` | Pendiente externo |
| Integración | Worker HTTP local de webhooks | `/api/webhooks/deliveries/process` con firma, timeout, backoff y DLQ | Implementado local; hosting externo pendiente |
| Datos | Fuentes licenciadas y calibración histórica | `docs/LIMITACIONES.md` | Pendiente de validación |

| Operacion | Restauracion controlada desde snapshot | `/api/ops/restore` + confirmacion UX | Implementado local |
| Observabilidad | Metricas de solicitudes, errores y latencia tenant-scoped | `/api/ops/metrics` + panel Operacion | Implementado local |

| Calidad | Integridad de referencias, deduplicacion y valores | `/api/quality/report` + Data quality gate | Implementado local |
| Operacion | Validacion humana obligatoria antes del cierre | `PATCH /api/cases/:id` + alerta sincronizada | Implementado local |

| Operacion | Triage de alertas con estados y notas auditables | `PATCH /api/alerts/:id` + AlertQueue | Implementado local |
| Operacion | Marcado masivo de notificaciones | `POST /api/notifications/read-all` + NotificationCenter | Implementado local |

| Trazabilidad | Paquete de decision por caso | `GET /api/cases/:id/decision-package` + UX | Implementado local |

| Seguridad | Cadena hash verificable de auditoria | `/api/audit/integrity` + panel Operacion | Implementado local |

| Operacion | Motor local de SLA y escalamiento deduplicado | `/api/ops/sla`, `/api/jobs/sla-sweep` + panel | Implementado local |

| Operacion | Dead-letter queue y reintento de señales | `/api/ingest/dead-letters` + panel Operacion | Implementado local |

| UX | Cola de casos con filtros de estado, prioridad, responsable y orden SLA | `/api/cases` + CasesView | Implementado local |

| Operacion | Monitor de salud, latencia y frescura de fuentes | `/api/ops/source-health` + panel Operacion | Implementado local |
| Gobernanza | Procedencia, linaje y clasificación de fuentes/modelos | `/api/governance/provenance` + panel Operacion | Implementado local |
| Gobernanza | Vista previa de retención no destructiva | `/api/governance/retention` + panel Operacion | Implementado local |
| Calidad de modelos | Invariantes locales y carga de fixtures de calibración | `/api/models/validation`, `/api/models/calibration` | Implementado local; datos históricos pendientes |

| Producto | Impact Graph local con nodos y aristas explicables | `/api/graph` + `/api/graph/paths` | Implementado local |
| Producto | Playbooks Scenario-to-Action con economía, pasos, fuente de evidencia y estado del gate | `/api/playbooks` + `/api/action-plans/preview` | Implementado local |
| Documentación | Requisitos de producto, contratos de datos y bitácora de implementación | `docs/PRODUCT_REQUIREMENTS.md`, `docs/DATA_CONTRACTS.md`, `docs/IMPLEMENTATION_LOG.md` | Implementado |

## Gates locales

```powershell
cd backend; npm test
cd ..; node scripts/local-smoke-test.js
cd frontend; npm run lint; npm run build
```

Los tres gates deben terminar correctamente antes de mover la copia a la
siguiente fase.

Capacidades adicionales: registro de modelos y supuestos (`/api/models`) y
detalle de fuentes (`/api/sources/:id`) disponibles para la trazabilidad de
cada decisión.
