# Postura de seguridad local

`GET /api/security/posture` consolida los checks técnicos que deben revisarse
antes de llevar el proyecto a infraestructura externa: autenticación, secreto,
CORS, modo de datos, acciones externas, auditoría, snapshot y tenant.

El resultado distingue `pass`, `warn` y `fail`. En desarrollo puede mostrar
warnings por configuración demo; el campo `productionGate` sólo pasa cuando no
hay warnings ni fallos. No equivale a pentest, certificación, RLS productivo,
SSO/MFA ni revisión legal.
Las respuestas HTTP locales incluyen `Content-Security-Policy` restrictiva,
`Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `X-Frame-Options`,
`Referrer-Policy` y `Permissions-Policy`. Son controles del backend local y
deben conservarse junto con CSP/WAF, TLS y cabeceras del proveedor al desplegar.
