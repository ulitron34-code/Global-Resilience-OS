import { useState } from 'react';
import { Building2, Pencil, Ship, AlertTriangle, ArrowRight } from 'lucide-react';
import { useCompanyProfileStore } from '../store/useCompanyProfileStore';
import { useAppStore } from '../store/useAppStore';
import { VERTICALS, VERTICAL_MAP } from '../data/verticals';
import { SECTOR_PROFILES, REGIONS } from '../data/sectorProfiles';
import { CABLES } from '../data/cables';
import { MARITIME_ROUTES } from '../data/maritimeRoutes';
import { formatUsd } from '../engine/impactEngine';

function ProfileForm({ initial, onSave }) {
  const [verticalId, setVerticalId] = useState(initial?.verticalId || VERTICALS[0].id);
  const [regionId, setRegionId] = useState(initial?.regionId || REGIONS[0].id);
  const [companyName, setCompanyName] = useState(initial?.companyName || '');
  const [annualRevenueUsd, setAnnualRevenueUsd] = useState(initial?.annualRevenueUsd ?? '');
  const [importExportSharePct, setImportExportSharePct] = useState(initial?.importExportSharePct ?? 30);

  return (
    <div className="bg-panel border border-line rounded-lg p-6 max-w-xl">
      <div className="font-mono text-[10px] uppercase tracking-widest text-signal mb-1">Configura tu huella</div>
      <h2 className="font-display text-xl font-semibold text-ink mb-1">¿A qué se dedica tu operación?</h2>
      <p className="text-xs text-ink-muted mb-5">
        Esto no crea una cuenta ni se envía a ningún servidor — se guarda solo en este navegador,
        para traducir el mapa global a tu sector y tu región.
      </p>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Nombre de tu empresa o planta (opcional)
          <input
            className="control"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Ej. Planta Norte S.A. de C.V."
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Tu industria / vertical
          <select className="control" value={verticalId} onChange={(e) => setVerticalId(e.target.value)}>
            {VERTICALS.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Dónde está tu operación
          <select className="control" value={regionId} onChange={(e) => setRegionId(e.target.value)}>
            {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </label>
        <div className="border-t border-line mt-1 pt-3">
          <p className="text-[11px] text-ink-dim mb-2">
            Opcional — solo para traducir el impacto a un número en dólares de TU operación,
            no del sector global:
          </p>
          <label className="flex flex-col gap-1 text-xs text-ink-muted">
            Ingreso anual aproximado que depende de comercio internacional (USD)
            <input
              className="control"
              type="number"
              min="0"
              step="1000"
              value={annualRevenueUsd}
              onChange={(e) => setAnnualRevenueUsd(e.target.value)}
              placeholder="Ej. 5000000"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink-muted mt-3">
            ¿Qué % de tus insumos o ventas depende de comercio internacional? {importExportSharePct}%
            <input
              className="w-full"
              type="range"
              min="0"
              max="100"
              step="5"
              value={importExportSharePct}
              onChange={(e) => setImportExportSharePct(Number(e.target.value))}
            />
          </label>
        </div>
        <button
          onClick={() => onSave({
            verticalId,
            regionId,
            companyName: companyName.trim(),
            annualRevenueUsd: annualRevenueUsd === '' ? null : Number(annualRevenueUsd),
            importExportSharePct,
          })}
          className="bg-signal text-void rounded px-4 py-2.5 text-sm font-semibold mt-2"
        >
          Ver mi impacto
        </button>
      </div>
    </div>
  );
}

export default function MyImpactPanel({ onScenario }) {
  const profile = useCompanyProfileStore((s) => s.profile);
  const saveProfile = useCompanyProfileStore((s) => s.saveProfile);
  const clearProfile = useCompanyProfileStore((s) => s.clearProfile);
  const result = useAppStore((s) => s.result);
  const [editing, setEditing] = useState(false);

  if (!profile || editing) {
    return (
      <section className="flex flex-col gap-4">
        <ProfileForm
          initial={profile}
          onSave={(p) => { saveProfile(p); setEditing(false); }}
        />
      </section>
    );
  }

  const vertical = VERTICAL_MAP[profile.verticalId];
  const sector = SECTOR_PROFILES[profile.verticalId] || { archetype: 'tu sector', primaryPorts: [], keyRouteIds: [] };
  const region = REGIONS.find((r) => r.id === profile.regionId) || REGIONS[0];

  const correlatedCables = CABLES
    .map((c) => ({ cable: c, weight: c.vertical_weights[profile.verticalId] || 0 }))
    .filter((c) => c.weight > 0.3)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  const relatedRoutes = MARITIME_ROUTES.filter((r) => sector.keyRouteIds.includes(r.id));

  const mine = result?.affected?.find((a) => a.id === profile.verticalId);

  let personalUsdAtRisk = null;
  if (mine && profile.annualRevenueUsd) {
    const personalDailyExposedRevenue = (profile.annualRevenueUsd / 365) * ((profile.importExportSharePct ?? 30) / 100);
    personalUsdAtRisk = personalDailyExposedRevenue * mine.impactPct * (result.durationHours / 24);
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-signal mb-1 flex items-center gap-1.5">
            <Building2 size={12} /> Mi Impacto
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-ink">
            {profile.companyName || `Tu operación de ${vertical.label}`}
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            {vertical.label} · {region.label} · {sector.archetype}
          </p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 flex items-center gap-1.5 border border-line rounded px-3 py-2 text-xs text-ink-muted hover:text-ink"
        >
          <Pencil size={12} /> Editar
        </button>
      </div>

      {mine ? (
        <div className="border border-alert/40 bg-alert/5 rounded-lg p-5">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-alert">
            <AlertTriangle size={13} /> Escenario activo · {result.cable?.name}
          </div>
          <p className="text-sm text-ink mt-3 leading-relaxed">
            Si esta disrupción ocurriera hoy, tu vertical ({vertical.label}) perdería
            aproximadamente <b className="text-alert">{formatUsd(mine.usdLoss)}</b> en
            las próximas {result.durationHours}h — el equivalente a un{' '}
            <b>{(mine.impactPct * 100).toFixed(1)}%</b> del flujo diario global de tu sector.
          </p>
          <p className="text-xs text-ink-muted mt-2">
            Nivel de exposición: {mine.tier === 'direct' ? 'directa — tu sector depende fuertemente de esta ruta o infraestructura' : mine.tier === 'moderate' ? 'moderada — dependencia parcial' : 'sistémica — llega por infraestructura compartida (coordinación logística, pagos, seguimiento de carga), no por una ruta física directa'}.
          </p>
          {personalUsdAtRisk !== null ? (
            <div className="mt-4 border-t border-alert/20 pt-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-1">
                Traducido a tu operación ({profile.companyName || 'tu empresa'})
              </div>
              <div className="font-display font-bold text-2xl text-alert leading-none">{formatUsd(personalUsdAtRisk)}</div>
              <p className="text-[11px] text-ink-dim mt-1.5 leading-relaxed">
                Estimación derivada: {profile.importExportSharePct ?? 30}% de tu ingreso anual declarado
                ({formatUsd(profile.annualRevenueUsd)}) tratado con la misma proporción de exposición
                que el modelo calculó para {vertical.label} en {result.durationHours}h. No es un cálculo
                certificado — es tu propio número aplicando el mismo supuesto que usa la plataforma para
                todo el sector.
              </p>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="mt-4 text-[11px] text-signal hover:underline"
            >
              + Agrega tu ingreso anual para ver esto en dólares de tu propia operación
            </button>
          )}
        </div>
      ) : (
        <div className="border border-line bg-panel rounded-lg p-5">
          <p className="text-sm text-ink-muted leading-relaxed">
            Hoy no hay ningún escenario activo, así que esto es tu contexto base: globalmente, tu
            industria mueve alrededor de <b className="text-ink">{formatUsd(vertical.dailyFlowUsd)}</b> por
            día. Corre una simulación en Scenario Lab para ver, en dólares, cuánto de eso quedaría
            en riesgo específicamente para tu vertical si un cable o un paso marítimo crítico fallara.
          </p>
          {onScenario && (
            <button
              onClick={onScenario}
              className="mt-4 flex items-center gap-1.5 border border-signal/40 text-signal rounded px-3 py-2 text-xs hover:bg-signal/10"
            >
              Ir a Scenario Lab <ArrowRight size={12} />
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-panel border border-line rounded-lg p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-2">Tus 3 puntos de mayor exposición</div>
          {correlatedCables.length ? (
            <div className="flex flex-col gap-2">
              {correlatedCables.map(({ cable, weight }) => (
                <div key={cable.id} className="flex items-center justify-between text-xs border border-line/60 rounded px-2.5 py-2">
                  <span className="text-ink">{cable.name}</span>
                  <span className="font-mono text-signal">{Math.round(weight * 100)}% correlación</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-dim">Tu vertical depende sobre todo del piso sistémico compartido, no de un cable específico.</p>
          )}
        </div>
        <div className="bg-panel border border-line rounded-lg p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-2 flex items-center gap-1.5">
            <Ship size={12} /> Rutas marítimas de tu sector
          </div>
          {relatedRoutes.length ? (
            <div className="flex flex-col gap-2">
              {relatedRoutes.map((r) => (
                <div key={r.id} className="text-xs border border-line/60 rounded px-2.5 py-2">
                  <div className="text-ink">{r.name}</div>
                  <div className="text-ink-dim mt-0.5">{r.origin} → {r.destination} · {r.cargoType}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-dim">Tu vertical no está atado a una ruta marítima única — revisa el mapa del Command Center.</p>
          )}
          {sector.primaryPorts.length > 0 && (
            <p className="text-[11px] text-ink-dim mt-2">Puertos de referencia: {sector.primaryPorts.join(', ')}</p>
          )}
        </div>
      </div>

      <p className="text-[10px] text-ink-dim border-t border-line pt-3">
        Esta vista traduce el mismo modelo ilustrativo de la plataforma a tu contexto — no sustituye
        un estudio de continuidad de negocio real. Las cifras dependen de datos de orden de magnitud,
        no de un proveedor de mercado en vivo (ver la sección "¿Qué resuelve de verdad?" del manual).
      </p>
      <button onClick={clearProfile} className="self-start text-[10px] text-ink-dim hover:text-alert underline">
        Borrar mi perfil de este navegador
      </button>
    </section>
  );
}
