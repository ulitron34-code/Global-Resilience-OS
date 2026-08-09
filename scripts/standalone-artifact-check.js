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
      const assetPath = index.body.match(/(?:src|href)="(\/assets\/[^"']+)"/)?.[1];
      if (!assetPath) fail('index no referencia un asset compilado');
      const asset = await request(`${base}${assetPath}`);
      if (asset.response.status !== 200 || !asset.body.length) fail('asset compilado no se puede descargar');
      console.log(JSON.stringify({ gate: 'PASS', mode: 'standalone-artifact', root, indexStatus: index.response.status, assetStatus: asset.response.status, backendRequired: false }));
      resolveReady();
    } catch (error) { reject(error); }
    finally { server.close(); }
  });
  server.on('error', reject);
});
