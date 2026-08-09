import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startServer } from '../server.js';
import { resetLocalDemo } from '../domain/store.js';

let server;
let baseUrl;

before(() => new Promise((resolve) => {
  resetLocalDemo('api-test');
  server = startServer(0);
  server.on('listening', () => {
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    resolve();
  });
}));

after(() => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))));

test('decision share API creates, serves and revokes a read-only package', async () => {
  const createdResponse = await fetch(`${baseUrl}/api/cases/RS-0827/shares`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ expiresInHours: 12, audience: 'pilot reviewer' }) });
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json();
  assert.ok(created.token);
  assert.equal(created.share.tokenHash, undefined);

  const listResponse = await fetch(`${baseUrl}/api/cases/RS-0827/shares`);
  assert.equal(listResponse.status, 200);
  assert.equal((await listResponse.json())[0].id, created.share.id);

  const sharedResponse = await fetch(`${baseUrl}${created.apiPath}`);
  assert.equal(sharedResponse.status, 200);
  assert.equal(sharedResponse.headers.get('cache-control'), 'no-store');
  assert.equal((await sharedResponse.json()).package.case.id, 'RS-0827');

  const revokeResponse = await fetch(`${baseUrl}/api/cases/RS-0827/shares/${created.share.id}/revoke`, { method: 'POST' });
  assert.equal(revokeResponse.status, 200);
  const revokedResponse = await fetch(`${baseUrl}${created.apiPath}`);
  assert.equal(revokedResponse.status, 404);
});
