# Enterprise Readiness local

`GET /api/readiness/enterprise` consolida el estado del handoff:

- checks locales de runtime, configuración, seguridad, esquema y release;
- checks externos de licencias, staging Supabase/RLS, hosting/observabilidad y piloto;
- decisión explícita `proceed_to_external_gates` o `continue_local_hardening`;
- siguiente paso y evidencia de cada bloqueo.

El endpoint no marca como listos los componentes que requieren cuentas, datos,
credenciales o usuarios reales. Los checks de esquema y release sólo pasan
cuando el proceso que ejecutó la evidencia establece explícitamente:

```powershell
$env:LOCAL_RELEASE_GATE_VERIFIED = 'true'
```

El valor no debe fijarse permanentemente en Render o Vercel: representa una
ejecución verificable del checkout actual y debe repetirse después de cada
cambio o despliegue.
