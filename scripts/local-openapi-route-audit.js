import { readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const read = (relative) => readFileSync(new URL(relative, root), 'utf8');
const server = read('backend/server.js');
const openapi = JSON.parse(read('docs/openapi.local.json'));

function normalize(path) {
  return path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

const routePattern = /app\.(get|post|patch|put|delete)\(\s*'([^']+)'/g;
const routes = [];
for (const match of server.matchAll(routePattern)) routes.push({ method: match[1].toUpperCase(), path: normalize(match[2]) });

const documented = new Set();
for (const [path, operations] of Object.entries(openapi.paths || {})) {
  for (const method of Object.keys(operations)) {
    if (['get', 'post', 'patch', 'put', 'delete'].includes(method)) documented.add(`${method.toUpperCase()} ${path}`);
  }
}

const missing = routes.filter((route) => !documented.has(`${route.method} ${route.path}`));
const duplicateRoutes = routes.filter((route, index) => routes.findIndex((candidate) => candidate.method === route.method && candidate.path === route.path) !== index);
const result = {
  schemaVersion: '1.0.0-local-openapi-route-audit',
  checkedAt: new Date().toISOString(),
  gate: missing.length || duplicateRoutes.length ? 'FAIL' : 'PASS',
  routeCount: routes.length,
  documentedCount: documented.size,
  missing,
  duplicateRoutes,
};
console.log(JSON.stringify(result, null, 2));
if (missing.length || duplicateRoutes.length) process.exitCode = 1;
