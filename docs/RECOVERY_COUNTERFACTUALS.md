# Recovery Counterfactuals

`POST /api/recovery/profile` compara sin intervención, reruteo, proveedor
alterno y capacidad de contingencia en horizontes configurables. Para cada
opción devuelve tiempo de respuesta, costo, efectividad asumida, exposición
residual, pérdida evitada y valor neto.

Los valores actuales son supuestos locales para hacer visible el mecanismo del
producto. El endpoint conserva el supuesto de recuperación natural, marca el
modelo como heurístico y no debe interpretarse como pronóstico hasta disponer
de eventos históricos, datos licenciados y calibración.
