# Auditoría del contrato UI de Pilot Readiness

`npm run verify` ejecuta `scripts/local-ui-contract-audit.js` para comprobar
que la vista de Pilot Readiness conserva la conexión mínima con el pilot kit:

- refresco de readiness y métricas;
- envío al endpoint de feedback;
- clasificación de evidencia, incluido acceso a datos;
- urgencia de 1 a 5;
- captura de evidencia verificable.

Es una auditoría estructural, no reemplaza una prueba visual en navegador ni
una entrevista real con un cliente.
El mismo auditor verifica que `OperationalScorecardPanel` muestra las tres
latencias del scorecard (`timeToDetectionMinutes`,
`timeToExplanationMinutes` y `timeToDecisionMinutes`) y su nota de evidencia.

Tambien verifica que Operations expone `ExecutionCoveragePanel`, con el
objetivo de eventos historicos y la cobertura de playbooks por vertical inicial.
