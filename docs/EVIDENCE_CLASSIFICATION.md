# Clasificación estructurada de evidencia

Los resultados materiales locales exponen `evidenceClass` con uno de estos
valores:

- `observed`: evento recibido de una fuente y conservado con timestamp y
  procedencia;
- `inferred`: relación o cálculo derivado de datos observados;
- `assumed`: seed, heurística o supuesto de demostración todavía no validado.

La simulación económica local y los seeds del Impact Graph se marcan
`assumed`. Esto evita que un resultado ilustrativo parezca una observación de
mercado o una causalidad validada. Al conectar fuentes autorizadas, los
adaptadores podrán elevar la clasificación mediante su contrato de
procedencia, licencia y revisión.
