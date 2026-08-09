import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ARTIFACTS = [
  ['docs/MASTER_PLAN_COVERAGE.md', 'plan'],
  ['docs/PLAN_BACKLOG_STATUS.md', 'backlog'],
  ['docs/FINAL_HANDOFF_CURRENT.md', 'handoff'],
  ['docs/EXTERNAL_HANDOFF_AUDIT.md', 'audit'],
  ['docs/PRODUCTION_PREFLIGHT.md', 'preflight'],
  ['docs/openapi.local.json', 'contract'],
  ['docs/supabase/001_initial_schema.sql', 'schema'],
  ['docs/supabase/005_control_plane_extensions.sql', 'schema'],
  ['scripts/local-release-evidence.js', 'release-gate'],
];

function digestFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

export function buildEvidenceManifest({ projectRoot = fileURLToPath(new URL('../..', import.meta.url)) } = {}) {
  const artifacts = ARTIFACTS.map(([relativePath, category]) => {
    const path = resolve(projectRoot, relativePath);
    if (!existsSync(path)) return { relativePath, category, status: 'missing' };
    const metadata = statSync(path);
    return { relativePath, category, status: 'present', bytes: metadata.size, sha256: digestFile(path) };
  });
  const present = artifacts.filter((item) => item.status === 'present');
  const missing = artifacts.filter((item) => item.status === 'missing');
  const canonical = JSON.stringify(present.map(({ relativePath, category, status, bytes, sha256 }) => ({ relativePath, category, status, bytes, sha256 })));
  return {
    schemaVersion: '1.0.0-local-evidence-manifest',
    generatedAt: new Date().toISOString(),
    algorithm: 'sha256',
    canonicalization: 'ordered-artifact-metadata-v1',
    status: missing.length ? 'incomplete' : 'complete',
    artifactCount: artifacts.length,
    presentCount: present.length,
    missingCount: missing.length,
    manifestSha256: createHash('sha256').update(canonical).digest('hex'),
    artifacts,
    disclaimer: 'Manifiesto local de integridad; no certifica el contenido, licencias, despliegues ni cumplimiento externo.',
  };
}
