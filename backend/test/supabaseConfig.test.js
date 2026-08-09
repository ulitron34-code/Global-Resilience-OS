import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSupabaseConnection, getSupabaseReadiness } from '../config/supabase.js';

test('Supabase readiness does not expose credentials', () => {
  const result = getSupabaseReadiness({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'secret', PERSISTENCE_MODE: 'supabase' });
  assert.equal(result.ready, true);
  assert.equal(result.config.serviceRoleKeyConfigured, true);
  assert.equal('serviceRoleKey' in result.config, false);
});

test('Supabase connection check uses the REST health query', async () => {
  let request;
  const result = await checkSupabaseConnection({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-role', PERSISTENCE_MODE: 'supabase' }, async (url, options) => {
    request = { url, options };
    return { ok: true, status: 200 };
  });
  assert.equal(result.reachable, true);
  assert.equal(result.checked, true);
  assert.equal(request.url, 'https://example.supabase.co/rest/v1/organizations?select=id&limit=1');
  assert.equal(request.options.headers.apikey, 'service-role');
});
