# Checklist de handoff externo

## Estado confirmado

- GitHub: el repositorio remoto sigue en `8a0cfc2`; los commits locales `a15750d`, `2820e23` y `43bd120` están listos, pero el push requiere recuperar permisos/conectividad HTTPS.
- Supabase: migraciones `001_initial_schema.sql`, `002_enterprise_extensions.sql` y `003_platform_snapshots.sql` aplicadas.
- Supabase: tablas principales y `platform_snapshots` verificadas; RLS activo con 3 políticas de organización.
- Vercel: interfaz pública activa y mini-backend conectado.
- Render: servicio configurado con `AUTH_REQUIRED=true`, acciones externas deshabilitadas y datos ilustrativos; la activación final del adaptador remoto queda pendiente de redeploy.

## Variables de Render

Configurar en el servicio backend, nunca en el repositorio:

```text
AUTH_SECRET=<secreto aleatorio de al menos 48 caracteres>
CORS_ORIGIN=https://global-resilience-os.vercel.app
SUPABASE_URL=https://mhcpgjubmltcezxoysng.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<clave privada de Supabase>
SUPABASE_TIMEOUT_MS=5000
PERSISTENCE_MODE=supabase  # activar en Render despues de la validacion RLS y el redeploy
```

`SUPABASE_SERVICE_ROLE_KEY` no debe colocarse en Vercel ni exponerse al navegador. El backend ya contiene el adaptador de persistencia transaccional y el endpoint `/api/runtime/supabase/persistence` para verificar su estado después del redeploy.

## Validación posterior al redeploy

1. Abrir `/api/health` y confirmar `status: ok`.
2. Abrir `/api/runtime/supabase` y confirmar que las variables están configuradas sin mostrar sus valores.
3. Abrir `/api/runtime/supabase/check` desde una ruta protegida de operación y confirmar respuesta `200`.
4. Ejecutar el smoke test de la interfaz pública.
5. Revisar logs de Render y confirmar que no aparecen claves, tokens ni payloads sensibles.

## Criterio para activar persistencia remota

No considerar cerrado el cambio a `PERSISTENCE_MODE=supabase` hasta contar con:

- adaptador transaccional para las escrituras del dominio;
- pruebas de aislamiento entre dos organizaciones;
- prueba de recuperación ante fallo de Supabase;
- migración de datos demo separada de datos de piloto;
- revisión de retención, auditoría y backups.
