# Contrato de configuración por entorno

El endpoint `GET /api/runtime/config-contract` valida la configuración sin
devolver secretos:

- `demo`: permite datos ilustrativos y autenticación opcional, pero mantiene
  acciones externas desactivadas;
- `staging`: conserva controles explícitos y sirve para probar la transición;
- `production`: exige autenticación, `AUTH_SECRET` de al menos 32 caracteres,
  `DATA_MODE` no ilustrativo, `CORS_ORIGIN` definido y persistencia Supabase
  con `PERSISTENCE_MODE=supabase`, clave de servidor y
  `SUPABASE_ORGANIZATION_SLUG`.

El contrato solo comprueba la configuración visible al proceso local. No
sustituye secretos gestionados, IAM, pruebas de RLS ni controles del proveedor.
