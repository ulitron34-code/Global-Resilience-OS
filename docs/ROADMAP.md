# Roadmap: de esta demo a la plataforma real

Este documento conecta explícitamente con el análisis PREMORTEMV3 hecho
sobre el business plan. Esta demo cubre la parte de "Cambio Estructural #1
(Vertical-First)" y parte del "Cambio #4 (Sales-First)" — te da algo tangible
para abrir conversaciones. Todo lo demás del plan de remediación sigue
pendiente y no lo resuelve el código.

## Lo que esta demo SÍ resuelve

- Prueba de concepto visual/interactiva del diferenciador central (cables
  como riesgo sistémico transversal a 12 verticales).
- Algo tangible que enseñar en una reunión de 15 minutos con un prospect o
  inversionista, sin depender de un deck estático.
- Arquitectura base que Claude Code (o cualquier desarrollador) puede tomar
  y extender sin empezar de cero.

## Lo que esta demo NO resuelve (y no debe fingir resolver)

- **No valida el problema con clientes reales.** Ningún dato aquí viene de
  un cliente pagando. Eso solo lo resuelve VP Sales cerrando conversaciones
  (ver PREMORTEMV3, Cambio #4).
- **No tiene datos reales.** Los flujos USD/día por vertical y los pesos de
  correlación cable→vertical son estimaciones de orden de magnitud para que
  la demo se vea coherente, no cifras de Kpler/Refinitiv/AIS real.
- **No tiene compliance.** Sin KYC/KYB, sin CFIUS review, sin SOC 2 — no se
  puede vender así a un cliente enterprise real (ver PREMORTEMV3, Mercados).

## Fases sugeridas (técnicas, en paralelo al plan comercial)

### Estado local actual

La copia local ya incorpora autenticación por roles, revocación de sesiones,
rate limiting, auditoría con cadena hash, snapshots y restore controlado,
calidad de datos, DLQ y reintentos, SLA y escalamiento, salud de fuentes,
outbox con firma HMAC, procedencia y linaje, revisión de retención no
destructiva y un conducto de calibración con fixtures y métricas de error.
Lo que queda fuera de esta copia son únicamente las integraciones externas,
las licencias y la validación con datos históricos reales.

### Fase A — Validación con prospects (usa esta demo tal cual)
No requiere código nuevo. Úsala en 5-10 conversaciones con prospects para
validar si el diferenciador de cables realmente les importa, y qué falta
para que paguen. Documenta feedback por escrito — esto alimenta la Fase B.

### Fase B — Datos reales (cuando haya 1-2 prospects "warm")
1. Reemplazar `data/cables.js` con datos reales de TeleGeography (tienen
   API/dataset licenciable) o construir el dataset manualmente desde fuentes
   públicas (submarinecablemap.com como referencia visual, no como fuente de
   datos — verificar licencia de uso).
2. Reemplazar `data/verticals.js` con flujos reales por vertical (requiere
   suscripción a Kpler, Refinitiv, o similar — este es presupuesto real, no
   trivial, ver breakdown de $80K "APIs" en el business plan original).
3. Validar el modelo de `impactEngine.js` contra al menos 2-3 eventos
   históricos reales de ruptura de cable y su correlación observada con
   movimientos de precio — si no hay correlación real medible, esto es la
   señal de HALT #1 del análisis premortem (pivotar propuesta de valor).

### Fase C — Backend productivo (cuando haya presupuesto de Seed)
1. Base de datos real (Postgres) — hoy todo vive en memoria/archivos.
2. Autenticación (empresas se registran, no acceso anónimo).
3. Integración con feeds AIS reales (Marine Traffic, Kpler) — esto es
   trabajo de ingeniería serio, no un endpoint más.
4. Monitoreo real de estado de cables (hoy la "ruptura" es simulada por el
   usuario; en producción necesita ingestar señales reales de estado de
   cables, que no son triviales de obtener en tiempo real).

### Fase D — Compliance (en paralelo, no después)
Ver el Cambio Estructural #3 del análisis PREMORTEMV3 completo. Esto no es
un checkbox de "luego lo hacemos" — sin esto, ningún cliente enterprise real
puede firmar, sin importar qué tan bueno esté el producto técnicamente.

## Nota para quien tome este código después (Claude Code u otro dev)

Antes de construir sobre esto, lee `docs/LIMITACIONES.md`. La tentación al
recibir un repo que "ya funciona" es asumir que los datos son reales y
construir encima sin cuestionarlos — eso sería repetir exactamente el error
de proyecciones-sin-validar que señaló el análisis premortem original.
