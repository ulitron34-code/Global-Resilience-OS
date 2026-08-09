# Operational Scorecard local

`GET /api/metrics/scorecard` consolida las métricas del plan maestro en una respuesta auditable:

- producto: cobertura de procedencia, casos cerrados, acciones con outcome, salud de fuentes, DLQ e incidentes;
- modelos: fixtures de calibración y error medio absoluto local;
- negocio: pérdida evitada documentada y error medio de outcomes;
- tiempos: campos explícitos como `null` hasta que existan timestamps reales de detección, explicación y decisión.

El endpoint no inventa métricas faltantes. Declara la evidencia requerida para que el piloto pueda completarlas.
