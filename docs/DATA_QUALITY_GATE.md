# Gate local de calidad de datos materiales

El sistema ahora evalua antes de recomendar si cada fuente requerida tiene:

- licencia activa;
- cobertura no ilustrativa;
- frescura dentro del SLA;
- campos y procedencia suficientes.

Si una comprobacion falla, la decision es `abstain_material_recommendations`.
Esto evita presentar seeds de demo como evidencia operativa.

Endpoints:

- `GET /api/data-quality/gate`
- `POST /api/data-quality/validate`

El gate local no sustituye contratos, auditoria de licencias ni validacion de
exactitud con eventos historicos.
