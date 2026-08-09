# Registro local de contratos versionados

El backend publica contratos versionados para los objetos que cruzan los limites
entre ingesta, modelos, Action OS y evidencia:

- `event-envelope`;
- `action-plan`;
- `action-plan-outcome`;
- `impact-edge`;
- `regulatory-evidence`.

Endpoints:

- `GET /api/contracts`
- `GET /api/contracts/:id`
- `GET /api/contracts/readiness`

El registro es la referencia local para generar clientes, restricciones de base
de datos y pruebas de adaptadores cuando se conecten Supabase y proveedores.
