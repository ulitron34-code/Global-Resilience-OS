import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultFile = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'storage', 'state.json');
const stateFile = process.env.DATA_FILE || defaultFile;
const isTest = process.env.NODE_ENV === 'test' || process.argv.includes('--test');

export function restoreState(seed) {
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
  mkdirSync(dirname(stateFile), { recursive: true });
  writeFileSync(stateFile, JSON.stringify({ ...state, auditLog, notifications, comments, webhooks, webhookDeliveries, jobRuns }, null, 2), 'utf8');
}
