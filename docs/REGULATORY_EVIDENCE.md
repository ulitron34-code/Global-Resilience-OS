# Regulatory Evidence Plane

El backend contiene un catálogo local de controles para NIST CSF 2.0 GV.SC,
NIST SP 800-161, DORA, NIS2/CER e ITU Submarine Cable Resilience.

Endpoints:

- `GET /api/regulatory/frameworks`
- `GET /api/regulatory/frameworks/:id`
- `POST /api/regulatory/evidence-map`

La matriz distingue `evidence_required` de `operator_verified_local`, conserva
la referencia aportada por el operador y muestra conteos de cobertura. Es una
ayuda de preparación y trazabilidad; no constituye certificación, opinión legal
ni declaración de cumplimiento.
