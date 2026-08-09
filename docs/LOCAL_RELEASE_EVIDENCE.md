# Evidencia de release local

El comando único:

```powershell
node scripts/local-release-evidence.js
```

ejecuta backend tests, lint, build/artefacto, smoke end-to-end, rendimiento,
auditoría portable, instalación reproducible, esquema Supabase local, plan,
OpenAPI y release gate. Devuelve un JSON por gate y termina con código distinto
de cero si alguno falla.

En Windows, por una restricción del lanzamiento anidado de esbuild, el
orquestador valida el artefacto existente (`frontend/dist/index.html` y
`frontend/dist/assets`) y ejecuta además `scripts/standalone-artifact-check.js`,
que sirve el artefacto con un servidor HTTP local y verifica que HTML y assets
respondan sin backend. En CI/Linux el build se ejecuta directamente dentro del
orquestador.

El build directo debe repetirse en la máquina de destino si el entorno local
de Windows bloquea el proceso anidado de esbuild. La prueba standalone no
simula datos ni despliegues externos.

No requiere GitHub, Supabase, Vercel ni credenciales externas; es un control
reproducible para la copia local/USB.
