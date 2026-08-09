# Operational Scorecard local

`GET /api/metrics/scorecard` consolida las métricas del plan maestro en una respuesta auditable:

- producto: cobertura de procedencia, casos cerrados, acciones con outcome, salud de fuentes, DLQ e incidentes;
- modelos: fixtures de calibración y error medio absoluto local;
- negocio: pérdida evitada documentada y error medio de outcomes;
- tiempos: ciclo de asignación y decisión a partir de timestamps locales.

El ciclo de planes conserva `statusHistory`, `assignedAt` y `decisionAt`. Por
ello `timing.timeToDecisionMinutes` puede medirse después de aprobar planes y
`GET /api/action-plans/timing` expone el resumen por organización. Detección y
explicación permanecen en `null` hasta contar con timestamps comparables de
fuentes y revisión.

El endpoint no inventa métricas faltantes. Declara la evidencia requerida para
que el piloto pueda completarlas.

Cuando existen timestamps explícitos, el scorecard calcula detección como
`observedAt -> detectedAt` en la alerta y explicación como
`detectedAt -> explainedAt` en el plan. Si falta cualquiera de los extremos,
la métrica permanece en `null`; no se rellenan tiempos con estimaciones.
