# Guía de Puesta en Producción, Pricing y Handoff (Global Resilience OS)

Este documento detalla el modelo de pricing comercial y los pasos de configuración de infraestructura técnica para la puesta en producción de la plataforma.

---

## 💰 1. Modelo de Pricing Comercial (Suscripción del 2%)

Se ha integrado en la interfaz de la demo (`Brief` y el `Scenario-to-Action Engine`) un modelo de monetización basado en el **Retorno de Inversión (ROI)** de la resiliencia:

* **Métrica Central:** El sistema calcula el *Valor Protegido* ($Valor\,Protegido = Pérdida\,por\,esperar - Costo\,de\,mitigación$).
* **Fórmula de Suscripción:** Se sugiere al cliente una tarifa de suscripción anual equivalente al **2% del Valor Protegido** anualizado bajo simulación de incidentes críticos.
* **Justificación de Venta:** Esto demuestra que el software se autofinancia con creces (ej. proteger $1M en un incidente crítico justifica una suscripción anual de $20,000, un ROI de 50x en resiliencia).

---

## 🔒 2. Seguridad en Supabase (Multi-tenant RLS)

Para habilitar un entorno multi-inquilino productivo y seguro:

1. **Esquema de BD:** Cada tabla operativa (`alerts`, `cases`, `action_plans`) debe contener una columna `organization_id UUID`.
2. **Políticas RLS:** Ejecutar la activación de Row Level Security (RLS) en Postgres:
   ```sql
   ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
   ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
   ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
   ```
3. **Definición de Políticas:** Crear políticas que restrinjan el acceso al token JWT autenticado:
   ```sql
   CREATE POLICY org_isolation_policy ON alerts
     FOR ALL
     USING (organization_id = auth.jwt() ->> 'org_id');
   ```

---

## 🔑 3. Configuración de APIs de Terceros y Hosting

El backend productivo (desplegado en Render u otro proveedor de PaaS) requiere las siguientes variables de entorno:

| Variable | Tipo | Descripción |
|---|---|---|
| `DATABASE_URL` | Secreto (URI Postgres) | Conexión directa a la BD de Supabase. |
| `JWT_SECRET` | Secreto (String) | Firma y verificación de sesiones de usuario. |
| `ANTHROPIC_API_KEY` | Secreto (Clave de API) | Acceso a Claude 3.5 Sonnet para el Copiloto de IA. |
| `OPENAI_API_KEY` | Secreto (Clave de API) | Acceso alternativo a modelos GPT para análisis semánticos. |
| `VITE_BACKEND_URL` | URL de Producción | Apunta al endpoint del backend desde Vercel (frontend). |

---

## 🗺️ 4. Licenciamiento de Datos Reales (Cables y Feeds)

Para eliminar el badge "DEMO — DATOS ILUSTRATIVOS":
1. **Infraestructura de Cables:** Licenciar el dataset global de cables submarinos con **TeleGeography** para reemplazar `data/cables.js`.
2. **Flujos Marítimos:** Contratar feeds de AIS (como Marine Traffic o Kpler API) para automatizar la detección de tráfico y congestión en chokepoints (Canal de Suez, Bab-el-Mandeb, Estrecho de Ormuz).
3. **Calibración:** Mantener la disciplina del ledger histórico ingresando al menos 5 eventos adicionales de disrupción del último año.
