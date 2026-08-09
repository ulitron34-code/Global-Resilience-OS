# Backtesting local

La vista de validación permite registrar una fixture individual o importar hasta
50 fixtures autorizadas en JSON/CSV por confirmación. Las plantillas incluyen la
cadena mínima de evidencia y el importador no convierte datos demo en evidencia.

`GET /api/models/backtest` compara el error absoluto medio del modelo con un
baseline de mediana del impacto observado.

`GET /api/models/benchmark-plan` mantiene el objetivo explícito de 10 eventos
históricos y separa el mínimo de 3 eventos para una revisión inicial de la
cobertura requerida para el benchmark. Los slots faltantes permanecen abiertos
y no se rellenan con datos sintéticos.

- Menos de tres fixtures: `abstain_for_production`.
- Mejora sobre baseline: `candidate_for_human_review`.
- Sin mejora: `exploratory_only`.

El backtest no fabrica eventos históricos ni convierte datos demo en evidencia
de mercado. Las fixtures deben entrar por el contrato de calibración con fuente,
fecha y procedencia verificables.

Para que una fixture sea elegible para el backtest debe conservar además el
activo afectado, duración del evento, rutas alternativas y resultado de
recuperación. Las fixtures incompletas se conservan con evidenceStatus:
incomplete, pero no se usan para métricas ni para abrir el gate productivo.
