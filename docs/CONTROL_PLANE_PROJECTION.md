# Proyección del control plane

`backend/domain/controlPlaneProjection.js` transforma las colecciones locales
de notificaciones, webhooks, entregas y jobs en filas compatibles con la
migración Supabase 005.

Principios:

- filtra por `organizationId` antes de proyectar;
- exige el UUID real de la organización destino;
- genera UUIDs deterministas por tabla, organización e ID local;
- conserva el ID local en payload o métricas para reconciliación;
- nunca proyecta el secreto plano de un webhook;
- descarta entregas cuyo webhook no pertenece al tenant;
- permite pasar `projectionTimestamp` para backfills idempotentes;
- valida tenant, claves foráneas y ausencia de secretos antes del upsert.

La capa está probada localmente, pero no activa todavía la escritura en
Supabase. Esa activación pertenece al tramo externo, junto con backfill,
concurrencia, claims JWT y prueba con dos organizaciones.
