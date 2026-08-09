# Release checklist local

## Gate técnico

- [x] `backend npm test` pasa sin fallos.
- [x] `frontend npm run lint` pasa sin warnings accionables.
- [x] `frontend npm run build` genera un artefacto reproducible.
- [x] `scripts/standalone-artifact-check.js` sirve `frontend/dist` y verifica HTML/assets sin backend.
- [x] Smoke test cubre health, simulación, ingesta, deduplicación, graph,
  action plan, webhooks, readiness, exportaciones y auditoría.
- [x] `docs/openapi.local.json` parsea como JSON.
- [x] `scripts/portable-check.ps1` no encuentra secretos ni estado local.
- [x] `scripts/local-installation-check.js` acepta manifests, lockfiles y `npm ci --dry-run`.
- [x] `npm audit --omit=dev` pasa en backend y frontend; conservar `DEPENDENCY_AUDIT.md`.
- [x] Conservar `FINAL_HANDOFF_STATUS.md` con evidencia local y pendientes externos explícitos.

## Gate de producto

- [x] Cada resultado distingue observado, inferido y supuesto.
- [x] Ningún plan puede pasar a aprobado sin aprobación humana.
- [x] Todo cierre de plan registra outcome.
- [x] Toda recomendación material conserva fuente, modelo, supuestos y vigencia.
- [x] Las fuentes ilustrativas permanecen etiquetadas como demo.

## Gate de seguridad

- [x] `APP_MODE=production` bloquea login demo y listado de usuarios demo;
  evidencia: `backend/test/productionSecurity.test.js`.
- [ ] `AUTH_REQUIRED=true`, `AUTH_SECRET` fuerte y `CORS_ORIGIN` explícito.
- [ ] `DATA_MODE` no es `illustrative` en producción.
- [ ] `ALLOW_EXTERNAL_ACTIONS=false` durante el primer despliegue.
- [ ] Se ha revisado `docs/THREAT_MODEL.md` y se ha documentado cada excepción.

## Evidencia a conservar

Guardar el resultado de tests, smoke, build, readiness, backup/restore,
revisión de dependencias y aprobación del release junto con el identificador de
la versión. Este checklist no autoriza todavía un despliegue externo.
