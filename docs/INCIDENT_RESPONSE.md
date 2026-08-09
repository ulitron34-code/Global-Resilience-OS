# Registro y respuesta de incidentes

El módulo local agrega un registro auditable para incidentes de plataforma y
fuentes. Conserva severidad, owner, estado, fuentes afectadas y una línea de
tiempo. No ejecuta cambios externos.

## Rutas

- `GET /api/incidents/runbook`: objetivos de reconocimiento, pasos y evidencia.
- `GET /api/incidents`: registro local filtrable.
- `POST /api/incidents`: abre un incidente y deja auditoría.
- `PATCH /api/incidents/:id`: actualiza estado o nota de respuesta.

## Estados

`open → triaged → contained → recovering → resolved → closed`.

El cierre debe acompañarse de una nota de cierre y evidencia; el runbook exige
revisión humana y mantiene desactivadas las acciones automáticas externas.
