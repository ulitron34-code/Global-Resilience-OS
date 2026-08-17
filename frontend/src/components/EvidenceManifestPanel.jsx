import { useEffect, useState } from 'react';
import { getEvidenceManifest } from '../api/client';

export default function EvidenceManifestPanel() {
  const [manifest, setManifest] = useState(null);
  useEffect(() => { getEvidenceManifest().then(setManifest).catch(() => setManifest(null)); }, []);
  if (!manifest) return <div className="bg-panel border border-line rounded-lg p-4 text-xs text-ink-dim">Cargando manifiesto de handoff...</div>;
  return <section className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Handoff integrity</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Local Verifiable Manifest</h2></div><span className={`font-mono text-[10px] ${manifest.status === 'complete' ? 'text-signal' : 'text-alert'}`}>{manifest.status.toUpperCase()}</span></div><p className="text-xs text-ink-muted mt-2">Verifies presence and SHA-256 digests for plan, contract, schema, and release artifacts without exposing contents.</p><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3"><Metric label="Artifacts" value={`${manifest.presentCount}/${manifest.artifactCount}`} /><Metric label="Algorithm" value={manifest.algorithm.toUpperCase()} /><Metric label="Missing" value={manifest.missingCount} /><Metric label="Digest" value={`${manifest.manifestSha256.slice(0, 12)}…`} /></div><div className="mt-3 space-y-1 max-h-36 overflow-auto">{manifest.artifacts.map((item) => <div key={item.relativePath} className="flex items-center justify-between gap-3 border-b border-line/60 py-1 text-[10px]"><span className="text-ink-muted truncate">{item.relativePath}</span><span className={item.status === 'present' ? 'text-signal font-mono' : 'text-alert font-mono'}>{item.status === 'present' ? item.sha256.slice(0, 10) : 'MISSING'}</span></div>)}</div><div className="text-[10px] text-ink-dim mt-3">Local evidence only; external signing, storage, and CI remain pending.</div></section>;
}

function Metric({ label, value }) { return <div className="bg-void border border-line rounded p-3"><div className="font-mono text-[9px] uppercase tracking-widest text-ink-dim">{label}</div><div className="font-display text-sm font-semibold text-ink mt-1 truncate">{value}</div></div>; }



