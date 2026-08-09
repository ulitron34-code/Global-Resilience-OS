import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const frontend = resolve(root, 'frontend');
if (!existsSync(frontend)) throw new Error('No existe el directorio frontend');
const npmCli = resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const command = existsSync(npmCli) ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
const args = existsSync(npmCli) ? [npmCli, 'run', 'build'] : ['run', 'build'];
const result = spawnSync(command, args, { cwd: frontend, stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
if (result.status !== 0) process.exitCode = result.status || 1;
