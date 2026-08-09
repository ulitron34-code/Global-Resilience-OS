# Implementation Log

## Bloque: métricas, briefs y gobernanza tenant-scoped (2026-08-09)

- Métricas generales, brief ejecutivo, exportación, compliance y retención
  reciben el `organizationId` del token y no calculan sobre el tenant demo.
- Un tenant sin escenarios ya no rompe el brief: devuelve abstención explícita y
  mantiene el requisito de revisión humana.
- Se añadió cobertura API protegida para comprobar que métricas y briefs
  identifican correctamente la organización autenticada.

## Bloque: Decision Room Markdown (2026-08-09)

- Los enlaces compartibles de solo lectura admiten descarga Markdown sin
  exponer hashes, tokens persistidos ni capacidades de mutación.
- Decision Room muestra el botón de descarga y la prueba API verifica formato,
  `no-store` y contenido legible.

## Bloque: paquete de piloto Markdown (2026-08-09)

- El paquete consolidado de piloto admite exportación JSON y Markdown.
- La interfaz permite descargar ambos formatos y conserva el descargo de que
  la evidencia comercial, histórica y de licencias sigue pendiente.

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
## Bloque: build raíz reproducible (2026-08-09)

- `npm run build` ahora entra al directorio `frontend` mediante
  `scripts/build-frontend.js`, evitando el fallo de esbuild provocado por
  `npm --prefix` en Windows.
- El orquestador ejecuta el build real, no sólo la existencia de `dist`.
- `npm run build`, `npm run verify` y el gate standalone quedaron verificados.
## Bloque: exportación PDF verificable (2026-08-09)

- El generador se separó en `frontend/src/utils/reportPdf.js` y el botón del
  frontend lo reutiliza directamente.
- `scripts/pdf-export-check.js` produce un PDF con el mismo generador y verifica
  que la salida tenga encabezado `%PDF-` y contenido real.
- El gate de release incluye la prueba; la checklist de despliegue ya no deja
  la exportación PDF como pendiente local.
## Bloque: disclaimer de demo verificable (2026-08-09)

- El smoke standalone descarga todos los assets del bundle y confirma que el
  aviso de datos ilustrativos está presente.
- La checklist de presentación queda respaldada por evidencia automatizada, sin
  declarar que los datos demo sean aptos para decisiones productivas.
## Bloque: paquete de decisión Markdown (2026-08-09)

- El endpoint de decisión admite `format=json|markdown`.
- Cases incorpora botones separados para descargar el paquete técnico JSON o
  la lectura legible Markdown.
- La exportación Markdown conserva estado, prioridad, responsable, cadena de
  evidencia, número de planes y descargo de no ejecución externa.
## Bloque: aislamiento tenant del registro de fuentes (2026-08-09)

- El registro local, el detalle de fuente, el health/freshness, la procedencia y
  los reportes de calidad ahora reciben y aplican `organizationId`.
- Las rutas operativas de fuentes y calidad requieren autenticación/rol cuando
  `AUTH_REQUIRED=true` y no exponen fuentes del tenant demo a otra organización.
- Se añadió cobertura API de dos organizaciones para confirmar respuesta vacía,
  `organizationId` correcto y ausencia de filtración de fuentes.
## Bloque: snapshots y readiness tenant-scoped (2026-08-09)

## Bloque: registro local de fuentes aprobado por intake (2026-08-09)

## Bloque: índice de resiliencia efectiva por horizonte (2026-08-09)

- El perfil de recuperación ahora devuelve `effectiveResilienceIndex` para
  cada horizonte solicitado, con porcentaje de exposición recuperable, opción
  contrafactual elegida, exposición residual y valor evitado.
- La salida conserva `evidenceClass: assumed` y el descargo heurístico; no
  convierte el índice en una predicción validada ni oculta la falta de datos
  históricos/licenciados.
- La API protegida valida que el índice quede acotado entre 0 y 95% y conserve
  su clasificación de evidencia.
- La vista de recuperación ahora muestra el índice por horizonte junto con la
  exposición residual, el valor evitado y la opción contrafactual seleccionada.

- Una revisiÃ³n `approved_local` puede crear una fuente tenant-scoped en estado
  `pending_external` mediante `POST /api/data-catalog/intake-reviews/:id/register-local`.
- El registro conserva la ficha contractual, enlaza la fuente con su revisiÃ³n y
  mantiene `activationStatus: blocked_external`; no ejecuta llamadas externas.
- La ingesta exige coincidencia de tenant y `status: connected`, por lo que una
  fuente pendiente no puede generar eventos hasta el alta externa.
- La cobertura sube a 55 pruebas y el nuevo endpoint queda en OpenAPI local.
- La prueba API protegida recorre el flujo completo: crear revisiÃ³n, aprobar,
  registrar, comprobar estado `pending_external` y verificar aislamiento entre
  tenant A y tenant B.

- `GET /api/ops/snapshot` ahora exporta únicamente el estado de la
  organización autenticada e incluye `organizationId` en el artefacto.
- `POST /api/ops/restore` rechaza snapshots de otro tenant y reemplaza sólo la
  colección de la organización objetivo, preservando los demás tenants.
- Readiness empresarial, postura de seguridad y calibración usan el tenant del
  token; se añadieron administradores demo por organización para probar el flujo
  de backup/restore con control de rol.
