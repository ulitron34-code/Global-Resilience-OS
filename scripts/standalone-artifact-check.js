import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../frontend/dist', import.meta.url)));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };

function fail(message) { throw new Error(`Standalone artifact check failed: ${message}`); }
if (!existsSync(join(root, 'index.html')) || !existsSync(join(root, 'assets'))) fail('dist/index.html o dist/assets no existe');

const server = createServer((req, res) => {
  const requested = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const candidate = resolve(join(root, normalize(requested.replace(/^\/+/, ''))));
  if ((candidate !== root && !candidate.startsWith(`${root}${sep}`)) || !existsSync(candidate) || !statSync(candidate).isFile()) { res.statusCode = 404; res.end('not found'); return; }
  res.setHeader('content-type', mime[extname(candidate)] || 'application/octet-stream');
  createReadStream(candidate).pipe(res);
});

function request(url) { return fetch(url).then(async (response) => ({ response, body: await response.text() })); }

await new Promise((resolveReady, reject) => {
  server.listen(0, '127.0.0.1', async () => {
    try {
      const base = `http://127.0.0.1:${server.address().port}`;
      const index = await request(`${base}/`);
      if (index.response.status !== 200 || !index.body.includes('<div id="root">')) fail('index no se sirve como HTML');
      const assetPaths = [...index.body.matchAll(/(?:src|href)="(\/assets\/[^"']+)"/g)].map((match) => match[1]);
      if (!assetPaths.length) fail('index no referencia assets compilados');
      const assets = await Promise.all(assetPaths.map((assetPath) => request(`${base}${assetPath}`)));
      if (assets.some(({ response, body }) => response.status !== 200 || !body.length)) fail('asset compilado no se puede descargar');
      const disclaimerPresent = assets.some(({ body }) => /datos ilustrativos|datos demo|demo funcional/i.test(body));
      if (!disclaimerPresent) fail('el aviso de datos ilustrativos no está presente en el artefacto');
      console.log(JSON.stringify({ gate: 'PASS', mode: 'standalone-artifact', root, indexStatus: index.response.status, assetsChecked: assets.length, disclaimerPresent, backendRequired: false }));
      resolveReady();
    } catch (error) { reject(error); }
    finally { server.close(); }
  });
  server.on('error', reject);
});
