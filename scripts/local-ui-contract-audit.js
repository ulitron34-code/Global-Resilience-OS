import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (relative) => readFileSync(resolve(root, relative), 'utf8');
const view = read('frontend/src/components/PlatformViews.jsx');
const client = read('frontend/src/api/client.js');
const checks = [
  { id: 'readiness-fetch', pass: view.includes('getPilotReadiness()'), evidence: 'Pilot Readiness refresca el gate desde la API' },
  { id: 'feedback-submit', pass: view.includes('recordPilotFeedback(') && client.includes('/api/pilots/feedback'), evidence: 'El formulario conecta con el endpoint de feedback' },
  { id: 'evidence-type', pass: view.includes('evidenceType') && view.includes('data_access'), evidence: 'La UI captura clasificación y acceso a datos' },
  { id: 'urgency-score', pass: view.includes('urgencyScore') && view.includes('Urgencia 5/5'), evidence: 'La UI captura urgencia de 1 a 5' },
  { id: 'verifiable-evidence', pass: view.includes('Evidencia verificable'), evidence: 'La UI solicita evidencia explícita' },
];
const failed = checks.filter((check) => !check.pass);
console.log(JSON.stringify({ schemaVersion: '1.0.0-local-ui-contract-audit', checkedAt: new Date().toISOString(), gate: failed.length ? 'FAIL' : 'PASS', checks, failed }, null, 2));
if (failed.length) process.exitCode = 1;
