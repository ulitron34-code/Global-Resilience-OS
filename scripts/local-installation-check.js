import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const file = (relative) => resolve(root, relative);
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmCli = resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const npmCommand = process.platform === 'win32' && existsSync(npmCli) ? process.execPath : npm;
const npmPrefix = npmCommand === process.execPath ? [npmCli] : [];
const checks = [];

function check(id, pass, evidence) {
  checks.push({ id, status: pass ? 'pass' : 'fail', evidence });
}

const required = ['package.json', 'backend/package.json', 'backend/package-lock.json', 'frontend/package.json', 'frontend/package-lock.json', 'backend/.env.example', 'frontend/.env.example', 'docs/openapi.local.json'];
for (const relative of required) check(`required:${relative}`, existsSync(file(relative)), 'required file present');

for (const relative of ['backend/.env.example', 'frontend/.env.example']) {
  const keys = readFileSync(file(relative), 'utf8').split(/\r?\n/).map((line) => line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=/)?.[1]).filter(Boolean);
  const duplicates = [...new Set(keys.filter((key, index) => keys.indexOf(key) !== index))];
  check(`env-keys:${relative}`, duplicates.length === 0, duplicates.length ? `duplicate keys: ${duplicates.join(', ')}` : 'environment example keys are unique');
}

const forbidden = ['backend/.env', 'frontend/.env', 'backend/storage/state.json', 'backend/storage/action-plans.json'];
const rootGitignore = readFileSync(file('.gitignore'), 'utf8');
for (const relative of forbidden) {
  const present = existsSync(file(relative));
  const ignored = relative === 'backend/.env' ? rootGitignore.includes('.env') : rootGitignore.includes(relative);
  check(`portable:${relative}`, !present || ignored, present && ignored ? 'present only as ignored runtime state' : 'not included in a clean portable checkout');
}

const rootPackage = JSON.parse(readFileSync(file('package.json'), 'utf8'));
check('root-scripts', Boolean(rootPackage.scripts?.verify && rootPackage.scripts?.['verify:install']), 'root orchestration scripts present');
for (const workspace of ['backend', 'frontend']) {
  const packageJson = JSON.parse(readFileSync(file(`${workspace}/package.json`), 'utf8'));
  const lockJson = JSON.parse(readFileSync(file(`${workspace}/package-lock.json`), 'utf8'));
  check(`${workspace}:lock-name`, lockJson.name === packageJson.name, 'lockfile package name matches manifest');
  check(`${workspace}:lock-version`, lockJson.packages?.['']?.version === packageJson.version, 'lockfile root version matches manifest');
}

for (const workspace of ['backend', 'frontend']) {
  try {
    execFileSync(npmCommand, [...npmPrefix, 'ci', '--dry-run', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: file(workspace), stdio: 'pipe', timeout: 120000 });
    check(`${workspace}:npm-ci-dry-run`, true, `${workspace} lockfile accepted by npm ci dry-run`);
  } catch (error) {
    check(`${workspace}:npm-ci-dry-run`, false, String(error.stderr || error.message).trim().slice(-500));
  }
}

const failed = checks.filter((item) => item.status === 'fail');
console.log(JSON.stringify({ schemaVersion: '1.0.0-local-installation-check', checkedAt: new Date().toISOString(), gate: failed.length ? 'FAIL' : 'PASS', checks, disclaimer: 'Verifica la reproducibilidad del checkout local; no sustituye CI remoto ni un despliegue de staging.' }, null, 2));
if (failed.length) process.exitCode = 1;
