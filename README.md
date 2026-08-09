# Global Resilience OS — Demo Funcional

Demo interactiva del concepto de producto descrito en *Global Resilience OS —
Business Plan 2026-2036*: una plataforma de inteligencia de riesgo sistémico
para cadenas críticas de suministro global, con el diferenciador de monitoreo
de cables submarinos de internet como capa de riesgo transversal a 12
verticales (petróleo, LNG, gas, petroquímica, electricidad, cobre, litio,
níquel, cobalto, trigo, semiconductores, acero).

**Esto es una demo de concepto, no el producto final.** Está diseñada para
abrir conversaciones con inversionistas y prospects — no para trading ni
decisiones de inversión reales. Ver `docs/LIMITACIONES.md`.

---

## Qué incluye

- **`frontend/`** — App React (Vite + Tailwind) con mapa mundial interactivo,
  simulador de escenarios de ruptura de cables, y cascada de impacto por
  vertical.
- **`backend/`** — Mini-backend Express que expone el motor de cálculo vía
  API REST, autenticación local por roles, persistencia JSON, auditoría,
  ingesta deduplicada, jobs, webhooks locales y exportación de briefs.
- **Arquitectura híbrida standalone + backend**: el frontend intenta usar el
  backend real; si no está disponible (por ejemplo, al abrir el build
  estático en una laptop sin conexión durante una presentación), calcula
  todo localmente en el navegador con el mismo motor. Esto la hace
  presentable en cualquier lugar sin depender de infraestructura.

## Arranque rápido (con backend)

Desde la raíz también puedes ejecutar los gates principales:

```bash
npm test
npm run lint
npm run build
npm run verify
```

`npm run verify:install` comprueba que los dos lockfiles aceptan una instalación
limpia y que el checkout portable no expone secretos ni estado operativo.

```bash
# Terminal 1 — backend
cd backend
npm install
npm start          # http://localhost:4000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev         # http://localhost:5173
```

## Arranque rápido (solo demo, sin backend — para presentación portátil)

```bash
cd frontend
npm install
npm run build
npx serve dist       # o: npx vite preview
```

Abre la URL que te indique la terminal. La demo detecta que no hay backend
y calcula todo localmente — funciona igual de bien.

> **Nota sobre `file://`:** no abras `dist/index.html` haciendo doble clic
> directamente en el explorador de archivos — los navegadores bloquean los
> módulos ES por CORS en ese modo. Siempre sírvelo con `npx serve dist` (o
> cualquier servidor estático) aunque sea localmente. Toma 5 segundos.

## Documentación

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — cómo está construido,
  decisiones técnicas, cómo extenderlo.
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — cómo desplegarlo a producción
  (Vercel, Render, etc.) cuando llegue el capital.
- **[docs/ROADMAP.md](docs/ROADMAP.md)** — qué falta para pasar de esta demo
  a la plataforma enterprise-grade descrita en el business plan, y cómo se
  conecta con el análisis PREMORTEMV3.
- **[docs/LIMITACIONES.md](docs/LIMITACIONES.md)** — qué es real y qué es
  ilustrativo en esta demo. Léelo antes de presentarla.

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite 5, Tailwind CSS 3, Zustand, Recharts |
| Backend | Node.js, Express |
| PDF export | jsPDF + jspdf-autotable |
| Mapa | SVG custom (dot-matrix), sin dependencias externas de mapas |
| Tipografía | Space Grotesk (display), IBM Plex Sans (body), IBM Plex Mono (data) |

## Para Claude Code

Este repo está listo para que Claude Code tome el código y lo extienda hacia
la plataforma real. Puntos de entrada recomendados:

1. Lee `docs/ROADMAP.md` primero — ahí está el plan de qué construir después.
2. `frontend/src/data/cables.js` y `frontend/src/data/verticals.js` — datos
   ilustrativos que hay que reemplazar por fuentes reales (TeleGeography,
   Kpler, Refinitiv).
2. `frontend/src/engine/impactEngine.js` — el modelo de cálculo actual es una
   heurística simple. Es el candidato principal para convertirse en el motor
   real (ML, series de tiempo, correlación histórica).
3. `backend/server.js` — API local. Antes de producción hay que sustituir la
   persistencia JSON por Supabase, configurar secrets y añadir observabilidad
   de producción.

Para la integración posterior, consulta `docs/INTEGRATION_CHECKLIST.md`.
Para revisar el estado verificable de las capacidades locales, consulta
`docs/LOCAL_CAPABILITY_MATRIX.md`.
Para revisar el feedback loop de resultados y calibración, consulta
`docs/OUTCOME_FEEDBACK_LOOP.md`.
Para el gate de liberación local consulta `docs/RELEASE_CHECKLIST.md`, el
modelo de amenazas en `docs/THREAT_MODEL.md` y los requisitos de datos en
`docs/DATA_REQUIREMENTS.md`.
