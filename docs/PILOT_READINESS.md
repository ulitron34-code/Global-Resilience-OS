# Preparación de piloto

El bloque local de piloto traduce el Plan Maestro en gates verificables sin fingir
que ya existe un cliente, un baseline de mercado o datos licenciados.

## Rutas

- `GET /api/pilots/readiness`: separa readiness técnico de evidencia de cliente.
- `GET /api/pilots/interview-guide`: guía de cinco secciones con preguntas y evidencia.
- `GET /api/pilots/metrics`: métricas operativas locales y evidencia faltante.
- `GET/POST /api/pilots/feedback`: feedback estructurado con auditoría local.

## Gate de cliente

`customerReady` permanece en `false` hasta contar con entrevistas estructuradas,
un evento real autorizado, baseline histórico y criterio de valor aceptado por el
cliente. Esta decisión es deliberada: el sistema no convierte fixtures demo en
prueba comercial.
