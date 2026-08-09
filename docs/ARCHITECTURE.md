# Arquitectura

## Visión general

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (React + Vite)                                 │
│                                                            │
│  ┌──────────┐  ┌───────────┐  ┌─────────────┐            │
│  │ WorldMap │  │ CableList │  │ ScenarioBuilder│          │
│  └────┬─────┘  └─────┬─────┘  └──────┬──────┘            │
│       │              │               │                    │
│       └──────────────┴───────────────┘                    │
│                       │                                    │
│              ┌────────▼─────────┐                          │
│              │  useAppStore      │  (Zustand)              │
│              │  (estado global)  │                          │
│              └────────┬─────────┘                          │
│                       │                                    │
│              ┌────────▼─────────┐                          │
│              │  api/client.js    │                          │
│              └────────┬─────────┘                          │
└───────────────────────┼────────────────────────────────────┘
                         │
              ┌──────────┴───────────┐
              │                      │
       (1.2s timeout)          (si falla)
              │                      │
   ┌──────────▼─────────┐  ┌────────▼──────────┐
   │  Backend Express     │  │  Motor local        │
   │  POST /simulate-     │  │  (mismo código,     │
   │  rupture             │  │  corre en browser)  │
   └──────────┬───────────┘  └────────┬────────────┘
              │                       │
              └───────────┬───────────┘
                          │
                 computeImpact()
                 (misma lógica en ambos lados)
```

## Por qué esta arquitectura

**El motor de impacto (`impactEngine.js`) vive duplicado en frontend y
backend, no como paquete compartido.** Es una decisión deliberada para esta
etapa de demo: mantiene el frontend 100% autocontenido (puede abrirse sin
ningún servidor corriendo) sin la complejidad de un monorepo con paquete
compartido. **Cuando esto pase a desarrollo real, esto debe cambiar** — mover
`engine/` y `data/` a un paquete npm compartido (`packages/core`) que ambos
consuman, para eliminar el riesgo de que las dos copias diverjan.

**El fallback local no es solo un truco de demo — es una decisión de
producto real.** Un ejecutivo de oil & gas en una sala de juntas sin buen
wifi necesita que la demo funcione. Si el patrón se mantiene en producción,
podría convertirse en modo "offline-first" para escenarios de campo.

## Estructura de carpetas

```
frontend/
├── src/
│   ├── data/
│   │   ├── verticals.js      # 12 verticales con flujo USD/día ilustrativo
│   │   └── cables.js         # 12 cables submarinos, rutas y pesos de impacto
│   ├── engine/
│   │   └── impactEngine.js   # computeImpact() — el modelo de cálculo
│   ├── utils/
│   │   └── worldDots.js      # generación del mapa mundial en puntos (sin GeoJSON externo)
│   ├── api/
│   │   └── client.js         # fetch con fallback automático a motor local
│   ├── store/
│   │   └── useAppStore.js    # estado global (Zustand)
│   └── components/
│       ├── WorldMap.jsx      # SVG interactivo con cables y animación de ruptura
│       ├── CableList.jsx     # sidebar de cables ordenados por criticidad
│       ├── ScenarioBuilder.jsx
│       ├── ImpactPanel.jsx   # gráfica de cascada (Recharts) + narrativa
│       ├── ReportExport.jsx  # exportación a PDF (jsPDF, sin captura de pantalla)
│       ├── Header.jsx
│       └── KpiBar.jsx
backend/
├── data/                     # copia de verticals.js y cables.js (ver nota arriba)
├── engine/                   # copia de impactEngine.js
└── server.js                 # API Express: /health, /verticals, /cables, /simulate-rupture
```

## El modelo de cálculo (`impactEngine.js`)

Esto es lo más importante conceptualmente — es la traducción a código del
diferenciador que plantea el business plan: **una ruptura de cable no afecta
una sola vertical, afecta las 12 simultáneamente, con distinta intensidad.**

```js
effectiveWeight = directWeight + SYSTEMIC_BASE_IMPACT * (1 - directWeight)
```

- `directWeight` (0–1): qué tanto esa vertical depende de la ruta física que
  cruza ese cable (ej. petróleo si el cable pasa por Ormuz/Suez).
- `SYSTEMIC_BASE_IMPACT` (0.12): el piso que TODAS las verticales reciben,
  incluso sin correlación directa de ruta, porque comparten la misma capa de
  coordinación digital (AIS tracking, liquidación de pagos, mercados de
  futuros).

**Esto es una heurística ilustrativa, no un modelo validado.** El roadmap
(ver `ROADMAP.md`) es reemplazarlo por un modelo entrenado con datos
históricos reales de rupturas de cable y su correlación empírica con
movimientos de precio en cada commodity.

## El mapa mundial (`worldDots.js`)

No usa Mapbox, Leaflet, ni ningún tile server — por diseño, para que la demo
sea 100% portable y funcione sin API keys ni conexión a internet. Genera un
mapa de puntos a partir de polígonos continentales muy simplificados
(hardcodeados, ~10-20 vértices por continente). Es una aproximación visual,
no cartografía precisa. Si el producto real necesita precisión geográfica
(por ejemplo, para mostrar la ubicación exacta de un landing point), esto
debe reemplazarse por una librería de mapas real con datos GeoJSON
apropiados.

## Decisiones de diseño visual

Paleta "command center": navy profundo (`#0A1120`) en vez de negro puro,
acento cian/teal (`#2DD4BF`, evoca señal de fibra óptica) para estado normal,
ámbar (`#FB923C`) reservado exclusivamente para alertas/rupturas. Tipografía
técnica: Space Grotesk para headlines, IBM Plex Mono para datos numéricos —
deliberadamente evita el look "startup SaaS genérico" (crema + terracota) y
apunta a la estética de sala de control que un ejecutivo de riesgo esperaría
de una herramienta seria.
