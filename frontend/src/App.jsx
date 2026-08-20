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
import MyImpactPanel from './components/MyImpactPanel';
import DecisionRoom from './components/DecisionRoom';
import { useAppStore } from './store/useAppStore';
import { useSessionStore } from './store/useSessionStore';
import { getStoredLanguage, installSpanishTranslator } from './i18n/domTranslator';

export default function App() {
  const shareToken = window.location.pathname.match(/^\/share\/([^/]+)$/)?.[1];
  const [activeSection, setActiveSection] = useState('command-center');
  const [context, setContext] = useState({ vertical: 'All', region: 'global', horizon: '72' });
  const initBackendCheck = useAppStore((s) => s.initBackendCheck);
  const user = useSessionStore((s) => s.user);

  useEffect(() => {
    document.documentElement.lang = getStoredLanguage();
    if (getStoredLanguage() === 'es') return installSpanishTranslator();
    return undefined;
  }, []);

  useEffect(() => {
    if (!shareToken) initBackendCheck();
    const openCases = () => setActiveSection('cases');
    window.addEventListener('open-cases', openCases);
    return () => window.removeEventListener('open-cases', openCases);
  }, [initBackendCheck, shareToken]);

  useEffect(() => {
    if (user?.role === 'viewer' && activeSection === 'operations') setActiveSection('command-center');
  }, [user, activeSection]);

  const goToScenario = () => setActiveSection('scenario-lab');

  if (shareToken) return <DecisionRoom token={shareToken} />;

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
        {activeSection === 'my-impact' && <MyImpactPanel onScenario={goToScenario} />}
        {activeSection === 'operations' && <OperationsView />}
      </main>
      <footer className="border-t border-line py-4"><div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-ink-dim font-mono"><span>GLOBAL RESILIENCE OS · Systemic Monitoring for Critical Infrastructure</span><span>Demo — flujos y rutas ilustrativos. Conectores reales documentados en el roadmap.</span></div></footer>
    </div>
  );
}

function CommandCenter({ onScenario, region, vertical }) {
  const openCases = () => window.dispatchEvent(new CustomEvent('open-cases'));
  return <div className="flex flex-col gap-4"><div className="flex items-end justify-between gap-4"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal mb-1">{vertical} · {region === 'global' ? 'Global' : region} · SYSTEMIC MONITORING CORE</div><h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-ink">Command Center</h1></div><button onClick={onScenario} className="hidden sm:flex items-center gap-2 border border-signal/40 text-signal rounded px-3 py-2 text-xs hover:bg-signal/10">Open Scenario Lab</button></div><KpiBar vertical={vertical} /><div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_360px] gap-4 flex-1 min-h-[560px]"><div className="order-2 lg:order-1 h-[400px] lg:h-[560px]"><CableList /></div><div className="order-1 lg:order-2 h-[420px] lg:h-[560px]"><WorldMap /></div><div className="order-3 flex flex-col gap-4"><ScenarioBuilder /><ImpactPanel /><ReportExport /></div></div><AlertQueue onOpenCases={openCases} region={region} vertical={vertical} /></div>;
}



