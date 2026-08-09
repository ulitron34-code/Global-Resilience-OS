# Decision sharing local

La plataforma permite crear un enlace temporal de solo lectura para que un
analista comparta un paquete de decisión con un revisor o cliente piloto.

## Contrato

- `GET /api/cases/:id/shares` lista metadatos; nunca devuelve tokens ni hashes.
- `POST /api/cases/:id/shares` recibe `{ "expiresInHours": 72, "audience": "cliente piloto" }`.
- La respuesta de creación entrega el token claro una sola vez y una ruta
  `/api/shares/<token>`; el almacenamiento sólo conserva SHA-256 del token.
- `POST /api/cases/:caseId/shares/:shareId/revoke` revoca el enlace de forma
  auditable e idempotente.
- `GET /api/shares/:token` devuelve el paquete en modo solo lectura, incrementa
  el contador de accesos y no se puede cachear.
- La URL para usuarios es `/share/<token>`; Vercel la reescribe al shell de la
  SPA y `DecisionRoom` consulta el endpoint API sin mostrar la aplicación
  operativa ni habilitar mutaciones.

## Límites deliberados

La capacidad es local y está pensada para preparar revisión humana. El token no
sustituye autenticación enterprise, RLS, DPA, políticas de retención ni un
portal multi-tenant. La duración se limita a 1–720 horas; los paquetes siguen
mostrando sus disclaimers de datos demo y evidencia no calibrada.

Antes de producción se debe migrar el registro de enlaces a Supabase, aplicar
RLS por organización, añadir rate limiting específico para enlaces, registrar
IP/actor conforme a la política de privacidad y revisar la exposición de cada
campo del paquete.
## Protección local

El endpoint público aplica un límite específico de 60 accesos por minuto por
IP y token, responde `429` con `Retry-After: 60` y conserva `Cache-Control:
no-store`. Este control local no sustituye WAF, CDN, almacenamiento gestionado
ni políticas de privacidad del entorno productivo.
