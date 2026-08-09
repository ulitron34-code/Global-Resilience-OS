# Contrato de configuración por entorno

El endpoint `GET /api/runtime/config-contract` valida la configuración sin devolver secretos:

- `demo`: permite datos ilustrativos y autenticación opcional, pero mantiene acciones externas desactivadas;
- `staging`: conserva controles explícitos y sirve para probar la transición;
- `production`: exige autenticación, `AUTH_SECRET` de al menos 32 caracteres, `DATA_MODE` no ilustrativo y `CORS_ORIGIN` definido.

El contrato sólo comprueba la configuración visible al proceso local. Supabase, Vercel, secret managers, SSO/MFA y rotación operativa permanecen en el tramo externo.
