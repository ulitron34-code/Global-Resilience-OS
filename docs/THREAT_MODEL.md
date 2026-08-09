# Threat model local — Global Resilience OS

## Alcance

Este modelo cubre la demo portable y el backend local antes de conectar
GitHub, Supabase, Vercel o proveedores de datos. No certifica un entorno
productivo ni sustituye una evaluación independiente.

## Activos y límites de confianza

| Activo | Riesgo principal | Control local |
|---|---|---|
| Sesiones y roles | Suplantación o escalamiento | Tokens firmados, revocación y RBAC |
| Planes de acción | Ejecución prematura o exposición entre organizaciones | Aprobación humana, transiciones controladas y `organizationId` |
| Eventos y fuentes | Manipulación, duplicados o datos sin licencia | Envelope, deduplicación, procedencia y DLQ |
| Auditoría | Alteración posterior | Cadena hash y exportación |
| Estado JSON | Pérdida o copia accidental | Snapshot/restore y exclusión del estado portable |
| Webhooks | Fuga de secretos o replay | HMAC, rotación, timestamp, delivery ID y modo dry-run |

## Escenarios priorizados

1. **Credenciales demo expuestas:** mitigado parcialmente; el modo producción
   bloquea el login demo y exige `AUTH_SECRET`, `AUTH_REQUIRED` y CORS explícito.
2. **Acceso cross-tenant:** mitigado para planes de acción locales; el resto de
   entidades requiere RLS al migrar a Supabase.
3. **Acción externa no autorizada:** el backend mantiene `ALLOW_EXTERNAL_ACTIONS`
   desactivado por defecto y los conectores están en `dry_run_only`.
4. **Fuente manipulada o vieja:** el contrato exige procedencia, el catálogo
   registra freshness/licencia y readiness puede bloquear datos insuficientes.
5. **Corrupción o pérdida de estado:** snapshot, restore validado y hash de
   auditoría permiten detectar o recuperar el estado local.
6. **Denegación de servicio básica:** límite local por IP, payloads acotados en
   dominios y health/readiness para operación controlada.

## Pendientes antes de producción

- proveedor de identidad con MFA/SSO;
- secretos en un vault y rotación automatizada;
- cifrado gestionado, RLS para todas las tablas y prueba de aislamiento;
- backups automáticos con restore periódico en entorno separado;
- logs centralizados, alertas, tracing y respuesta a incidentes;
- revisión de dependencias, DPA, retención y clasificación de datos;
- prueba de penetración y revisión legal de fuentes/licencias.
