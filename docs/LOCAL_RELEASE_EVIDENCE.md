# Evidencia de release local

El comando único:

```powershell
node scripts/local-release-evidence.js
```

ejecuta backend tests, lint, build, smoke end-to-end, rendimiento, auditoría portable, release gate y parseo de OpenAPI. Devuelve un JSON resumido con el estado de cada gate y termina con código distinto de cero si alguno falla.

En Windows, por una restricción del lanzamiento anidado de esbuild, el orquestador comprueba `frontend/dist/index.html` y `frontend/dist/assets`; el build directo se ejecuta con `npm.cmd run build` y queda documentado por el gate de frontend. En CI/Linux el build se ejecuta directamente dentro del orquestador.

No requiere GitHub, Supabase, Vercel ni credenciales externas; es un control reproducible para la copia local/USB.
