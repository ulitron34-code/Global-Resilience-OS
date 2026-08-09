import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const checks = [];
const check = (id, pass, evidence) => checks.push({ id, status: pass ? 'pass' : 'fail', evidence });
function json(relative) { return JSON.parse(readFileSync(join(root, relative), 'utf8')); }

for (const relative of ['backend/package.json', 'backend/package-lock.json', 'frontend/package.json', 'frontend/package-lock.json', 'backend/.env.example', 'frontend/.env.example']) check(`file:${relative}`, existsSync(join(root, relative)), 'reproducible input present');

for (const scope of ['backend', 'frontend']) {
  try {
    const manifest = json(`${scope}/package.json`);
    const lock = json(`${scope}/package-lock.json`);
    const rootPackage = lock.packages?.[''] || {};
    check(`${scope}:lock-root-name`, rootPackage.name === manifest.name, `${rootPackage.name || 'missing'} = ${manifest.name}`);
    check(`${scope}:lock-root-version`, rootPackage.version === manifest.version, `${rootPackage.version || 'missing'} = ${manifest.version}`);
    check(`${scope}:lockfile-v3`, lock.lockfileVersion === 3, `lockfileVersion=${lock.lockfileVersion}`);
    check(`${scope}:dependencies-resolved`, Object.keys(lock.packages || {}).length > 1, `${Object.keys(lock.packages || {}).length} package entries`);
  } catch (error) { check(`${scope}:parse`, false, error.message); }
}

const backendEnv = readFileSync(join(root, 'backend/.env.example'), 'utf8');
const frontendEnv = readFileSync(join(root, 'frontend/.env.example'), 'utf8');
for (const key of ['APP_MODE', 'DATA_MODE', 'AUTH_REQUIRED', 'AUTH_SECRET', 'ALLOW_EXTERNAL_ACTIONS', 'CORS_ORIGIN']) check(`backend-env:${key}`, new RegExp(`^${key}=`, 'm').test(backendEnv), 'declared in .env.example');
check('frontend-env:backend-url', /^VITE_BACKEND_URL=/m.test(frontendEnv), 'declared in .env.example');
const gitignore = readFileSync(join(root, '.gitignore'), 'utf8');
for (const entry of ['node_modules', 'dist', '.env', 'backend/storage/state.json', 'backend/storage/action-plans.json']) check(`gitignore:${entry}`, gitignore.includes(entry), 'excluded from portable/repository state');
check('entrypoints', existsSync(join(root, 'backend/server.js')) && existsSync(join(root, 'frontend/src/App.jsx')), 'backend and frontend entrypoints present');

const failed = checks.filter((item) => item.status === 'fail');
console.log(JSON.stringify({ schemaVersion: '1.0.0-local', checkedAt: new Date().toISOString(), gate: failed.length ? 'FAIL' : 'PASS', checks }, null, 2));
if (failed.length) process.exitCode = 1;
