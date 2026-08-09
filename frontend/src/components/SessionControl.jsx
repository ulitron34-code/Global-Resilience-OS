import { useEffect, useState } from 'react';
import { LogIn, LogOut, UserRound, X } from 'lucide-react';
import { useSessionStore } from '../store/useSessionStore';

export default function SessionControl() {
  const { user, isLoading, error, restore, signIn, signOut } = useSessionStore();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('analyst@resilience.local');
  const [password, setPassword] = useState('demo123');
  useEffect(() => { restore(); }, [restore]);

  if (user) return <div className="relative"><button onClick={() => setOpen((current) => !current)} className="inline-flex items-center gap-2 border border-signal/30 bg-signal/5 rounded px-2.5 py-1.5 text-[10px] text-signal"><UserRound size={12} />{user.name}<span className="font-mono text-[9px] opacity-70">{user.role}</span></button>{open && <div className="absolute right-0 top-9 z-20 w-56 bg-panel border border-line rounded-lg p-3 shadow-xl"><div className="text-xs text-ink">{user.email}</div><div className="text-[11px] text-ink-muted mt-1">Las acciones operativas usan tu rol actual.</div><button onClick={() => { signOut(); setOpen(false); }} className="mt-3 flex items-center gap-2 text-xs text-alert"><LogOut size={13} />Cerrar sesión</button></div>}</div>;

  return <div className="relative"><button onClick={() => setOpen((current) => !current)} className="inline-flex items-center gap-1.5 border border-line rounded px-2.5 py-1.5 text-[10px] text-ink-muted hover:text-ink"><LogIn size={12} />Acceso demo</button>{open && <form onSubmit={async (event) => { event.preventDefault(); const signedIn = await signIn(email, password); if (signedIn) setOpen(false); }} className="absolute right-0 top-9 z-20 w-64 bg-panel border border-line rounded-lg p-4 shadow-xl"><div className="flex items-center justify-between"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Acceso local</div><button type="button" onClick={() => setOpen(false)}><X size={13} className="text-ink-dim" /></button></div><input value={email} onChange={(event) => setEmail(event.target.value)} className="control mt-3" placeholder="Correo" type="email" /><input value={password} onChange={(event) => setPassword(event.target.value)} className="control mt-2" placeholder="Contraseña" type="password" />{error && <div className="text-[11px] text-alert mt-2">{error}</div>}<button disabled={isLoading} className="w-full mt-3 bg-signal text-void rounded py-2 text-xs font-semibold">{isLoading ? 'Validando...' : 'Entrar'}</button><div className="text-[10px] text-ink-dim mt-2">Demo: analyst@resilience.local / demo123</div></form>}</div>;
}
