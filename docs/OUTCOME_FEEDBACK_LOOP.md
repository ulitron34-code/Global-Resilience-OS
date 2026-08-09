# Outcome feedback loop

El resultado observado ahora se conserva en `outcomeEvidenceRecord`, clasificado
como `observed`, con la referencia de evidencia, los campos observados y su
incorporación a la cadena de evidencia del plan. `outcomeEvidence` se mantiene
como referencia textual compatible.

Cuando un plan llega a `in_execution`, el operador puede registrar:

- `actualLossUsd`;
- `actualRecoveryHours`;
- `evidenceRef` obligatorio;
- una descripción del resultado.

`POST /api/action-plans/:id/outcome` cierra el plan, calcula el error absoluto
contra `economics.lossIfWaitUsd` y conserva la evidencia. `GET
/api/action-plans/metrics` devuelve el error medio y máximo de la organización
local. Es una base de calibración, no una validación estadística hasta contar
con suficientes eventos históricos.
