# Gate de datos aplicado a Action OS

Cada `POST /api/action-plans/preview` devuelve:

- `evidence.sourceIds`, `evidence.model`, `evidence.assumptions` y
  `evidence.validity` como contrato estructurado; sin fuente enlazada el plan
  queda marcado `incomplete_until_source_linked` y no se presenta como listo
  para producción.

- `dataQualityGate` con licencia, cobertura y frescura por fuente;
- el preview evalúa únicamente las fuentes declaradas en `evidence.sourceIds`,
  mientras el endpoint global conserva la auditoría de todo el catálogo;
- `materialRecommendationAllowed`, que solo es verdadero cuando pasan el gate
  de calidad, la decisión no abstiene y la evidencia enlaza una fuente
  productiva no ilustrativa;
- la decision original del motor y el descargo correspondiente.

El plan puede seguir guardandose como borrador local para demostracion y revision,
pero una recomendacion material queda marcada como abstencion hasta que el gate
de datos pase. Esto conserva la trazabilidad sin presentar datos demo como una
recomendacion productiva.
