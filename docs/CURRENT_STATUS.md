# Estado actual de la plataforma

## Corte externo actual — 2026-08-08

- GitHub: el remoto sigue en `8a0cfc2`; el checkout local contiene el bloque local más reciente y
  contiene los cambios de persistencia, gates y CI pendientes de publicación.
- Supabase: proyecto real configurado; migraciones base, enterprise/RLS y
  `003_platform_snapshots.sql` aplicadas; `platform_snapshots` verificada con
  RLS y tres políticas.
- Vercel: sitio público activo.
- Render: variables privadas configuradas y redeploy realizado, pero el
  servicio aún ejecuta el commit remoto anterior hasta publicar el checkout
  actualizado.
- Persistencia: el adaptador transaccional de snapshots Supabase está
  implementado y probado localmente; el runtime externo requiere una
  publicación actualizada.

La copia local ya no es únicamente la demo inicial. Incluye un núcleo
operativo verificable con casos, Impact Graph temporal, escenarios,
Scenario-to-Action, aprobaciones humanas, outcomes, auditoría, gobernanza,
incertidumbre, backtesting, sensibilidad, ingesta batch, calidad y DLQ,
incidentes, seguridad, cadena de evidencia, scorecard, paquete de piloto y
Enterprise Readiness.

## Lo que ya está listo localmente

- Fases 0–5 del plan maestro: artefactos y gates locales implementados.
- Preparación de las fases 6–7: piloto, métricas, roadmap y evidencia
  regulatoria.
- Release evidence reproducible con backend, frontend, smoke, rendimiento,
  auditoría portable, reproducibilidad, auditoría de esquema Supabase local,
  auditoría del plan, release gate y CI preparado.
- Acciones externas desactivadas por defecto y conectores en `dry_run_only`.
- Punto de entrada raíz con `npm test`, `npm run lint`, `npm run build`,
  `npm run check:supabase`, `npm run verify` y `npm run verify:install`.
- Auditoría de instalación limpia con lockfiles aceptados por `npm ci
  --dry-run` en backend y frontend.
- Última evidencia local: 60 pruebas, lint, build, smoke, rendimiento,
  auditoría portable, esquema, plan maestro, release gate y paridad OpenAPI:
  todo PASS.
- Incluye Decision Room compartible en solo lectura y blueprint de staging para
  Render; ambos quedan sujetos a configuración externa antes de producción.

## Lo que sigue fuera de la USB

Estos puntos no deben simularse localmente: publicar el checkout actualizado
en GitHub, verificar el runtime remoto contra Supabase con dos organizaciones,
proteger la rama, confirmar el deploy de hosting, activar proveedores de datos
licenciados, configurar observabilidad externa y ejecutar un piloto con una
organización real. El estado detallado está en `docs/ENTERPRISE_READINESS.md`,
`docs/FINAL_HANDOFF_STATUS.md` e `docs/INTEGRATION_CHECKLIST.md`.

## Comandos de verificación

```bash
npm run check:supabase
npm run verify
```

Ambos deben terminar con `gate: PASS` antes de iniciar el tramo externo.
