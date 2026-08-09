# Contratos de adaptadores locales

Cada conector declara `sourceId`, dominio, modo operativo, tipos de evento
esperados y campos requeridos. La validacion especifica del adaptador se ejecuta
antes de la validacion general del envelope.

Endpoint:

`POST /api/connectors/:id/validate`

Una respuesta valida significa solamente `ready_for_envelope_validation`; no
confirma licencia, frescura, exactitud ni disponibilidad de un proveedor. Todos
los conectores locales siguen en `dry_run_only`.

`GET /api/connectors/readiness` ejecuta un gate estructural sobre el registro:
IDs y fuentes únicas, campos mínimos, tipos de evento y modo seguro. Un resultado
`ready: true` sólo significa que el contrato local está completo; la propiedad
`externalIntegrationReady` permanece en `false` hasta conectar un proveedor
autorizado y validarlo en staging.
