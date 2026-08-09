# Impact Graph temporal

`GET /api/graph` acepta `asOf` en formato ISO-8601. Las aristas se filtran por
`validFrom` y `validTo`, y la respuesta incluye `temporalFilter` para hacer
reproducible la consulta.

`GET /api/graph/paths` aplica el mismo criterio y devuelve
`not_active_at_as_of` cuando la trayectoria no estaba vigente.

La semilla local tiene vigencia demostrativa desde 2026-01-01; los datos reales
deberan aportar intervalos y procedencia propios antes de backtesting.
