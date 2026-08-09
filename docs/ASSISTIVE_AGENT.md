# Agente asistivo local con límites

`POST /api/assistant/suggestion` genera una propuesta estructurada de triage a
partir del tipo de evento, severidad, confianza e impacto. Selecciona un playbook,
resume los pasos y devuelve un preview de Action OS.

Guardrails obligatorios:

- `suggestion_only`;
- aprobación humana requerida;
- ejecución automática deshabilitada;
- acciones externas deshabilitadas;
- abstención si el gate de datos o gobernanza del modelo no está listo.

Es una semilla local para un futuro agente asistivo. No representa una integración
LLM ni autoriza automatización operacional.
