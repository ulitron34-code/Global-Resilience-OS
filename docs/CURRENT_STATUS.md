# Estado actual de la plataforma

## Corte externo actual — 2026-08-08

- GitHub: `main` sincronizado hasta `016192c`.
- Supabase: proyecto real configurado; migraciones base, enterprise/RLS y `003_platform_snapshots.sql` aplicadas; `platform_snapshots` verificada con RLS y 3 políticas.
- Vercel: sitio público activo y mini-backend conectado.
- Render: blueprint preparado, pero las variables privadas y el redeploy final deben verificarse desde el dashboard.
- Persistencia: el adaptador transaccional de snapshots Supabase ya está implementado y probado localmente; Render conserva `local-file` hasta completar el redeploy de activación.

La copia local ya no es únicamente la demo inicial. Incluye un núcleo
operativo verificable con casos, Impact Graph temporal, escenarios,
Scenario-to-Action, aprobaciones humanas, outcomes, auditoría, gobernanza,
incertidumbre, backtesting, sensibilidad, ingesta batch, calidad y DLQ,
incidentes, seguridad, cadena de evidencia, scorecard, paquete de piloto y Enterprise Readiness.

## Lo que ya está listo localmente

- Fases 0–5 del plan maestro: artefactos y gates locales implementados.
- Preparación de las fases 6–7: piloto, métricas, roadmap y evidencia regulatoria.
- Release evidence reproducible con backend, frontend, smoke, rendimiento,
  auditoría portable, reproducibilidad, auditoría de esquema Supabase local,
  auditoría del plan y release gate.
- Acciones externas desactivadas por defecto y conectores en `dry_run_only`.
- Punto de entrada raíz con `npm test`, `npm run lint`, `npm run build`, `npm run verify` y `npm run verify:install`.
- Auditoría de instalación limpia con lockfiles aceptados por `npm ci --dry-run` en backend y frontend.
- Última evidencia local: 45 pruebas, lint, build, smoke, rendimiento, auditoría
  portable, esquema, plan maestro, release gate y paridad OpenAPI: todo PASS.
- Incluye Decision Room compartible en solo lectura y blueprint de staging para
  Render; ambos quedan sujetos a la configuración externa antes de producción.

## Lo que sigue fuera de la USB

Estos puntos no deben simularse localmente: publicar en GitHub, crear y probar
el proyecto Supabase real, desplegar en Vercel/hosting, activar proveedores de
datos licenciados, configurar observabilidad externa y ejecutar un piloto con
una organización real. El estado detallado de esos bloqueos está en
`docs/ENTERPRISE_READINESS.md` y `docs/FINAL_HANDOFF_STATUS.md`.

## Comandos de verificación

```bash
node scripts/local-plan-audit.js
node scripts/local-release-evidence.js
```

Ambos deben terminar con `gate: PASS` antes de iniciar el tramo externo.
