# Checklist de integración posterior

Este documento delimita lo que queda para la fase externa. La copia local ya
contiene el flujo funcional, los gates reproducibles y el adaptador preparado
para snapshots en Supabase.

## GitHub y CI

- [ ] Publicar el checkout local pendiente y verificar que `main` contiene el
  commit de entrega.
- [x] Workflow CI preparado para Node 20 y 22, pruebas, lint, build, auditoría
  de esquema Supabase y evidencia de release.
- [ ] Proteger la rama principal y exigir CI verde.
- [ ] Mantener secretos únicamente como variables del proveedor.

## Supabase

- [x] Migraciones 001, 002 y 003 preparadas y aplicadas en el proyecto actual.
- [x] Adaptador de snapshots Supabase implementado en
  `backend/domain/persistence.js`, con timeout, fallback local y escritura en
  cola.
- [x] RLS por `organization_id`, helper de tenant y políticas de snapshots
  preparados y auditados.
- [ ] Confirmar desde un deploy actualizado que el runtime usa el adaptador.
- [ ] Verificar aislamiento con dos organizaciones y claims de sesión reales.
- [ ] Migrar/importar únicamente datos validados; mantener los datos demo
  separados.

## Vercel y backend

- [ ] Configurar `VITE_BACKEND_URL` en el proyecto frontend.
- [ ] Verificar el deploy del backend y su `PORT`.
- [ ] Definir `AUTH_SECRET`, `AUTH_REQUIRED=true` y CORS explícito.
- [ ] Verificar CORS, dominios, TLS, healthcheck y readiness desde el frontend.
- [ ] Ejecutar la prueba de humo en entorno no-demo: login, filtros,
  simulación, ingesta, conversión a caso, comentario, exportación y webhook.
- [ ] Ejecutar el worker HTTP de entregas con reintentos, backoff, firma HMAC y
  dead-letter queue.

## Criterio de salida

La integración estará lista cuando CI, RLS, login, persistencia, healthcheck,
exportaciones y un evento de ingesta real hayan sido verificados en un entorno
no-demo, conservando el aviso de datos ilustrativos para toda información que
no tenga fuente validada.
