# Auditoria de cobertura del plan maestro

Fecha de auditoria: 8 de agosto de 2026.

## Fases

| Fase | Estado local | Evidencia | Bloqueo restante |
|---|---|---|---|
| 0. Definicion y foco | Parcial/documental | `PRODUCT_REQUIREMENTS.md`, `ROADMAP.md` | Entrevistas reales, ICP validado y presupuesto del piloto |
| 1. Hardening local | Implementada | tests, lint, build, smoke, OpenAPI, threat model, restore, instalación limpia con `npm ci --dry-run` | CI remoto y prueba en staging |
| 2. Datos reales y calidad | Infraestructura local preparada | `DATA_CONTRACTS.md`, `DATA_REQUIREMENTS.md`, `dataCatalog.js` | Licencias, adaptadores autorizados e historial real |
| 3. Impact Graph y calibracion | Implementada como baseline local | `impactGraph.js`, `calibrationBenchmark.js`, entity resolution | 3-5 eventos historicos y validacion de mejora contra baseline |
| 4. Action OS | Implementada localmente | playbooks, planes, aprobacion, outcomes, recovery, action library | Ticketing/mensajeria productivos y acciones reales |
| 5. Produccion enterprise | Preparada/documentada | `INTEGRATION_HANDOFF.md`, SQL Supabase, RBAC, backups | GitHub, Supabase, RLS, SSO/MFA, secrets, hosting y observabilidad real |
| 6. Piloto | No iniciada | gates documentados | Cliente, datos reales, baseline y medicion de valor |
| 7. Escala y defensa | No iniciada | `ROADMAP.md`, regulatory evidence local | Red cooperativa, marketplace real, certificaciones y unit economics |

## Capacidades locales verificadas

- Impact Graph temporal con procedencia, confianza y vigencia.
- Resolucion de entidades por alias.
- Contratos y validacion de eventos con dead-letter queue.
- Catalogo de datos y readiness de licenciamiento.
- Calibracion local, incertidumbre y abstencion.
- Action OS con aprobacion humana, SLA, outcomes y error de pronostico.
- Contrafactuales de recuperacion en 24 horas, 7 dias y 30 dias.
- Biblioteca de mitigaciones y recomendaciones por presupuesto/horizonte.
- Evidencia regulatoria local con descargo de certificacion.
- Tenant context y aislamiento local por `organizationId`.
- Auditoria, snapshots, restore, webhooks y notificaciones locales.
- Sweep operativo de salud/frescura de fuentes con notificación deduplicada y auditoría.
- Frontend sensible a roles y experiencia Operations conectada al backend.
- Registro de incidentes con runbook, severidades, estados, timeline y cierre auditable.
- Postura de seguridad local consolidada con gate de producción explícito.
- Ingesta batch local con dry-run, commit atómico por lote, validación y deduplicación.
- Backtest local contra baseline de mediana con abstención si la muestra es insuficiente.
- Análisis de sensibilidad por severidad y duración con checks de monotonicidad.
- Panel de incertidumbre con intervalos explícitos y abstención por falta de evidencia.
- Performance check local reproducible con p50/p95, errores y umbral de latencia.
- Auditoría portable contra estado, env, certificados y patrones de tokens.
- Auditoría local de dependencias backend/frontend sin vulnerabilidades reportadas.
- Scorecard operativo local con métricas de producto, modelos y negocio sin inventar timestamps faltantes.
- Contrato de configuración por entorno con gate demo/staging/production y sin exponer secretos.
- Orquestador único de evidencia local que ejecuta todos los gates reproducibles y devuelve estado JSON.
- Comprobación de reproducibilidad de manifests, lockfiles, env examples y exclusiones portable.
- Punto de entrada raíz con comandos unificados y auditoría de instalación limpia mediante `npm ci --dry-run`.
- Reinicio demo local controlado, con confirmación de interfaz, autorización administrativa y bloqueo explícito en producción.
- Ingesta batch operable desde archivo JSON/CSV, plantillas, confirmación de commit y resultado por registro.
- Carga controlada de fixtures históricas en JSON/CSV con confirmación y cadena de evidencia mínima.
- Gate estructural de contratos de conectores con estado visible en readiness y pruebas por adaptador.
- Preview no destructivo de onboarding de fuentes con validación contractual y separación explícita de staging.
- Paquete consolidado de piloto exportable con readiness, entrevistas, métricas, feedback, scorecard y próximos gates.
- Auditoría textual del esquema Supabase, RLS, tenant helper y eliminación de políticas demo.
- Enterprise Readiness consolidado con decisión de handoff, bloqueos locales y dependencias externas.
- Enlaces temporales de paquetes de decisión con hash de token, solo lectura,
  expiración, revocación y auditoría de accesos; queda documentada la migración
  futura a Supabase/RLS para producción.

## Capacidad adicional preparada para el handoff

- Blueprint de Render para backend de staging con healthcheck, `npm ci`,
  autenticación obligatoria, CORS explícito y acciones externas deshabilitadas.

## Pendientes que no deben simularse localmente

1. Datos licenciados de cables, AIS, comercio y proveedores.
2. Persistencia multi-tenant con PostgreSQL/Supabase y RLS probado.
3. Auth productivo, MFA/SSO, secretos y rotacion operativa.
4. CI remoto, despliegues y observabilidad 24/7.
5. Integraciones externas de ticketing, correo, mensajeria y capacidad.
6. Backtesting con eventos historicos y validacion por analistas expertos.
7. Piloto con cliente, costo evitado, tiempo recuperado y willingness-to-pay.
8. Revision legal, DPA, certificaciones y claims comerciales.

## Gates de aceptacion local

- Backend: 44 pruebas pasando.
- Frontend: lint y build de produccion pasando.
- Smoke local: PASS.
- OpenAPI: JSON valido; 134 rutas documentadas, sin faltantes ni duplicados.
- Source health sweep: endpoint, smoke test y panel Operations verificados.
- Pilot readiness: gates técnicos, guía de entrevistas, métricas locales y evidencia faltante.
- Incident response: runbook, registro, triage, timeline y smoke test verificados.
- Security posture: autenticación, secreto, CORS, datos, auditoría, snapshot y acciones externas verificados.
- Batch ingestion: validación dry-run, commit, duplicado y documentación verificados.
- Backtesting: baseline, MAE, mejora relativa y decisión de producción verificados.
- Sensitivity analysis: escenarios, rangos y consistencia del motor verificados.
- Uncertainty: intervalo nulo y abstención verificados con muestra insuficiente.
- Performance: prueba concurrente local con gate de latencia y error.
- Portable audit: archivos mínimos, estado y contenido sensible revisados.
- Dependency audit: backend y frontend con 0 vulnerabilidades en `--omit=dev`.
- Acciones externas: deshabilitadas por defecto.

AdemÃ¡s, las alertas y escenarios exponen clasificaciÃ³n de evidencia (`observed`,
`inferred`, `assumed`) y los paquetes de decisiÃ³n consolidan una `evidenceChain`
con fuentes observadas, modelos inferidos y supuestos de escenario.

El estado `implementada localmente` no equivale a listo para vender como sistema
enterprise ni a cumplimiento regulatorio. El cambio de estado requiere la evidencia
externa indicada en cada fila.
## Bloque local adicional: métricas temporales del ciclo de decisión

Los planes de acción ya conservan historial de estados y timestamps de
asignación/aprobación. El scorecard y `GET /api/action-plans/timing` exponen el
tiempo local a decisión sin inventar detección o explicación cuando no existen
timestamps comparables de fuentes.
