# Estado verificable del backlog del Plan Maestro

Actualizado: 9 de agosto de 2026. Esta matriz separa capacidad construida en la
copia local de evidencia que sólo puede obtenerse en staging, producción o con
un cliente. `Implementado local` no significa apto para vender como enterprise.

## P0 — Obligatorio antes de vender como enterprise

| Ítem | Estado local | Evidencia | Falta para cerrar |
|---|---|---|---|
| Multi-tenant, RLS y Auth productivo | Parcial local | contexto de tenant, RBAC, SQL 001-005, preflight | Supabase/RLS real con dos organizaciones, MFA/SSO |
| Separación demo/producción | Implementado local | `runtimeConfig`, clasificación de fuentes y gates de ingesta | Verificación en runtime desplegado |
| Contratos de datos y licencias | Implementado local | contratos, catálogo, intake y OpenAPI | Licencias y fuentes autorizadas |
| Dataset histórico y benchmark | Parcial local | fixtures, backtest y abstención | Eventos históricos licenciados y revisión experta |
| Entity resolution | Implementado local | `/api/entities/resolve` y pruebas | Identificadores de proveedores reales |
| Impact Graph v1 | Implementado local | grafo temporal, procedencia y paths | Cobertura y validación con datos reales |
| Calibración, incertidumbre y abstención | Implementado local como baseline | validación, benchmark, sensibilidad y uncertainty | Calibración independiente |
| Observabilidad, backups, restore, secrets e incident response | Implementado local | métricas, snapshots, restore, secret scan y runbook | Logs/tracing gestionados y prueba de recuperación desplegada |
| Playbooks y alert-to-action | Implementado local | playbooks, casos, planes, SLA y outcomes | Ticketing/mensajería productivos |
| Auditoría y paquete verificable | Implementado local | hash chain, paquetes JSON/Markdown/PDF y shares | Revisión legal y retención productiva |
| Seguridad, privacidad y retención | Parcial local | RBAC, headers, CORS, threat model y dry-run de retención | DPA, política aprobada, cifrado/vault y certificación |

## P1 — Diferenciación y adopción

| Ítem | Estado local | Evidencia | Falta para cerrar |
|---|---|---|---|
| Contrafactuales con costo/tiempo | Implementado local | recovery profile y action economics | Datos de capacidad y costos reales |
| Portal y vistas por rol | Implementado local | Command Center, Operations, Brief, Cases y RBAC | Auth productivo y prueba con usuarios |
| API/webhooks productivos | Implementado local en dry-run | contratos, firma, outbox, retry y DLQ | Worker/hosting externo |
| Ticketing, correo y colaboración | Preparado localmente | conectores y notification policy | Credenciales y pruebas de integración |
| Cascadas temporales | Implementado local | `/api/graph?asOf=...` y consulta temporal | Series históricas |
| Biblioteca y proveedores alternos | Implementado local en catálogo | action library y capacity marketplace bloqueado | Disponibilidad, precio y contratación verificados |
| Modo consejo y reportes ejecutivos | Implementado local | assistive suggestion, brief y PDF | Validación humana y datos productivos |
| Revisión colaborativa y feedback | Implementado local | comentarios, feedback ledger y shares | Usuarios piloto y política de acceso |
| Notificaciones y escalamiento | Implementado local en outbox | SLA sweep, política y deduplicación | Canales externos |

## P2 — Moat de escala

| Ítem | Estado local | Evidencia | Falta para cerrar |
|---|---|---|---|
| Red cooperativa anonimizada | Preview local | consentimiento, k-anonymity e integridad | Consorcio real y consentimiento legal |
| Marketplace de capacidad | Dry-run local | ofertas, inquiries y `externalAction=blocked` | Proveedores, cotizaciones y contratos |
| APIs para terceros | Contrato local | OpenAPI 149/149 y conectores | Partners y SLA |
| Modelos regionales/verticales | Perfiles locales asumidos | `/api/models/profiles` y panel | Datos licenciados y calibración por segmento |
| Paquetes regulatorios | Implementado local como evidencia | frameworks y evidence map | Asesoría legal y certificación |
| Agentes asistivos | Implementado local con límites | sugerencias, abstención y aprobación humana | Evaluación independiente y datos reales |
| Benchmark sectorial anonimizado | Implementado local con k-anonymity | `/api/benchmarks/sectors` | Cohortes reales suficientes |

## Gate de interpretación

La copia local puede considerarse lista para handoff técnico cuando `npm.cmd
run verify` termina en `PASS`, el escaneo portable no encuentra secretos y esta
matriz conserva explícitos los bloqueos externos. No autoriza claims de precisión,
ROI, cumplimiento ni disponibilidad de proveedores.
