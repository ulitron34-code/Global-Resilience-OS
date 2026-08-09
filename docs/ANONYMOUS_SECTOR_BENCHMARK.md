# Benchmark sectorial anonimizado

`POST /api/network/cooperative/preview` prepara una previsualizaciÃ³n de seÃ±ales
de incidentes anonimizada. Opera en `dry_run_only`, elimina identificadores y
ubicaciones exactas, exige consentimiento explÃ­cito y retiene el paquete vacÃ­o
si no se alcanza la cohorte mÃ­nima.

`GET /api/benchmarks/sectors` agrega outcomes de planes por vertical y aplica una
cohorte minima (`minCohort`, k-anonimato local). Cohortes menores se publican como
`withheld` sin IDs, organizaciones ni métricas individuales.

El benchmark es una semilla para la futura red cooperativa de incidentes. Antes de
usarlo comercialmente se requieren gobernanza entre tenants, consentimiento,
anonimizacion revisada, control de reidentificacion y suficiente muestra histórica.
El preview conserva `consentEvidence` con propósito, actor, fecha y alcance
`dry_run_only`; esto documenta autorización para revisar el paquete, no autoriza
el intercambio real de datos.
El preview conserva también una huella SHA-256 verificable del paquete. La
huella no autoriza intercambio, elimina identificadores antes de compartir y
queda limitada a revisión humana en `dry_run_only`.
