const TRANSITIONS = {
  draft_for_human_approval: new Set(['approved', 'rejected', 'cancelled']),
  approved: new Set(['in_execution', 'rejected', 'cancelled']),
  in_execution: new Set(['completed', 'cancelled']),
  completed: new Set(),
  rejected: new Set(),
  cancelled: new Set(),
};

export const ACTION_PLAN_STATUSES = Object.freeze(Object.keys(TRANSITIONS));
export const HUMAN_APPROVAL_VALUES = Object.freeze(['pending_review', 'approved', 'rejected']);

export function validateActionPlanPatch(current, patch = {}) {
  const nextStatus = patch.status === undefined ? current.status : String(patch.status);
  if (!ACTION_PLAN_STATUSES.includes(nextStatus)) throw new Error(`Estado de plan inválido: ${nextStatus}`);
  if (nextStatus !== current.status && !TRANSITIONS[current.status]?.has(nextStatus)) {
    throw new Error(`Transición no permitida: ${current.status} -> ${nextStatus}`);
  }
  if (patch.humanApproval !== undefined && !HUMAN_APPROVAL_VALUES.includes(String(patch.humanApproval))) {
    throw new Error(`Aprobación humana inválida: ${patch.humanApproval}`);
  }
  const humanApproval = patch.humanApproval === undefined ? current.humanApproval : String(patch.humanApproval);
  if (nextStatus === 'approved' && humanApproval !== 'approved') {
    throw new Error('Un plan requiere aprobación humana explícita antes de aprobarse');
  }
  if (nextStatus === 'rejected' && humanApproval !== 'rejected') {
    throw new Error('Un plan rechazado requiere registrar humanApproval=rejected');
  }
  if (nextStatus === 'completed') {
    const outcome = patch.outcome === undefined ? current.outcome : String(patch.outcome).trim();
    if (!outcome) throw new Error('Un plan completado requiere outcome verificable');
  }
  return { nextStatus, humanApproval };
}
