# Implementation Log

## Bloque 1 - Impact Graph y Scenario-to-Action

**Fecha:** 8 de agosto de 2026  
**Estado:** completado localmente

### Implementado

- Grafo local versionado con nodos de cable, chokepoint y vertical.
- Aristas con relación, peso, confianza, procedencia y vigencia.
- Endpoint de grafo completo y endpoint de trayectoria explicable.
- Catálogo de cinco playbooks operativos.
- Preview de plan de acción con economía, ROI, confianza, pasos y evidencia requerida.
- Persistencia local de planes de acción con estados de aprobación, owner y outcome.
- Resolución local por alias para cables, verticales y chokepoints.
- Readiness de runtime demo/producción y catálogo de fuentes con licenciamiento.

### Bloque: ingesta batch operable desde Operations

- La consola batch ahora importa archivos JSON o CSV con encabezados y conversión
  explícita de campos numéricos.
- Se agregaron plantillas descargables, identificación del archivo cargado y
  resultado por registro para corregir un lote antes de persistirlo.
- El modo `commit` requiere confirmación explícita y conserva la restricción de
  sólo lectura para el rol `viewer`.
- La capacidad sigue siendo local: no representa licencia, conectividad ni
  autorización de proveedores externos.

### Bloque: carga de fixtures históricas

- La validación de modelos permite importar hasta 50 fixtures autorizadas en
  JSON/CSV y descargar plantillas con la cadena de evidencia mínima.
- El flujo conserva la confirmación humana, la separación de fixtures
incompletas y el gate de muestra suficiente; no fabrica historial.

### Bloque: preview de onboarding de fuentes

- Se agregó un flujo no destructivo para validar identidad, cobertura, licencia,
  retención y dependencias antes de registrar una fuente en staging.
- El panel de Operations muestra los checks y conserva `persisted: false`; una
  fuente demo, sin licencia activa o con ficha incompleta queda en abstención.

### Bloque: gate de contratos de conectores

- Se agregó `GET /api/connectors/readiness` para comprobar unicidad de IDs y
  fuentes, campos mínimos, tipos de evento y modo `dry_run_only`.
- Readiness expone explícitamente que la integración externa sigue pendiente;
  el panel operativo ya muestra el estado del gate junto con las fuentes.
- Se añadieron pruebas para los cuatro contratos locales, incluyendo payload
  válido y rechazo de payload incompleto.
- Benchmark local de calibración contra baseline con gates explícitos de abstención.
- Envelope común de eventos, validación de producción y registro de conectores en dry-run.
- Panel de Operations para mostrar grafo y playbooks.
- Contratos de datos y requisitos de producto documentados.
- Pruebas de API para las nuevas capacidades.
- Contexto de tenant local y aislamiento por `organizationId` para planes de acción.
- Workflow de planes con transiciones, aprobación humana y criterio de cierre verificable.
- Documentación local de threat model, release gate y requisitos de datos.
- Panel Operations conectado al ciclo Scenario-to-Action: preview, guardado de borrador y aprobación humana local.
- Registro local de marcos regulatorios y matriz de evidencia para NIST, DORA, NIS2/CER e ITU.
- Perfil contrafactual de recuperación por horizontes de 24h, 7d y 30d con costo, respuesta, exposición residual y valor evitado.
- Feedback loop de Action OS: outcome, evidencia, horas reales de recuperación y error de pronóstico agregado.
- Navegación frontend sensible a rol: viewer no recibe Operations; analyst y admin conservan la experiencia operativa.

### Validación

- Backend: 31 pruebas pasando, incluyendo ciclo draft → approved → in_execution → completed, contrato de entorno, aislamiento entre organizaciones, fixtures completas/incompletas y gates de readiness del piloto.
- Frontend: lint pasando.
- Frontend: build de producción pasando.
- Smoke local: PASS.

### Pendiente de este bloque

- Sustituir seed/demo por datos licenciados.
- Persistir nodos, aristas, revisiones y playbooks en base multi-tenant.
- Añadir aprobación y ejecución de acciones reales después de integrar infraestructura externa.

### Bloque: cola auditable de revisión de fuentes

- Las fuentes que pasan el preview pueden registrarse como revisión local
  pendiente, con actor, timestamps, checks y nota de decisión.
- La aprobación local conserva `activationStatus: blocked_external`; no activa
  fuentes ni simula licencia o integración productiva.
- Snapshots, reset local y auditoría incluyen la cola de revisiones.
## Bloque: Render staging blueprint (2026-08-09)

- Se añadió `render.yaml` con raíz `backend`, `npm ci`, `npm start` y healthcheck.
- El entorno queda declarado como staging, con autenticación obligatoria y
  acciones externas deshabilitadas por defecto.
- `AUTH_SECRET` y `CORS_ORIGIN` se dejan como valores externos no versionados;
  el almacenamiento efímero se marca explícitamente como temporal.

## Bloque: production security gate (2026-08-09)

- Se añadió una prueba dedicada que demuestra que `APP_MODE=production` no
  permite login ni listado de usuarios demo.
- El release checklist ahora enlaza la evidencia ejecutable en lugar de dejar
  el gate como afirmación manual.

## Bloque: Decision sharing local (2026-08-09)

- Se añadieron enlaces temporales de solo lectura para paquetes de decisión.
- El token claro se entrega una sola vez; el estado local conserva únicamente
  SHA-256, expiración, revocación, contador y último acceso.
- Se agregaron endpoints autenticados para crear/listar/revocar y un endpoint
  público controlado por token con `Cache-Control: no-store`.
- La UI de casos permite crear el enlace, copiarlo y revocarlo; la vista muestra
  su estado y accesos sin exponer secretos.
- Pruebas unitarias y API cubren creación, consulta, metadatos sin hash,
  revocación y rechazo de tokens inválidos.
- Sigue bloqueado para producción hasta migrar a Supabase/RLS, añadir política
  de privacidad, rate limit específico y revisar campos compartibles.
## Bloque: lifecycle timing del Action OS (2026-08-09)

- Los planes ahora conservan `statusHistory`, `assignedAt`, `decisionAt`, `executionStartedAt` y `completedAt`.
- `GET /api/action-plans/timing` y `GET /api/metrics/scorecard` exponen el tiempo local de asignación y decisión cuando existe evidencia temporal.
- Detección y explicación permanecen pendientes hasta recibir timestamps comparables de fuentes y revisión.
## Bloque: rate limit específico para Decision Room (2026-08-09)

- Se añadió un límite de 60 solicitudes por minuto por IP y token para el
  endpoint público de enlaces compartidos.
- Los excesos responden `429` con `Retry-After: 60`; los enlaces siguen sin
  almacenamiento en caché.
- Una prueba API cubre el límite antes de alcanzar el límite global.
## Bloque: HTTP security headers (2026-08-09)

- Se añadieron CSP restrictiva y políticas de aislamiento COOP/CORP al backend.
- La prueba API verifica que las respuestas incluyan los controles principales.
- El control queda documentado como hardening local; TLS, WAF y políticas del
  proveedor siguen siendo parte del despliegue externo.
## Bloque: standalone artifact gate (2026-08-09)

- Se añadió `scripts/standalone-artifact-check.js` para servir `frontend/dist`
  con HTTP local y comprobar que el HTML y al menos un asset responden sin
  backend.
- El gate quedó integrado en `scripts/local-release-evidence.js` y la checklist
  ahora conserva la evidencia de standalone.
- La verificación manual del botón PDF continúa separada porque requiere un
  navegador real; el componente ya usa jsPDF y genera el archivo localmente.
