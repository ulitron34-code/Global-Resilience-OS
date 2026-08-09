# Smoke test local

Desde la raíz del proyecto:

```powershell
node scripts/local-smoke-test.js
```

El resultado esperado es `LOCAL SMOKE TEST: PASS`. El script levanta el
backend en un puerto efímero, ejecuta el ciclo de login, simulación, ingesta,
deduplicación, caso, comentario, actualización, webhook, outbox, job,
readiness, exportación y auditoría, y después cierra el servidor.

Usa `NODE_ENV=test`, por lo que no modifica el estado persistido local.
