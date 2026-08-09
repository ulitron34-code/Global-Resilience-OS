import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSupabaseRemoteConfig } from '../config/supabase.js';

const defaultFile = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'storage', 'state.json');
const stateFile = process.env.DATA_FILE || defaultFile;
const isTest = process.env.NODE_ENV === 'test' || process.argv.includes('--test');
const remoteConfig = getSupabaseRemoteConfig();
const remoteEnabled = !isTest && remoteConfig.persistenceMode === 'supabase' && Boolean(remoteConfig.serviceRoleKey);
let remoteWriteChain = Promise.resolve();
const remoteStatus = { enabled: remoteEnabled, state: 'idle', version: null, organizationId: null, lastError: null, updatedAt: null };

function remoteHeaders() {
  return { apikey: remoteConfig.serviceRoleKey, authorization: `Bearer ${remoteConfig.serviceRoleKey}`, 'content-type': 'application/json', prefer: 'return=representation' };
}

async function remoteFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.SUPABASE_TIMEOUT_MS || 5000));
  try {
    const response = await fetch(`${remoteConfig.projectUrl}/rest/v1/${path}`, { ...options, signal: controller.signal, headers: { ...remoteHeaders(), ...(options.headers || {}) } });
    if (!response.ok) throw new Error(`Supabase REST HTTP ${response.status}`);
    return response.status === 204 ? null : response.json();
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Supabase REST timeout');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function ensureRemoteOrganization() {
  const existing = await remoteFetch(`organizations?slug=eq.${encodeURIComponent(remoteConfig.organizationSlug)}&select=id&limit=1`);
  if (existing?.[0]?.id) return existing[0].id;
  const created = await remoteFetch('organizations', { method: 'POST', body: JSON.stringify({ name: 'Global Resilience Pilot', slug: remoteConfig.organizationSlug }) });
  return created?.[0]?.id;
}

async function loadRemoteSnapshot(seed) {
  if (!remoteEnabled) return seed;
  try {
    remoteStatus.state = 'loading';
    const organizationId = await ensureRemoteOrganization();
    remoteStatus.organizationId = organizationId;
    const rows = await remoteFetch(`platform_snapshots?organization_id=eq.${organizationId}&snapshot_key=eq.primary&limit=1`);
    const snapshot = rows?.[0];
    if (!snapshot) { remoteStatus.state = 'empty'; return seed; }
    remoteStatus.state = 'ready';
    remoteStatus.version = snapshot.version;
    remoteStatus.updatedAt = snapshot.updated_at;
    return { ...seed, ...(snapshot.state || {}), auditLog: snapshot.audit_log || [], notifications: snapshot.notifications || [], comments: snapshot.comments || [], webhooks: snapshot.webhooks || [], webhookDeliveries: snapshot.webhook_deliveries || [], jobRuns: snapshot.job_runs || [] };
  } catch (error) {
    remoteStatus.state = 'error';
    remoteStatus.lastError = error.message;
    return seed;
  }
}

function queueRemoteSnapshot(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns) {
  remoteWriteChain = remoteWriteChain.then(async () => {
    remoteStatus.state = 'writing';
    const organizationId = remoteStatus.organizationId || await ensureRemoteOrganization();
    remoteStatus.organizationId = organizationId;
    const payload = {
      organization_id: organizationId,
      snapshot_key: 'primary',
      state,
      audit_log: auditLog,
      notifications,
      comments,
      webhooks,
      webhook_deliveries: webhookDeliveries,
      job_runs: jobRuns,
      version: Number(remoteStatus.version || 0) + 1,
      updated_at: new Date().toISOString(),
    };
    const rows = await remoteFetch('platform_snapshots?on_conflict=organization_id,snapshot_key', { method: 'POST', headers: { prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(payload) });
    remoteStatus.version = rows?.[0]?.version || payload.version;
    remoteStatus.updatedAt = payload.updated_at;
    remoteStatus.state = 'ready';
    remoteStatus.lastError = null;
  }).catch((error) => { remoteStatus.state = 'error'; remoteStatus.lastError = error.message; });
  return remoteWriteChain;
}

export function getRemotePersistenceStatus() { return { ...remoteStatus }; }

export async function flushPersistence() {
  await remoteWriteChain;
  return getRemotePersistenceStatus();
}

export async function restoreState(seed) {
  if (remoteEnabled) return loadRemoteSnapshot(seed);
  if (isTest || !existsSync(stateFile)) return seed;
  try {
    const stored = JSON.parse(readFileSync(stateFile, 'utf8'));
    return {
      ...seed,
      ...stored,
      alerts: mergeById(seed.alerts, stored.alerts),
      cases: mergeById(seed.cases, stored.cases),
      scenarios: mergeById(seed.scenarios, stored.scenarios),
      sources: mergeById(seed.sources, stored.sources),
    };
  } catch {
    return seed;
  }
}

function mergeById(seedItems = [], storedItems = []) {
  const storedIds = new Set(storedItems.map((item) => item.id));
  return [...storedItems, ...seedItems.filter((item) => !storedIds.has(item.id))];
}

function canonicalAuditEntry(entry) {
  const { hash: _hash, previousHash: _previousHash, ...content } = entry;
  return JSON.stringify(content);
}

export function sealAuditChain(auditLog = []) {
  let previousHash = 'GENESIS';
  for (const entry of auditLog) {
    entry.previousHash = previousHash;
    entry.hash = createHash('sha256').update(`${previousHash}:${canonicalAuditEntry(entry)}`).digest('hex');
    previousHash = entry.hash;
  }
  return auditLog;
}

export function verifyAuditChain(auditLog = []) {
  let previousHash = 'GENESIS';
  const mismatches = [];
  let sealedEntries = 0;
  for (const entry of auditLog) {
    const expectedHash = createHash('sha256').update(`${previousHash}:${canonicalAuditEntry(entry)}`).digest('hex');
    if (entry.hash && entry.hash !== expectedHash) mismatches.push(entry.id || 'unknown');
    if (entry.hash && entry.previousHash !== previousHash) mismatches.push(entry.id || 'unknown');
    if (entry.hash) sealedEntries += 1;
    previousHash = entry.hash || expectedHash;
  }
  return { valid: mismatches.length === 0, sealed: auditLog.length === sealedEntries, entries: auditLog.length, sealedEntries, mismatches: [...new Set(mismatches)] };
}

export function persistState(state, auditLog, notifications = [], comments = [], webhooks = [], webhookDeliveries = [], jobRuns = []) {
  if (isTest) return;
  sealAuditChain(auditLog);
  if (remoteEnabled) { queueRemoteSnapshot(state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns); return; }
  mkdirSync(dirname(stateFile), { recursive: true });
  writeFileSync(stateFile, JSON.stringify({ ...state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns }, null, 2), 'utf8');
}
