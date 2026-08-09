# Release gate local

`node scripts/local-release-gate.js` comprueba que la copia portable contiene
los artefactos esenciales, que OpenAPI es valido, que el estado local esta
excluido, que los conectores estan en dry-run y que existen los controles de
abstencion de datos y aprobacion humana.

Este gate es complementario a:

- `backend`: `npm test`;
- `frontend`: `npm run lint` y `npm run build`;
- `node scripts/local-smoke-test.js`;
- `scripts/portable-check.ps1`.

No sustituye CI, RLS, revision de dependencias, backup/restore externo ni
pruebas de seguridad de produccion.
