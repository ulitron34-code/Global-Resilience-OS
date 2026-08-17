import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

const utilsDir = path.join(process.cwd(), 'node_modules', 'lucide-react', 'dist', 'esm', 'shared', 'src', 'utils');

const files = {
  'mergeClasses.mjs': `export function mergeClasses(...classes) {\n  return classes.filter(Boolean).join(' ');\n}\n`,
  'toKebabCase.mjs': `export function toKebabCase(value) {\n  return String(value)\n    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')\n    .replace(/[\\s_]+/g, '-')\n    .toLowerCase();\n}\n`,
  'toPascalCase.mjs': `export function toPascalCase(value) {\n  return String(value)\n    .replace(/(^|[-_\\s]+)([a-z0-9])/gi, (_, __, character) => character.toUpperCase())\n    .replace(/[-_\\s]+/g, '');\n}\n`,
  'hasA11yProp.mjs': `export function hasA11yProp(props) {\n  return Object.keys(props || {}).some((name) => name === 'aria-label' || name === 'aria-labelledby' || name === 'title' || name === 'role');\n}\n`,
};

if (!(await exists(path.join(process.cwd(), 'node_modules', 'lucide-react')))) {
  process.exit(0);
}

await mkdir(utilsDir, { recursive: true });
await Promise.all(Object.entries(files).map(async ([filename, contents]) => {
  const target = path.join(utilsDir, filename);
  if (!(await exists(target))) await writeFile(target, contents, 'utf8');
}));
