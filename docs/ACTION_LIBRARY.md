# Biblioteca local de acciones de resiliencia

La plataforma incluye un catalogo local de medidas de mitigacion para convertir
un escenario en alternativas comparables. Cada entrada conserva tipo de accion,
tipo de proveedor, plazo estimado, costo demostrativo, capacidad relativa,
prerrequisitos y evidencia requerida.

Endpoints:

- `GET /api/actions/library`
- `GET /api/actions/library/:id`
- `GET /api/actions/library/readiness`
- `POST /api/actions/recommendations`

El catalogo es intencionalmente no ejecutable. Antes de produccion debe sustituirse
por proveedores, contratos, disponibilidad y precios verificados; la recomendacion
requiere aprobacion humana y el resultado debe registrarse en Action OS.
