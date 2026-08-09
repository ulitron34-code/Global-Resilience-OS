# Operación local y migración

## Comandos unificados desde la raíz

Desde la carpeta del proyecto se puede operar la copia local con:

```bash
npm test               # pruebas del backend
npm run lint           # lint del frontend
npm run build          # build de producción del frontend
npm run verify         # todos los gates locales
npm run verify:install # manifiestos, lockfiles y npm ci --dry-run
```

`verify:install` no modifica `node_modules`: comprueba que un checkout limpio
puede ser instalado por npm y que no arrastra estado local ni secretos.

En la vista Operations, `Reiniciar demo local` devuelve alertas, casos,
escenarios, notificaciones, webhooks y planes de acción a sus semillas. Exige
confirmación, requiere rol administrador cuando la autenticación está activa y
queda bloqueado si `APP_MODE=production`.

## Arranque local

Backend:

```powershell
cd backend
npm install
npm start
```

Frontend, en otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

El backend arranca en `http://localhost:4000` y el frontend en `http://localhost:5173`.

## Usuarios demo

| Usuario | Contraseña | Rol |
|---|---|---|
| admin@resilience.local | demo123 | admin |
| analyst@resilience.local | demo123 | risk_analyst |
| viewer@resilience.local | demo123 | viewer |

Son credenciales de demostración. Deben sustituirse antes de cualquier despliegue.

## Persistencia local

El backend guarda cambios operativos en `backend/storage/state.json`. Ese archivo está ignorado por Git para no versionar estados de ejecución. La restauración combina semillas nuevas con datos existentes, lo que permite evolucionar el modelo sin perder registros locales.

## Configuración de seguridad

Copiar `.env.example` a `.env` y establecer:

```env
AUTH_SECRET=una-clave-larga-y-aleatoria
AUTH_REQUIRED=true
```

En modo demo `AUTH_REQUIRED=false` mantiene la interfaz operable sin login. En producción debe ser `true`.

## Migración a Supabase

1. Crear un proyecto Supabase.
2. Ejecutar `docs/supabase/001_initial_schema.sql` en el SQL Editor.
3. Crear usuarios en Supabase Auth.
4. Vincular cada usuario a `public.profiles` con su rol.
5. Sustituir `backend/domain/store.js` por un repositorio Supabase conservando los contratos de `/api/cases`, `/api/alerts`, `/api/scenarios` y `/api/briefs/latest`.
6. Revisar y ampliar las políticas RLS antes de exponer datos de clientes.

## Contrato operativo mínimo

- Una alerta puede convertirse en un caso una sola vez; las solicitudes repetidas son idempotentes.
- Los cambios de caso generan una entrada en `audit_log`.
- Los escenarios validan valores monetarios y confianza entre `0` y `1`.
- Cada respuesta HTTP incluye `x-request-id` para trazabilidad.

## Verificación antes de mover la USB

Desde PowerShell, ejecuta:

```powershell
./scripts/portable-check.ps1
```

El script confirma que están presentes los archivos base y advierte si la
copia incluye `.env`, `state.json`, `node_modules` o `dist`. Esos elementos no
deben viajar al repositorio ni a una copia portable de distribución.
