import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const frontend = resolve(root, 'frontend');
if (!existsSync(frontend)) throw new Error('No existe el directorio frontend');
const viteEntry = resolve(frontend, 'node_modules/vite/dist/node/index.js');
if (!existsSync(viteEntry)) throw new Error('No existe el runtime local de Vite');
process.chdir(frontend);
const { build } = await import(pathToFileURL(viteEntry).href);
await build({ root: frontend, configFile: resolve(frontend, 'vite.config.js') });
