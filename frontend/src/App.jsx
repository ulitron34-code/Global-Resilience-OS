import { useEffect, useState } from 'react';
import Header from './components/Header';
import KpiBar from './components/KpiBar';
import CableList from './components/CableList';
import WorldMap from './components/WorldMap';
import ScenarioBuilder from './components/ScenarioBuilder';
import ImpactPanel from './components/ImpactPanel';
import ReportExport from './components/ReportExport';
import AlertQueue from './components/AlertQueue';
import PlatformNav from './components/PlatformNav';
import ContextBar from './components/ContextBar';
import { CasesView, ExecutiveBriefView, NetworkExposureView, OperationsView, ScenarioLabView } from './components/PlatformViews';
import { useAppStore } from './store/useAppStore';
import { useSessionStore } from './store/useSessionStore';

export default function App() {
  const [activeSection, setActiveSection] = useState('command-center');
  const [context, setContext] = useState({ vertical: 'Oil & Gas', region: 'global', horizon: '72' });
  const initBackendCheck = useAppStore((s) => s.initBackendCheck);
  const user = useSessionStore((s) => s.user);

  useEffect(() => {
    initBackendCheck();
    const openCases = () => setActiveSection('cases');
    window.addEventListener('open-cases', openCases);
    return () => window.removeEventListener('open-cases', openCases);
  }, [initBackendCheck]);

  useEffect(() => {
    if (user?.role === 'viewer' && activeSection === 'operations') setActiveSection('command-center');
  }, [user, activeSection]);

  const goToScenario = () => setActiveSection('scenario-lab');

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <Header />
      <PlatformNav activeSection={activeSection} onChange={setActiveSection} user={user} />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-5 flex flex-col gap-4">
        <ContextBar context={context} onChange={(patch) => setContext((current) => ({ ...current, ...patch }))} />
        {activeSection === 'command-center' && <CommandCenter onScenario={goToScenario} region={context.region} vertical={context.vertical} />}
        {activeSection === 'network' && <NetworkExposureView onScenario={goToScenario} />}
        {activeSection === 'scenario-lab' && <ScenarioLabView />}
        {activeSection === 'cases' && <CasesView vertical={context.vertical} />}
        {activeSection === 'brief' && <ExecutiveBriefView onScenario={goToScenario} vertical={context.vertical} region={context.region} horizon={context.horizon} />}
        {activeSection === 'operations' && <OperationsView />}
      </main>
      <footer className="border-t border-line py-4"><div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-ink-dim font-mono"><span>GLOBAL RESILIENCE OS · Demo funcional del concepto</span><span>Datos de flujo y rutas: estimaciones ilustrativas.</span></div></footer>
    </div>
  );
}

function CommandCenter({ onScenario, region, vertical }) {
  const openCases = () => window.dispatchEvent(new CustomEvent('open-cases'));
  return <div className="flex flex-col gap-4"><div className="flex items-end justify-between gap-4"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal mb-1">{vertical} · {region === 'global' ? 'Global' : region} · MVP vertical-first</div><h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-ink">Command Center</h1></div><button onClick={onScenario} className="hidden sm:flex items-center gap-2 border border-signal/40 text-signal rounded px-3 py-2 text-xs hover:bg-signal/10">Abrir Scenario Lab</button></div><KpiBar vertical={vertical} /><div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_360px] gap-4 flex-1 min-h-[560px]"><div className="order-2 lg:order-1 h-[400px] lg:h-auto"><CableList /></div><div className="order-1 lg:order-2 h-[420px] lg:h-auto"><WorldMap /></div><div className="order-3 flex flex-col gap-4"><ScenarioBuilder /><ImpactPanel /><ReportExport /></div></div><AlertQueue onOpenCases={openCases} region={region} vertical={vertical} /></div>;
}
