# Addendum de capacidades locales

Este addendum complementa la matriz existente:

- Action OS con preview económico, borrador, aprobación humana y ciclo
  `approved -> in_execution -> completed` con `outcome` obligatorio.
- Aislamiento local por `organizationId` para planes de acción y endpoint
  `/api/tenancy/context`; el aislamiento completo queda para RLS.
- Panel Operations conectado a playbooks, preview, guardado y aprobación.
- Threat model, release checklist y requisitos de datos documentados.
- Evidence plane regulatorio local para NIST, DORA, NIS2/CER e ITU, con matriz
  de controles y evidencia requerida/verificada.
- Contrafactuales de recuperación en `POST /api/recovery/profile` con
  exposición residual, pérdida evitada, costo y valor neto por horizonte.

La validación actual se ejecuta con los comandos indicados en
`docs/LOCAL_CAPABILITY_MATRIX.md`: backend tests, smoke, frontend lint y
frontend build.
