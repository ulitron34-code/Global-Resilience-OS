# Incertidumbre y abstención

`POST /api/models/uncertainty` recibe una estimación puntual, confianza y tamaño
de muestra. Sin al menos tres fixtures y confianza mínima de 0.5 devuelve un
intervalo nulo y `abstain_material_interval`.

Cuando existe evidencia suficiente devuelve una envolvente heurística etiquetada
como revisión, nunca como intervalo estadístico validado. Esto mantiene visible
la incertidumbre del producto mientras llega la calibración histórica real.
