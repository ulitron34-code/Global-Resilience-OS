# Wedge comercial y diseño de piloto

## Propósito

Este documento convierte la Fase 0 del Plan Maestro en una especificación
operable para entrevistas, configuración del piloto y lectura de valor. No
declara que exista product-market fit: las hipótesis marcadas como tales deben
validarse con prospectos y evidencia autorizada.

## Wedge inicial recomendado

**Sistema de decisión para interrupciones sistémicas que afectan infraestructura
digital crítica y corredores marítimos, con cables submarinos como primera
familia de activos.**

El producto no se vende inicialmente como otro mapa de riesgo. La unidad de
valor es el paquete de decisión: dependencia afectada, exposición del cliente,
escenarios comparables, acción posible, costo/tiempo, evidencia y responsable.

### ICP primario (hipótesis)

- Operadores de infraestructura digital, telecomunicaciones, data centers o
  servicios cloud con dependencias de conectividad internacional.
- Equipos de riesgo, continuidad, resiliencia operativa o inteligencia de
  grandes usuarios de rutas marítimas y commodities críticos.
- Organizaciones con un proceso de escalamiento existente y capacidad de
  aportar datos de activos, rutas, proveedores o acciones tomadas.

### Exclusiones iniciales

- No intentar cubrir las doce verticales en el primer piloto.
- No prometer predicción de ruptura, cumplimiento legal automático ni precisión
  financiera sin datos licenciados y backtesting.
- No activar acciones externas automáticas; toda acción permanece sujeta a
  aprobación humana.

## Mapa de compradores y usuarios

| Rol | Problema que debe validar | Resultado que necesita | Evidencia de interés |
|---|---|---|---|
| Sponsor ejecutivo | No puede priorizar exposición sistémica | Brief de una página con decisión y valor | Acepta revisar un caso real |
| Risk/Resilience lead | Recibe señales sin contexto accionable | Impact Graph, escenarios y abstenciones | Comparte un flujo de trabajo actual |
| Operaciones/NOC | Debe coordinar respuesta y owner | Caso, SLA, playbook y escalamiento | Define una acción y responsable |
| Data/IT owner | Necesita controlar procedencia y contratos | Catálogo, freshness, licencia y linaje | Autoriza una muestra o contrato |
| Legal/Compliance | Debe auditar afirmaciones y uso de datos | Decision Ledger y exportación de evidencia | Identifica controles y restricciones |

## Tres casos de uso iniciales

### 1. Degradación de conectividad internacional

Una señal sobre cable, landing point o ruta degradada se transforma en un
grafo de dependencias, impacto por horizonte de 24 horas/7 días/30 días y
opciones de redundancia. El gate sólo permite una recomendación material si
las fuentes enlazadas son productivas y contractualmente completas.

### 2. Interrupción en corredor marítimo o chokepoint

Una señal sobre congestión, desvío o cierre se convierte en escenarios de
reruteo, costo de espera, capacidad alterna y responsables de decisión. La
salida mínima es un borrador auditable; no una orden de compra o ejecución.

### 3. Dependencia transversal proveedor-ruta-servicio

El analista investiga una relación entre proveedor, ruta, activo y servicio
crítico; registra la procedencia de cada arista y compara una acción de
mitigación contra `no_action`. Si falta evidencia, el sistema debe abstenerse
 y explicar el faltante.

## Definición de evento crítico

Un evento entra al piloto sólo si cumple todos estos criterios:

1. Tiene `externalId`, `sourceId`, `eventType`, `title`, `severity`,
   `observedAt` y procedencia declarada.
2. Afecta un activo, ruta, proveedor o servicio dentro del alcance acordado.
3. Tiene un horizonte de decisión y un owner identificable.
4. Permite observar la decisión tomada y su resultado posterior.
5. Tiene autorización de uso, retención y redistribución compatible con el
   piloto.

Eventos sin fuente autorizada, con cobertura ilustrativa o sin resultado
observable se conservan como exploratorios y no cuentan para un gate
productivo.

## Catálogo mínimo de datos del piloto

| Dominio | Campos mínimos | Gate |
|---|---|---|
| Evento | `externalId`, tipo, severidad, `observedAt`, ubicación, procedencia | Contrato válido y deduplicación |
| Activo/ruta | ID estable, alias, geometría o referencia, vigencia | Resolución y temporalidad |
| Dependencia | origen, destino, relación, confianza, `validFrom`, `validTo` | Evidencia por arista |
| Exposición | cliente, proceso, métrica, unidad, horizonte | Supuesto separado de observado |
| Acción | costo, tiempo, owner, SLA, resultado esperado | Aprobación humana |
| Resultado | pérdida/recuperación real, timestamp, evidencia | Feedback loop y error |

## Criterios de éxito del piloto

El piloto no se considera exitoso por cantidad de alertas. Debe demostrar,
con evidencia del cliente:

- reducción medible del tiempo de explicación y de decisión;
- porcentaje de eventos con fuente y procedencia completas;
- porcentaje de casos que termina en acción documentada;
- comparación explícita contra el proceso actual o `no_action`;
- al menos un resultado real con costo evitado, exposición reducida o tiempo
  recuperado validado por el sponsor;
- revisión de falsos positivos, abstenciones y errores del modelo;
- aceptación de una segunda fase pagada, expansión o referencia.

## Guion de entrevista y gate go/no-go

Preguntar: ¿qué señal dispara hoy el escalamiento?, ¿quién decide?, ¿cuánto
tarda entender la exposición?, ¿qué datos faltan?, ¿qué acción puede cambiar
el resultado?, ¿cómo se mide el costo de esperar?, ¿qué restricciones impiden
compartir datos?, ¿qué evidencia aceptaría legal/compliance?

Registrar cada entrevista en el pilot kit con rol, resumen, problema,
severidad, proceso actual, datos disponibles, presupuesto probable y siguiente
paso. El gate externo requiere al menos cinco entrevistas estructuradas y dos
problemas con urgencia, acceso a datos y presupuesto probable. Hasta entonces,
el estado local correcto es `ready_for_customer_validation`, no
`customer_ready`. El runtime local también exige cinco entrevistas, al menos
dos problemas con urgencia alta y evidencia de acceso a datos antes de marcar
el gate de cliente.

## Traducción al producto local

- `GET /api/pilots/package` concentra readiness, guía, métricas y siguientes
  acciones.
- `POST /api/pilots/feedback` registra hallazgos estructurados por tenant.
- `/api/cases/:id/decision-package` conserva el paquete de decisión y su
  procedencia.
- `/api/action-plans/preview` aplica abstención cuando el gate de evidencia no
  es productivo.
- `docs/DATA_REQUIREMENTS.md`, `docs/PILOT_READINESS.md` y este documento son
  la fuente de trabajo para configurar un piloto sin convertir hipótesis en
  claims comerciales.

## Evidencia que sigue siendo externa

Este artefacto no sustituye entrevistas, licencias, eventos históricos,
backtesting independiente, un cliente piloto ni asesoría legal. Es el contrato
de preparación para que esas evidencias puedan cargarse sin rediseñar el
producto.
