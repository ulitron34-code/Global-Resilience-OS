# Auditoría de dependencias

La última ejecución con acceso al registro npm reportó cero vulnerabilidades
en backend y frontend. La ejecución más reciente no pudo consultar el endpoint
de advisories por conectividad, por lo que el estado actual debe considerarse
no verificado hasta repetir:

```powershell
npm.cmd audit --omit=dev --prefix backend
npm.cmd audit --omit=dev --prefix frontend
```

No se debe interpretar un fallo de red como un resultado limpio. La revisión
debe repetirse en CI y antes de cada despliegue porque las advisories pueden
cambiar.
