# Limitaciones de esta demo — léelo antes de presentarla

Esto existe porque una demo que se ve muy pulida puede hacer que quien la ve
(o quien la presenta) olvide qué tan validado está realmente el contenido.
Ser explícito sobre esto no resta seriedad al proyecto — la resta ocultarlo
y que un inversionista técnico lo detecte solo.

## Qué es real

- La lista de 12 verticales críticas y la lógica de negocio detrás del
  business plan.
- Los nombres y rutas aproximadas de los 12 cables submarinos (son cables
  reales que existen — SEA-ME-WE 3, 2Africa, MAREA, etc.).
- Los 4 chokepoints marítimos (Ormuz, Suez, Malaca, Bab-el-Mandeb) y su
  participación aproximada en comercio global — estos números sí son de
  dominio público y razonablemente conocidos.
- El concepto central: que un cable puede afectar múltiples verticales
  simultáneamente por compartir infraestructura digital.

## Qué es ilustrativo (no validado, no usar para decisiones reales)

- **Los valores de flujo diario en USD por vertical** (`data/verticals.js`).
  Son estimaciones de orden de magnitud para que la demo produzca números
  que se vean coherentes, no cifras de una fuente de datos de mercado.
- **Las rutas exactas (waypoints) de cada cable.** Simplificadas para
  visualización en el mapa, no coordenadas de cable reales verificadas.
- **Los pesos de correlación cable→vertical** (`vertical_weights` en
  `cables.js`). Son heurísticas razonadas por el modelo del negocio, no
  medidas empíricamente contra datos históricos de rupturas reales.
- **El "impacto sistémico base" de 12%.** Es un supuesto de modelo para
  ilustrar el concepto, no una cifra derivada de análisis de datos.

## Qué significa esto para cómo presentarla

**Sí puedes decir:** "así es como se vería la herramienta, así es como
pensamos que funciona el cálculo conceptualmente."

**No digas:** "estos son los números reales" o "esto ya está validado con
datos de mercado" — no lo está, y si un inversionista técnico pregunta
"¿de dónde sale este 12%?" la respuesta honesta es "es un supuesto de
diseño del modelo, pendiente de validar con datos históricos reales" — esa
respuesta es más creíble que inventar una fuente.

Esta misma lógica aplica en el frontend: el badge "DEMO — DATOS
ILUSTRATIVOS" en el header y el disclaimer en cada PDF exportado están ahí
a propósito. No los quites para que la demo "se vea más real" — quitarlos
sería la clase de sobre-promesa que el análisis PREMORTEMV3 señaló como una
de las razones probables de rechazo por inversionistas serios.
