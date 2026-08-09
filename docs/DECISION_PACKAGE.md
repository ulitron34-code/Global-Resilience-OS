# Paquete de decision enriquecido

La exportacion local de un caso conserva ahora una vista integrada de:

- caso y alerta original;
- fuentes, modelos, escenarios, comentarios y auditoria;
- planes de accion de la organizacion activa;
- perfil contrafactual de recuperacion;
- mapa de evidencia regulatoria;
- cadena de evidencia con fuentes observadas, modelos inferidos y escenarios asumidos;
- capacidades y descargos del paquete.

Cada escenario expone `evidenceClass` (`observed`, `inferred` o `assumed`) y un
objeto `evidence` con fuentes, modelo, observaciones, inferencias y supuestos.

Endpoints: `GET /api/cases/:id/decision-package?format=json|markdown`. JSON sirve
el artefacto técnico; Markdown genera una lectura compacta para comité u
operador y conserva los mismos descargos.

El paquete es un artefacto local para revision humana. No acredita cumplimiento,
no valida causalidad y no ejecuta ninguna accion externa.
