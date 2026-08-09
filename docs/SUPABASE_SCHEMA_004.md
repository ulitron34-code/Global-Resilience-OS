# Migracion Supabase 004: extensiones operativas

`docs/supabase/004_operational_extensions.sql` prepara las colecciones
normalizadas que faltaban para evolucionar el snapshot local hacia persistencia
multi-tenant:

- `action_plan_events`: historial de transiciones y decisiones.
- `decision_shares`: enlaces temporales de Decision Room sin guardar el token
  claro.
- `source_intake_reviews`: aprobacion humana y estado de activacion de fuentes.
- `calibration_fixtures`: eventos historicos y resultados para calibracion.
- `incidents`: ciclo de vida de incidentes operativos.

Todas las tablas incluyen `organization_id`, indices operativos, RLS y una
politica de lectura acotada a `current_organization_id()`. La migracion esta
preparada localmente, pero debe ejecutarse en staging junto con la prueba de
dos organizaciones antes de sustituir el snapshot o aceptar datos reales.
