# Auditoría local del esquema Supabase

`node scripts/local-supabase-schema-check.js` revisa estáticamente las migraciones preparadas (`001`, `002` y `003_platform_snapshots`):

- tablas base y extensiones enterprise;
- `organization_id` y helper `current_organization_id()`;
- RLS habilitado en todas las colecciones;
- políticas de lectura acotadas a la organización;
- eliminación explícita de las políticas demo de lectura amplia.
- persistencia de snapshots de plataforma y sus políticas de lectura/escritura por organización.

La auditoría es textual y no sustituye ejecutar las migraciones en Supabase staging con dos organizaciones de prueba.
