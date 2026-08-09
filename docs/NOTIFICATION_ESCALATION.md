# Politica local de notificaciones y escalamiento

El backend permite previsualizar una politica de escalamiento por severidad.
La respuesta calcula roles destinatarios, tiempos de escalamiento, canales,
deduplicacion, quiet hours, reintentos y modo de entrega.

Endpoints:

- `GET /api/notifications/policy/readiness`
- `POST /api/notifications/policy/preview`

Los canales externos (`email`, `webhook` y `slack`) permanecen en `dry_run`.
Antes de activarlos se requiere directorio de destinatarios, credenciales,
worker de entrega, politicas de quiet hours y pruebas de rate limit.
