# Postura de seguridad local

`GET /api/security/posture` consolida los checks técnicos que deben revisarse
antes de llevar el proyecto a infraestructura externa: autenticación, secreto,
CORS, modo de datos, acciones externas, auditoría, snapshot y tenant.

El resultado distingue `pass`, `warn` y `fail`. En desarrollo puede mostrar
warnings por configuración demo; el campo `productionGate` sólo pasa cuando no
hay warnings ni fallos. No equivale a pentest, certificación, RLS productivo,
SSO/MFA ni revisión legal.
