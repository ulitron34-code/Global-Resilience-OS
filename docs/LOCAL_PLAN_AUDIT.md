# Auditoría ejecutable del Plan Maestro

`node scripts/local-plan-audit.js` verifica que cada fase del
`GLOBALRESILIENCE_PLAN_MAESTRO.md` tenga sus artefactos locales mínimos y que
las salvaguardas no confundan capacidades locales con integraciones externas.

La auditoría cubre las fases 0–7 como inventario de preparación local. No marca
como completados los gates que requieren datos licenciados, cuentas, clientes,
infraestructura o validación externa; esos bloqueos permanecen registrados en
`docs/ENTERPRISE_READINESS.md` y `docs/FINAL_HANDOFF_STATUS.md`.

## Resultado esperado

- `gate: PASS` significa que todos los artefactos locales requeridos existen.
- `localPlanArtifacts` resume cada fase y su cobertura.
- `safety` confirma acciones externas desactivadas por defecto, conectores
  `dry_run_only`, separación local/externa y exclusión del estado mutable.
