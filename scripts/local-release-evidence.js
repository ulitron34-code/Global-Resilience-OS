import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmCli = resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const npmCommand = process.platform === 'win32' && existsSync(npmCli) ? process.execPath : npm;
const npmPrefix = npmCommand === process.execPath ? [npmCli] : [];
const checks = [
  { id: 'backend-tests', command: npmCommand, args: [...npmPrefix, 'test'], cwd: 'backend' },
  { id: 'frontend-lint', command: npmCommand, args: [...npmPrefix, 'run', 'lint'], cwd: 'frontend' },
  // Ejecutar el script raíz mediante npm conserva el entorno de lifecycle que
  // Vite/esbuild espera en Windows y evita errores de resolución intermitentes.
  { id: 'frontend-build', command: process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : npm, args: process.platform === 'win32' ? ['/d', '/s', '/c', 'npm.cmd run build'] : ['run', 'build'] },
  { id: 'standalone-artifact', command: process.execPath, args: ['scripts/standalone-artifact-check.js'] },
  { id: 'pdf-export', command: process.execPath, args: ['scripts/pdf-export-check.js'] },
  { id: 'smoke', command: process.execPath, args: ['scripts/local-smoke-test.js'] },
  { id: 'performance', command: process.execPath, args: ['scripts/local-performance-check.js'] },
  { id: 'portable-audit', command: process.execPath, args: ['scripts/local-portable-audit.js'] },
  { id: 'installation-check', command: process.execPath, args: ['scripts/local-installation-check.js'] },
  { id: 'reproducibility', command: process.execPath, args: ['scripts/local-reproducibility-check.js'] },
  { id: 'supabase-schema-audit', command: process.execPath, args: ['scripts/local-supabase-schema-check.js'] },
  { id: 'master-plan-audit', command: process.execPath, args: ['scripts/local-plan-audit.js'] },
  { id: 'openapi-route-audit', command: process.execPath, args: ['scripts/local-openapi-route-audit.js'] },
  { id: 'release-gate', command: process.execPath, args: ['scripts/local-release-gate.js'] },
  { id: 'openapi-parse', command: process.execPath, args: ['-e', "JSON.parse(require('fs').readFileSync('docs/openapi.local.json','utf8'))"] },
];

const results = [];
for (const check of checks) {
  const cwd = resolve(root, check.cwd || '.');
  // esbuild puede perder su proceso hijo de forma intermitente en Windows
  // cuando varios gates se ejecutan seguidos; un tercer intento evita marcar
  // como fallo un checkout sano sin ocultar errores persistentes.
  const maxAttempts = process.platform === 'win32' && ['frontend-build', 'performance'].includes(check.id) ? 3 : 1;
  let result;
  let attempts = 0;
  do {
    attempts += 1;
    const checkEnv = check.id === 'smoke'
      ? { ...process.env, LOCAL_SCHEMA_AUDIT_VERIFIED: 'true', LOCAL_RELEASE_GATE_VERIFIED: 'true' }
      : process.env;
    result = spawnSync(check.command, check.args, { cwd, env: checkEnv, encoding: 'utf8', timeout: 180000, windowsHide: true });
  } while (result.status !== 0 && attempts < maxAttempts);
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  results.push({ id: check.id, status: result.status === 0 ? 'pass' : 'fail', exitCode: result.status, error: result.error?.message || null, attempts, retried: attempts > 1, outputTail: output.slice(-500) });
}

const failed = results.filter((item) => item.status === 'fail');
console.log(JSON.stringify({ schemaVersion: '1.0.0-local', checkedAt: new Date().toISOString(), gate: failed.length ? 'FAIL' : 'PASS', results }, null, 2));
if (failed.length) process.exitCode = 1;
