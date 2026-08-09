# Performance check local

`node scripts/local-performance-check.js` levanta el backend local, ejecuta
solicitudes concurrentes sobre health y graph, y reporta p50, p95, máximo y
tasa de error.

El gate local exige cero errores y p95 menor o igual a 1 segundo. No sustituye
una prueba de carga de staging, dimensionamiento de workers, tracing ni
observabilidad productiva.
