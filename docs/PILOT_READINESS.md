# Preparación de piloto

El bloque local de piloto traduce el Plan Maestro en gates verificables sin fingir
que ya existe un cliente, un baseline de mercado o datos licenciados.

## Rutas

- `GET /api/pilots/readiness`: separa readiness técnico de evidencia de cliente.
- `GET /api/pilots/interview-guide`: guía de cinco secciones con preguntas y evidencia.
- `GET /api/pilots/metrics`: métricas operativas locales y evidencia faltante.
- `GET/POST /api/pilots/feedback`: feedback estructurado con auditoría local.

`GET /api/pilots/package?format=json|markdown` exporta el paquete consolidado de preparación de piloto.

## Gate de cliente

El runtime local exige al menos cinco entrevistas estructuradas, dos problemas
con urgencia alta y evidencia de acceso a datos antes de marcar `customerReady`;
una sola revisión no es suficiente.

`customerReady` permanece en `false` hasta contar con entrevistas estructuradas,
un evento real autorizado, baseline histórico y criterio de valor aceptado por el
cliente. Esta decisión es deliberada: el sistema no convierte fixtures demo en
prueba comercial.
El paquete de piloto incluye `organizationId` y `packageMetadata` para
identificar el tenant, el tipo de artefacto y que la evidencia externa sigue
siendo requerida; la exportación Markdown conserva esos metadatos.
Las exportaciones incluyen además una huella `sha256` con canonicalización
`sorted-json-v1`; sirve para detectar modificaciones posteriores del paquete,
pero no sustituye firma criptográfica gestionada ni validación legal.
