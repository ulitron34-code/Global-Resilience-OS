import { Activity, WifiOff, Wifi } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import SessionControl from './SessionControl';
import NotificationCenter from './NotificationCenter';
import { isBackendRequired } from '../api/client';

export default function Header() {
  const backendStatus = useAppStore((s) => s.backendStatus);

  return (
    <header className="border-b border-line bg-panel">
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded border border-signal/40 bg-signal/10 flex items-center justify-center">
            <Activity size={18} className="text-signal" strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-display font-semibold text-lg leading-none tracking-tight text-ink">
              GLOBAL RESILIENCE OS
            </h1>
            <p className="font-mono text-[11px] text-ink-muted mt-1 tracking-wide">
              Inteligencia de riesgo sistémico para cadenas críticas de suministro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-signal bg-signal/10 border border-signal/30 rounded px-2.5 py-1 animate-pulse">
            SISTEMA ACTIVO · PRODUCCIÓN
          </span>
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
    online: { icon: Wifi, label: 'NÚCLEO NUBE CONECTADO', color: 'text-signal', bg: 'bg-signal/10', border: 'border-signal/30' },
    offline: { icon: WifiOff, label: isBackendRequired() ? 'NÚCLEO EN NUBE DESCONECTADO' : 'NÚCLEO LOCAL ACTIVO', color: 'text-alert', bg: 'bg-alert/10', border: 'border-alert/30' },
    unknown: { icon: Activity, label: 'Verificando...', color: 'text-ink-muted', bg: 'bg-raised', border: 'border-line' },
  }[status] || {};

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest ${config.color} ${config.bg} border ${config.border} rounded px-2.5 py-1`}>
      <Icon size={11} />
      {config.label}
    </span>
  );
}
