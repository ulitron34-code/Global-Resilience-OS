# Auditoría de rutas OpenAPI

`node scripts/local-openapi-route-audit.js` compara las rutas Express
publicadas por `backend/server.js` con las operaciones documentadas en
`docs/openapi.local.json`.

El gate falla si una ruta pública no tiene contrato OpenAPI o si existe una
declaración duplicada de método y ruta. Los parámetros Express (`:id`) se
normalizan a la forma OpenAPI (`{id}`).
