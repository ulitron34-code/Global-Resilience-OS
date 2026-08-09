# Auditoría de cobertura del plan maestro

Fecha de auditoría: 8 de agosto de 2026.

## Fases

| Fase | Estado local | Evidencia | Bloqueo restante |
|---|---|---|---|
| 0. Definición y foco | Parcial/documental | `PRODUCT_REQUIREMENTS.md`, `ROADMAP.md` | Entrevistas reales, ICP y presupuesto del piloto |
| 1. Hardening local | Implementada | tests, lint, build, smoke, OpenAPI, threat model, restore, instalación limpia y CI preparado | Ejecutar CI remoto y staging |
| 2. Datos reales y calidad | Infraestructura local preparada | contratos, catálogo, batch, DLQ y conectores | Licencias, adaptadores autorizados e historial real |
| 3. Impact Graph y calibración | Baseline local implementado | grafo temporal, entity resolution, calibración y backtesting | Eventos históricos y validación experta |
| 4. Action OS | Implementada localmente | playbooks, planes, aprobación, outcomes, recovery y action library | Ticketing, mensajería y acciones reales |
| 5. Producción enterprise | Preparada/documentada | RBAC, contrato de entorno, SQL Supabase, RLS, snapshots, backups y handoff | Deploy actualizado, RLS con dos organizaciones, SSO/MFA, secrets y observabilidad |
| 6. Piloto | Preparación local | pilot kit, readiness y scorecard | Cliente, datos reales, baseline y medición de valor |
| 7. Escala y defensa | Roadmap local | roadmap y evidencia regulatoria | Red cooperativa, marketplace, certificaciones y unit economics |

## Capacidades locales verificadas

- Impact Graph temporal con procedencia, confianza y vigencia.
- Resolución de entidades por alias.
- Contratos de eventos con validación, deduplicación y dead-letter queue.
- Catálogo de datos, licenciamiento y preview de onboarding.
- Calibración, incertidumbre, abstención, backtesting y sensibilidad.
- Action OS con aprobación humana, SLA, outcomes y error de pronóstico.
- Contrafactuales de recuperación y biblioteca de mitigaciones.
- Evidencia regulatoria local con descargo de certificación.
- Tenant context y aislamiento local de planes de acción.
- Auditoría, snapshots, restore, webhooks y notificaciones locales.
- Sweeps de salud/frescura de fuentes e incidentes operativos.
- Seguridad local, contrato de entorno y bloqueo de acciones externas.
- Ingesta batch, fixtures históricas y gates de contratos de conectores.
- Paquete de piloto, scorecard operativo y Enterprise Readiness.
- Esquema Supabase 001–003, helper de tenant, RLS y políticas de snapshots.
- Adaptador de snapshots Supabase con timeout, fallback y escritura en cola.
- CI preparado para Node 20/22 con permisos de solo lectura.
- OpenAPI completo: 137 rutas documentadas, sin faltantes ni duplicados.

## Pendientes que no deben simularse localmente

1. Datos licenciados de cables, AIS, comercio y proveedores.
2. Persistencia multi-tenant y RLS verificados con dos organizaciones reales.
3. Auth productivo, MFA/SSO, secretos y rotación operativa.
4. Publicación GitHub, CI ejecutado, despliegues y observabilidad 24/7.
5. Integraciones externas de ticketing, correo, mensajería y capacidad.
6. Backtesting con eventos históricos y analistas expertos.
7. Piloto con cliente, costo evitado, tiempo recuperado y willingness-to-pay.
8. Revisión legal, DPA, certificaciones y claims comerciales.

## Gates de aceptación local

- Backend: 49 pruebas pasando.
- Frontend: lint y build de producción pasando directamente.
- Smoke local, plan audit, Supabase schema audit, portable audit y OpenAPI:
  `PASS`.
- Acciones externas deshabilitadas por defecto.
- Toda recomendación material conserva evidencia y puede abstenerse.

El estado `implementada localmente` no equivale a listo para vender como
sistema enterprise ni a cumplimiento regulatorio. Cada cambio de estado
requiere la evidencia externa indicada en esta tabla.
