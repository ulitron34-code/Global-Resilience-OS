# Checklist de integración posterior

Este documento delimita lo que deliberadamente queda para la siguiente fase.
La copia local ya contiene el flujo funcional y usa persistencia JSON para
trabajar sin infraestructura externa.

## GitHub

- [ ] Crear repositorio privado y elegir la rama principal.
- [ ] Copiar `GLOBALRESILIENCE-platform` sin `node_modules`, `dist`, `.git` ni
  `backend/storage/state.json`.
- [ ] Revisar `.gitignore` y agregar secretos del entorno como variables de
  GitHub, nunca al repositorio.
- [ ] Configurar CI para `backend npm test`, `frontend npm run lint` y
  `frontend npm run build`.
- [ ] Proteger la rama principal y exigir CI verde.

## Supabase

- [ ] Crear proyecto y ejecutar `docs/supabase/001_initial_schema.sql`.
- [ ] Sustituir `backend/domain/persistence.js` por un adaptador Supabase.
- [ ] Migrar organizaciones, usuarios, alertas, casos, escenarios, auditoría,
  comentarios, webhooks, entregas y jobs.
- [ ] Aplicar RLS por `organization_id` y mapear roles a claims de sesión.
- [ ] Crear índices para estado, severidad, región, vertical, timestamps y
  deduplicación por `external_id`.
- [ ] Importar únicamente datos validados; mantener los datos demo separados.

## Vercel y backend

- [ ] Configurar `VITE_BACKEND_URL` en el proyecto frontend.
- [ ] Desplegar el backend en un servicio Node separado y configurar `PORT`.
- [ ] Definir `AUTH_SECRET`, `AUTH_REQUIRED=true` y `DATA_FILE` solo donde
  todavía se use persistencia local.
- [ ] Verificar CORS, dominios, TLS, healthcheck y readiness desde el frontend.
- [ ] Ejecutar la prueba de humo: login, filtros, simulación, ingesta,
  conversión a caso, comentario, exportación y webhook.
- [ ] Ejecutar el worker HTTP local (`POST /api/webhooks/deliveries/process`)
  en la infraestructura elegida, conservando sus reintentos, backoff, firma
  HMAC y dead-letter queue.

## Criterio de salida

La integración se considera lista cuando CI, RLS, login, persistencia,
healthcheck, exportaciones y un evento de ingesta real hayan sido verificados
en un entorno no-demo, conservando el aviso de datos ilustrativos para toda la
información que aún no tenga fuente validada.
