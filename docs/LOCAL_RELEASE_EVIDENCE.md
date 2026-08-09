# Evidencia de release local

El comando único:

```powershell
node scripts/local-release-evidence.js
```

ejecuta backend tests, lint, build/artefacto, smoke end-to-end, rendimiento,
auditoría portable, instalación reproducible, esquema Supabase local, plan,
OpenAPI y release gate. Devuelve un JSON por gate y termina con código distinto
de cero si alguno falla.

El orquestador ejecuta el build real mediante `scripts/build-frontend.js`, que
entra al directorio `frontend` antes de lanzar Vite, y ejecuta además
`scripts/standalone-artifact-check.js`, que sirve el artefacto con un servidor
HTTP local, verifica que HTML y assets respondan sin backend y confirma que el
aviso de datos ilustrativos permanezca dentro del bundle.

También ejecuta `scripts/pdf-export-check.js`, que genera un reporte con el
mismo módulo usado por el botón del frontend y verifica la firma `%PDF-`.

No requiere GitHub, Supabase, Vercel ni credenciales externas; es un control
reproducible para la copia local/USB.

En el entorno de trabajo restringido actual, el subproceso de esbuild puede
fallar con `Acceso denegado` al resolver `frontend/vite.config.js`. Ese caso
debe conservarse como `FAIL` hasta repetir el build en una PowerShell normal;
no se debe convertir en un PASS artificial.
