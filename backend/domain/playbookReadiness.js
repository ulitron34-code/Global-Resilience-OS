export const INITIAL_VERTICALS = [
  { id: 'digital-infrastructure', label: 'Infraestructura digital crítica' },
  { id: 'maritime-corridors', label: 'Corredores marítimos' },
  { id: 'critical-commodities', label: 'Commodities críticos' },
];

export const REQUIRED_PLAYBOOKS_PER_VERTICAL = 5;

export function buildPlaybookReadiness(playbooks = []) {
  const items = Array.isArray(playbooks) ? playbooks : [];
  const coverage = INITIAL_VERTICALS.map((vertical) => {
    const matching = items.filter((playbook) => !Array.isArray(playbook.verticals) || playbook.verticals.includes(vertical.id));
    return { ...vertical, requiredPlaybooks: REQUIRED_PLAYBOOKS_PER_VERTICAL, playbookCount: matching.length, playbookIds: matching.map((playbook) => playbook.id), pass: matching.length >= REQUIRED_PLAYBOOKS_PER_VERTICAL };
  });
  const ready = coverage.every((item) => item.pass);
  return { schemaVersion: '1.0.0-local-playbook-readiness', status: ready ? 'ready_for_local_pilot' : 'missing_vertical_coverage', requiredPlaybooksPerVertical: REQUIRED_PLAYBOOKS_PER_VERTICAL, verticals: coverage, externalExecution: 'blocked_until_human_approval', disclaimer: 'La cobertura local no confirma disponibilidad de proveedores, capacidad operativa ni integración externa.' };
}
