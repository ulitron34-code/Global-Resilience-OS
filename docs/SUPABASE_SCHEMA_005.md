# Supabase schema 005 — control plane operativo

`docs/supabase/005_control_plane_extensions.sql` prepara la proyección
normalizada de cuatro colecciones que antes vivían únicamente dentro del
snapshot operativo:

- `notifications`: avisos por organización, lectura y referencia opcional a
  caso o fuente.
- `webhooks`: endpoints por organización, eventos autorizados y referencia
  segura al secreto; el secreto plano no debe persistirse en Supabase.
- `webhook_deliveries`: outbox, intentos, respuesta, errores y reintentos.
- `job_runs`: historial de jobs, estado, métricas y errores.

Todas las tablas tienen `organization_id`, índices operativos y RLS. Las
lecturas se limitan al tenant del JWT; las escrituras requieren el rol
adecuado. La migración está preparada localmente y debe aplicarse en staging
antes de usarla con claims reales.

Esta migración no declara terminada la persistencia productiva: el adaptador
actual conserva el snapshot como respaldo hasta completar la proyección,
backfill, pruebas de concurrencia y validación de dos organizaciones.
