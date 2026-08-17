import { useEffect, useState } from 'react';
import { Layers3 } from 'lucide-react';
import { getModelProfiles } from '../api/client';

export default function ModelProfilesPanel() {
  const [profile, setProfile] = useState(null);
  useEffect(() => { getModelProfiles({ vertical: 'petroleo', region: 'global' }).then(setProfile); }, []);
  if (!profile) return <section className="bg-panel border border-line rounded-lg p-4 text-xs text-ink-muted">Cargando perfiles especializados...</section>;
  return <section className="bg-panel border border-line rounded-lg overflow-hidden"><div className="p-4 border-b border-line flex items-center gap-3"><Layers3 size={16} className="text-signal" /><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Decision profiles</div><h2 className="font-display font-semibold text-ink mt-1">Regional and Vertical Context</h2></div><span className="ml-auto font-mono text-[9px] text-alert">ABSTAIN</span></div><div className="p-4 grid md:grid-cols-2 gap-3"><div><div className="text-xs text-ink-muted">{profile.region?.label} · {profile.vertical?.label}</div><p className="text-xs text-ink-muted mt-2">{profile.region?.operatingContext}</p><div className="font-mono text-[9px] uppercase tracking-widest text-ink-dim mt-3">Decision lenses</div><div className="flex flex-wrap gap-1 mt-2">{(profile.vertical?.decisionLenses || []).map((item) => <span key={item} className="border border-line rounded px-2 py-1 text-[10px] text-ink-muted">{item}</span>)}</div></div><div><div className="font-mono text-[9px] uppercase tracking-widest text-ink-dim">Missing data for specialization</div><ul className="mt-2 space-y-1 text-[11px] text-ink-muted">{(profile.dataNeeds || []).map((item) => <li key={item}>· {item}</li>)}</ul><p className="text-[10px] text-alert/80 mt-3">{profile.disclaimer}</p></div></div></section>;
}

