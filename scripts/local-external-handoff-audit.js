import { existsSync, readdirSync, readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const file = (relative) => new URL(relative, root);
const checks = [];
function check(id, pass, evidence) { checks.push({ id, status: pass ? 'pass' : 'fail', evidence }); }
function text(relative) { return readFileSync(file(relative), 'utf8'); }

const requiredFiles = [
  'render.yaml', 'backend/.env.example', 'frontend/.env.example', '.github/workflows/ci.yml',
  'docs/EXTERNAL_HANDOFF_CHECKLIST.md', 'docs/INTEGRATION_HANDOFF.md', 'docs/ENVIRONMENT_CONTRACT.md',
  'docs/supabase/001_initial_schema.sql', 'docs/supabase/002_enterprise_extensions.sql',
  'docs/supabase/003_platform_snapshots.sql', 'docs/supabase/004_operational_extensions.sql',
  'docs/supabase/005_control_plane_extensions.sql',
];
for (const relative of requiredFiles) check(`file:${relative}`, existsSync(file(relative)), 'required handoff artifact present');

const render = text('render.yaml');
check('render:external-actions-disabled', /ALLOW_EXTERNAL_ACTIONS\s*\n\s*value:\s*["']?false/.test(render), 'Render keeps external actions disabled by default');
check('render:auth-required', /AUTH_REQUIRED\s*\n\s*value:\s*["']?true/.test(render), 'Render requires authentication');
check('render:illustrative-staging', /DATA_MODE\s*\n\s*value:\s*illustrative/.test(render) && /APP_MODE\s*\n\s*value:\s*staging/.test(render), 'Render manifest remains a safe staging configuration');
check('render:secret-sync', /AUTH_SECRET\s*\n\s*sync:\s*false/.test(render) && /SUPABASE_SERVICE_ROLE_KEY\s*\n\s*sync:\s*false/.test(render), 'secret variables are managed by Render, not committed');

const migrationNames = readdirSync(file('docs/supabase')).filter((name) => /^00[1-5].*\.sql$/.test(name)).sort();
const expectedMigrations = ['001_initial_schema.sql', '002_enterprise_extensions.sql', '003_platform_snapshots.sql', '004_operational_extensions.sql', '005_control_plane_extensions.sql'];
check('supabase:migration-order', JSON.stringify(migrationNames) === JSON.stringify(expectedMigrations), `migration sequence: ${migrationNames.join(', ')}`);

const backendEnv = text('backend/.env.example');
const frontendEnv = text('frontend/.env.example');
for (const key of ['APP_MODE', 'DATA_MODE', 'AUTH_REQUIRED', 'AUTH_SECRET', 'ALLOW_EXTERNAL_ACTIONS', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'PERSISTENCE_MODE']) check(`env:backend:${key}`, new RegExp(`^${key}=`, 'm').test(backendEnv), 'backend environment contract declares the key');
for (const key of ['VITE_BACKEND_URL', 'VITE_BACKEND_REQUIRED']) check(`env:frontend:${key}`, new RegExp(`^${key}=`, 'm').test(frontendEnv), 'frontend environment contract declares the key');
check('gitignore:secrets-and-state', text('.gitignore').includes('.env') && text('.gitignore').includes('backend/storage/state.json'), 'environment secrets and mutable local state excluded');

const externalBlockers = [
  'Publicar los commits locales en GitHub y ejecutar CI remoto.',
  'Aplicar migraciones 001-005 en Supabase staging y probar RLS con dos organizaciones.',
  'Configurar secretos gestionados y ejecutar el redeploy de Render/Vercel.',
  'Conectar fuentes licenciadas, historial real y ejecutar el piloto con cliente.',
];
const failed = checks.filter((item) => item.status === 'fail');
console.log(JSON.stringify({ schemaVersion: '1.0.0-local-external-handoff-audit', checkedAt: new Date().toISOString(), gate: failed.length ? 'FAIL' : 'PASS', checks, externalBlockers, disclaimer: 'PASS confirma que el paquete local está listo para handoff; no confirma servicios externos.' }, null, 2));
if (failed.length) process.exitCode = 1;
