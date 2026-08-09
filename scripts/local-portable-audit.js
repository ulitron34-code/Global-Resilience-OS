import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const required = ['README.md', 'backend/package.json', 'backend/package-lock.json', 'frontend/package.json', 'frontend/package-lock.json', 'docs/openapi.local.json'];
const forbiddenNames = new Set(['.env', '.env.local', '.env.production', 'state.json', 'action-plans.json']);
const forbiddenExtensions = new Set(['.pem', '.key', '.p12']);
const sensitivePatterns = [/-----BEGIN [A-Z ]+-----/, /(?:ghp|github_pat|sk_live|AKIA)[A-Za-z0-9_:-]{12,}/];
const findings = [];
const add = (kind, path, detail) => findings.push({ kind, path, detail });

for (const file of required) if (!existsSync(join(root, file))) add('missing_required', file, 'required portable artifact');
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git', 'storage'].includes(entry.name)) continue;
    const absolute = join(directory, entry.name);
    const portablePath = relative(root, absolute);
    if (entry.isDirectory()) { walk(absolute); continue; }
    if (forbiddenNames.has(entry.name) || forbiddenExtensions.has(entry.name.toLowerCase().slice(entry.name.lastIndexOf('.')))) add('forbidden_file', portablePath, 'exclude from USB/GitHub copy');
    if (statSync(absolute).size > 1_000_000) return;
    if (['.js', '.jsx', '.json', '.md', '.ps1', '.sql', '.yml', '.yaml'].includes(entry.name.toLowerCase().slice(entry.name.lastIndexOf('.')))) {
      const contents = readFileSync(absolute, 'utf8');
      for (const pattern of sensitivePatterns) if (pattern.test(contents)) add('suspicious_content', portablePath, pattern.source);
    }
  }
}
walk(root);
const report = { checkedAt: new Date().toISOString(), root, requiredFiles: required.length, findings, gate: findings.some((item) => ['missing_required', 'forbidden_file', 'suspicious_content'].includes(item.kind)) ? 'REVIEW' : 'PASS', exclusions: ['node_modules', 'dist', '.git', 'backend/storage'] };
console.log(JSON.stringify(report, null, 2));
if (report.gate !== 'PASS') process.exitCode = 1;
