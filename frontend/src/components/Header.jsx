import { Activity, WifiOff, Wifi } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import SessionControl from './SessionControl';
import NotificationCenter from './NotificationCenter';
import { isBackendRequired } from '../api/client';
import LanguageToggle from '../i18n/LanguageToggle';

export default function Header() {
  const backendStatus = useAppStore((s) => s.backendStatus);

  return (
    <header className="border-b border-line bg-panel/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-6 py-3.5 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl border border-champagne/45 flex items-center justify-center bg-gradient-to-br from-champagne/15 to-aqua/5 shrink-0">
            <svg viewBox="0 0 40 40" fill="none" width="22" height="22">
              <path d="M8 31V9l24 22V9" stroke="#C6A66A" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 9l24 22" stroke="#43B8C4" strokeWidth="1" opacity=".7"/>
            </svg>
          </span>
          <div>
            <h1 className="font-serif font-bold text-xl leading-none tracking-wider text-ivory">
              GLOBAL RESILIENCE OS
            </h1>
            <p className="font-mono text-[10px] text-champagne uppercase tracking-[0.2em] mt-1 font-semibold">
              Systemic Risk Intelligence & Critical Infrastructure
            </p>
          </div>
          <span
            className="hidden sm:inline-flex items-center font-mono text-[9px] uppercase tracking-widest border border-alert/40 text-alert bg-alert/10 rounded-full px-2.5 py-1"
            title="Los flujos, correlaciones y rutas mostradas son datos ilustrativos de orden de magnitud, no un feed de mercado en vivo. Ver docs/LIMITACIONES.md."
          >
            Demo · Datos ilustrativos
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`hidden md:inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest border rounded-full px-3 py-1 ${
            backendStatus === 'online' 
              ? 'text-aqua bg-aqua/10 border-aqua/30' 
              : 'text-champagne bg-champagne/10 border-champagne/30'
          }`}>
            {backendStatus === 'online' ? 'SYSTEM ACTIVE · CLOUD' : 'CONTINGENCY SYSTEM · STANDALONE'}
          </span>
          <LanguageToggle />
          <NotificationCenter />
          <SessionControl />
          <StatusPill status={backendStatus} />
        </div>
      </div>
    </header>
  );
}

function StatusPill({ status }) {
  const config = {
    online: { icon: Wifi, label: 'CLOUD CORE CONNECTED', color: 'text-aqua', bg: 'bg-aqua/10', border: 'border-aqua/30' },
    offline: { icon: WifiOff, label: isBackendRequired() ? 'CLOUD CORE DISCONNECTED' : 'LOCAL CORE ACTIVE', color: 'text-champagne', bg: 'bg-champagne/10', border: 'border-champagne/30' },
    unknown: { icon: Activity, label: 'Checking...', color: 'text-ink-muted', bg: 'bg-raised', border: 'border-line' },
  }[status] || {};

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest ${config.color} ${config.bg} border ${config.border} rounded-full px-3 py-1`}>
      <Icon size={11} />
      {config.label}
    </span>
  );
}
