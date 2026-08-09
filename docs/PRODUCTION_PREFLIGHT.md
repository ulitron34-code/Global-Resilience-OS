# Preflight local de producción

`npm.cmd run check:production-preflight` valida antes del handoff:

- contrato de producción completo y rechazo de configuración ilustrativa;
- bloqueo de fuentes demo y aceptación de una fuente con licencia completa;
- proyección determinista del control plane para dos tenants;
- aislamiento de filas, claves foráneas y ausencia de secretos planos.

El preflight no conecta con Supabase ni despliega. La prueba equivalente en
staging todavía debe ejecutar RLS con dos organizaciones reales, secretos
gestionados, runtime desplegado y datos licenciados.
