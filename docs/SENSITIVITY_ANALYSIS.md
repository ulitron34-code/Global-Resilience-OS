# Análisis de sensibilidad

`POST /api/models/sensitivity` calcula escenarios locales para severidad parcial
y total en varias duraciones. Devuelve rangos, pérdida por escenario y checks de
monotonicidad.

La salida sirve para revisar supuestos y detectar inconsistencias del motor; no
es validación causal ni señal de trading y queda separada de las recomendaciones
materiales mediante los gates de calidad y gobernanza.
