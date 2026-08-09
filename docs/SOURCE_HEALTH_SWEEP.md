# Sweep operativo de salud de fuentes

`POST /api/jobs/source-health-sweep` evalua cada fuente local, identifica estados
`stale`, `degraded` o `error`, crea notificaciones deduplicadas y registra el
resultado en la auditoria.

El sweep no intenta reconectar ni activar proveedores. Es el punto local que se
conectara a un scheduler/worker cuando exista infraestructura productiva.
