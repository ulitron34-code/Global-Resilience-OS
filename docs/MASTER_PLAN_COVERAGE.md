# Auditoria de cobertura del Plan Maestro

Fecha de auditoria: 9 de agosto de 2026.

## Fases

| Fase | Estado local | Evidencia | Bloqueo restante |
|---|---|---|---|
| 0. Definicion y foco | Preparada localmente | `COMMERCIAL_WEDGE.md`, `PRODUCT_REQUIREMENTS.md`, `ROADMAP.md`, pilot kit | Entrevistas reales, ICP validado y presupuesto del piloto |
| 1. Hardening local | Implementada | tests, lint, build, smoke, OpenAPI, threat model, restore, instalacion limpia y CI preparado | Ejecutar CI remoto y staging |
| 2. Datos reales y calidad | Infraestructura local preparada | contratos, catalogo, batch, DLQ y conectores | Licencias, adaptadores autorizados e historial real |
| 3. Impact Graph y calibracion | Baseline local implementado | grafo temporal, entity resolution, calibracion y backtesting | Eventos historicos y validacion experta |
| 4. Action OS | Implementada localmente | playbooks, planes, aprobacion, outcomes, recovery y action library | Ticketing, mensajeria y acciones reales |
| 5. Produccion enterprise | Preparada/documentada | RBAC, contrato de entorno, SQL Supabase 001-005, RLS, snapshots, backups, handoff y auditoría externa local | GitHub actualizado, RLS real con dos organizaciones, SSO/MFA, secretos y observabilidad |
| 6. Piloto | Preparacion local | pilot kit, readiness y scorecard | Cliente, datos reales, baseline y medicion de valor |
| 7. Escala y defensa | Roadmap local ampliado | roadmap, red cooperativa seed, perfiles regionales/verticales, caso económico y evidencia regulatoria | Red real, marketplace, certificaciones y unit economics validado con clientes |

## Capacidades locales verificadas

- Impact Graph temporal con procedencia, confianza y vigencia.
- Resolucion de entidades por alias.
- Contratos de eventos con validacion, deduplicacion y dead-letter queue.
- Catalogo de datos, licenciamiento y preview de onboarding.
- Calibracion, incertidumbre, abstencion, backtesting y sensibilidad.
- Action OS con aprobacion humana, SLA, outcomes y error de pronostico.
- Contrafactuales de recuperacion y biblioteca de mitigaciones.
- Evidencia regulatoria local con descargo de certificacion.
- Tenant context y aislamiento local de planes de accion.
- Auditoria, snapshots, restore, webhooks y notificaciones locales.
- Sweeps de salud/frescura de fuentes e incidentes operativos.
- Seguridad local, contrato de entorno y bloqueo de acciones externas.
- Ingesta batch, fixtures historicas y gates de contratos de conectores.
- Paquete de piloto, scorecard operativo y Enterprise Readiness.
- Perfiles regionales y verticales con datos requeridos, abstención productiva y revisión de supuestos.
- Caso económico de piloto con valor protegido, neto de primer año, payback y gate explícito de evidencia; no valida willingness-to-pay.
- Esquema Supabase 001-005 con tablas normalizadas, RLS y politicas de lectura
  y escritura acotadas por tenant y rol.
- Control plane normalizado para notificaciones, webhooks, entregas y jobs en
  `docs/supabase/005_control_plane_extensions.sql`.
- Adaptador de snapshots Supabase con timeout, fallback y escritura en cola.
- Proyección determinista del control plane para backfill normalizado, con
  validación de tenant, claves foráneas y ausencia de secretos planos.
- CI preparado para Node 20/22 con permisos de solo lectura.
- OpenAPI completo: 146 rutas documentadas, sin faltantes ni duplicados.

## Pendientes que no deben simularse localmente

1. Datos licenciados de cables, AIS, comercio y proveedores.
2. Persistencia multi-tenant y RLS verificados con dos organizaciones reales.
3. Auth productivo, MFA/SSO, secretos y rotacion operativa.
4. Publicacion GitHub, CI ejecutado, despliegues y observabilidad 24/7.
5. Integraciones externas de ticketing, correo, mensajeria y capacidad.
6. Backtesting con eventos historicos y analistas expertos.
7. Piloto con cliente, costo evitado, tiempo recuperado y willingness-to-pay.
8. Revision legal, DPA, certificaciones y claims comerciales.

## Gates de aceptacion local

- Backend: 96 pruebas pasando.
- Frontend: lint y build de produccion pasando.
- `npm.cmd run verify`: PASS completo, incluyendo smoke, rendimiento,
  artefacto standalone, exportacion PDF, auditoria portable, reproducibilidad,
  instalacion limpia, esquema Supabase, Plan Maestro, release gate y OpenAPI.
- Supabase schema audit: 23 tablas, RLS, helper de tenant, helper de rol,
  politicas de lectura y politicas de escritura con verificacion de alcance.
- Acciones externas deshabilitadas por defecto.
- Toda recomendacion material conserva evidencia y puede abstenerse.

El estado `implementada localmente` no equivale a listo para vender como
sistema enterprise ni a cumplimiento regulatorio. Cada cambio de estado
requiere la evidencia externa indicada en esta tabla.
