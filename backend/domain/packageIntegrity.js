import { createHash } from 'node:crypto';

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

export function hashPackage(packet = {}) {
  const { integrity: _integrity, ...content } = packet;
  return createHash('sha256').update(JSON.stringify(canonicalize(content))).digest('hex');
}

export function attachPackageIntegrity(packet = {}) {
  return { ...packet, integrity: { algorithm: 'sha256', canonicalization: 'sorted-json-v1', digest: hashPackage(packet) } };
}

export function verifyPackageIntegrity(packet = {}) {
  return Boolean(packet.integrity?.digest) && packet.integrity.digest === hashPackage(packet);
}
