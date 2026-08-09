# Auditoría local de handoff externo

`node scripts/local-external-handoff-audit.js` valida que el checkout contiene
el paquete necesario para pasar a GitHub, Supabase, Render y Vercel: manifiesto
de despliegue seguro, plantillas de entorno, workflow de CI, migraciones SQL en
orden y checklist operativo.

Un `PASS` sólo significa que el paquete local está preparado. No confirma la
publicación del repositorio, la ejecución de CI, la aplicación de migraciones,
el aislamiento RLS, el redeploy ni la disponibilidad de datos licenciados.

Los bloqueadores externos que imprime el auditor son deliberados y deben
resolverse en staging antes de cambiar `DATA_MODE` a `licensed` o habilitar
persistencia y acciones productivas.
